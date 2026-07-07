package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/ahnara/antifake/backend/pkg/crypto"
	"github.com/ahnara/antifake/backend/pkg/db"
	"github.com/ahnara/antifake/backend/pkg/email"
	"github.com/ahnara/antifake/backend/pkg/middleware"
	"github.com/ahnara/antifake/backend/pkg/models"
	"github.com/ahnara/antifake/backend/pkg/termii"
	"github.com/ahnara/antifake/backend/pkg/whatsapp"
)

type RegisterReq struct {
	ProducerName string `json:"producer_name"`
	ProducerSlug string `json:"producer_slug"`
	ContactEmail string `json:"contact_email"`
	PlanTier     string `json:"plan_tier"`
	Email        string `json:"email"`
	Password     string `json:"password"`
}

type LoginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type OTPReq struct {
	Token   string `json:"token"`
	Phone   string `json:"phone"`
	Channel string `json:"channel"`
}

type OTPVerifyReq struct {
	Token string `json:"token"`
	Phone string `json:"phone"`
	Code  string `json:"code"`
}

// In-memory OTP storage (thread-safe)
var (
	otpStore = make(map[string]string) // phone -> code
	otpMutex sync.RWMutex

	emailOtpStore = make(map[string]string) // email -> code
	emailOtpMutex sync.RWMutex
)

func main() {
	// Initialize Database
	db.InitDB()
	defer db.DB.Close()

	// Seed random number generator
	rand.Seed(time.Now().UnixNano())

	// Initialize WhatsApp client
	go whatsapp.InitWhatsApp()

	// Create a router
	mux := http.NewServeMux()

	// Register Routes
	mux.HandleFunc("/api/auth/register", handleRegister)
	mux.HandleFunc("/api/auth/login", handleLogin)
	mux.HandleFunc("/api/auth/otp/request", handleOTPRequest)
	mux.HandleFunc("/api/auth/otp/verify", handleOTPVerify)
	mux.HandleFunc("/api/auth/whatsapp/webhook", handleWhatsAppWebhook)
	mux.HandleFunc("/api/auth/email/verify", handleVerifyEmail)
	mux.HandleFunc("/api/auth/email/resend", handleResendEmailVerify)
	mux.Handle("/api/auth/me", middleware.RequireAuth(http.HandlerFunc(handleMe)))
	mux.Handle("/api/auth/change-password", middleware.RequireAuth(http.HandlerFunc(handleChangePassword)))
	mux.Handle("/api/auth/admin/support-submissions", middleware.RequireAuth(http.HandlerFunc(handleAdminSupportSubmissions)))

	// Admin route to seed default data if DB is empty
	mux.HandleFunc("/api/auth/seed", handleSeedData)
	mux.HandleFunc("/api/auth/whatsapp/status", handleWhatsAppStatus)
	mux.HandleFunc("/api/auth/support/submit", handleSupportSubmit)

	log.Println("Auth Service starting on port 8081...")
	log.Fatal(http.ListenAndServe(":8081", middleware.CORS(mux)))
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req RegisterReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.ProducerName == "" || req.ProducerSlug == "" || req.Email == "" || req.Password == "" {
		http.Error(w, `{"error": "Missing required fields"}`, http.StatusBadRequest)
		return
	}

	if req.ContactEmail == "" {
		req.ContactEmail = req.Email
	}

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Database error: %v"}`, err), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// 1. Create Producer
	planTier := req.PlanTier
	if planTier == "" {
		planTier = "free"
	}
	var producerID int64
	producerQuery := `INSERT INTO producers (name, slug, plan_tier, contact_email, status, created_at) 
		VALUES (?, ?, ?, ?, ?, ?)`

	// MySQL returns last insert row ID differently than Postgres, so we check driver style
	res, err := tx.Exec(producerQuery, req.ProducerName, req.ProducerSlug, planTier, req.ContactEmail, "pending_verification", time.Now())
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Failed to create producer (slug might be taken): %v"}`, err), http.StatusBadRequest)
		return
	}
	producerID, err = res.LastInsertId()
	if err != nil {
		// Postgres driver Exec doesn't support LastInsertId on Exec, let's use QueryRow if Postgres
		// But Exec works on MySQL. Let's do a backup query if producerID is 0
		var id int
		err = tx.QueryRow(`SELECT id FROM producers WHERE slug = ?`, req.ProducerSlug).Scan(&id)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Failed to fetch producer: %v"}`, err), http.StatusInternalServerError)
			return
		}
		producerID = int64(id)
	}

	// 2. Hash Password and Create User
	pwdHash, err := crypto.HashPassword(req.Password)
	if err != nil {
		http.Error(w, `{"error": "Failed to hash password"}`, http.StatusInternalServerError)
		return
	}

	userQuery := `INSERT INTO users (email, password_hash, role, producer_id, status, created_at) 
		VALUES (?, ?, ?, ?, ?, ?)`
	_, err = tx.Exec(userQuery, req.Email, pwdHash, string(models.RoleProducer), producerID, models.StatusActive, time.Now())
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "User email already exists: %v"}`, err), http.StatusBadRequest)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, `{"error": "Transaction commit failed"}`, http.StatusInternalServerError)
		return
	}

	// Generate 6-digit email verification code
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	emailOtpMutex.Lock()
	emailOtpStore[req.Email] = code
	emailOtpMutex.Unlock()

	// Send verification email to client in background
	go func() {
		err := email.SendEmailVerificationCode(req.Email, code)
		if err != nil {
			log.Printf("[Email Verification Error] Failed to send verification code to %s: %v", req.Email, err)
		}
	}()

	// Send registration notification email to platform administrator in background
	go func() {
		err := email.SendProducerSignupNotification(req.ProducerName, req.Email, planTier)
		if err != nil {
			log.Printf("[Notification Error] Failed to send admin email alert: %v", req.Email)
		}
	}()

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Producer and user registered successfully. Verification email sent.",
		"producer_id": producerID,
		"email":       req.Email,
	})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req LoginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	var u models.User
	var producerStatus sql.NullString
	query := `SELECT u.id, u.email, u.password_hash, u.role, u.producer_id, u.status, p.status 
	          FROM users u 
	          LEFT JOIN producers p ON u.producer_id = p.id 
	          WHERE u.email = ?`
	err := db.DB.QueryRow(query, req.Email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.ProducerID, &u.Status, &producerStatus)
	if err == sql.ErrNoRows {
		http.Error(w, `{"error": "Invalid credentials"}`, http.StatusUnauthorized)
		return
	} else if err != nil {
		log.Printf("Login database query failure: %v", err)
		http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		return
	}

	if u.Status == models.StatusSuspended || (producerStatus.Valid && producerStatus.String == "suspended") {
		http.Error(w, `{"error": "Account has been suspended"}`, http.StatusForbidden)
		return
	}

	if !crypto.CheckPasswordHash(req.Password, u.PasswordHash) {
		http.Error(w, `{"error": "Invalid credentials"}`, http.StatusUnauthorized)
		return
	}

	token, err := crypto.GenerateJWT(u.ID, string(u.Role), u.ProducerID)
	if err != nil {
		http.Error(w, `{"error": "Failed to generate session token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":           token,
		"role":            u.Role,
		"producer_id":     u.ProducerID,
		"email":           u.Email,
		"producer_status": producerStatus.String,
	})
}

func handleOTPRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req OTPReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.Phone == "" || req.Token == "" {
		http.Error(w, `{"error": "Missing phone or verification token"}`, http.StatusBadRequest)
		return
	}

	// SMS channel plan enforcement check
	if strings.ToLower(req.Channel) == "sms" {
		var planTier string
		err := db.DB.QueryRow(`
			SELECT COALESCE(pr.plan_tier, '') FROM qr_codes q
			JOIN batches b ON q.batch_id = b.id
			JOIN products p ON b.product_id = p.id
			JOIN producers pr ON p.producer_id = pr.id
			WHERE q.token = ?`, req.Token).Scan(&planTier)
		if err == nil && strings.ToLower(planTier) != "starter" {
			http.Error(w, `{"error": "SMS verification is only available on the Starter plan. Please request verification code via WhatsApp."}`, http.StatusBadRequest)
			return
		}
	}

	// In production, we'd send via SMS. For demo, we'll generate a code and log it.
	// Allow 123456 as a default shortcut for testing.
	code := fmt.Sprintf("%06d", rand.Intn(900000)+100000)
	
	// Keep a predictable code for the default mockup QR
	if req.Token == "9F3C-71AE" {
		code = "123456"
	}

	otpMutex.Lock()
	otpStore[req.Phone] = code
	otpMutex.Unlock()

	log.Printf("[OTP] Generated code %s for consumer phone %s for token %s via %s", code, req.Phone, req.Token, req.Channel)

	// Send real OTP via selected channel
	var dispatchStatus = "mock_sent"
	var dispatchError = ""

	if strings.ToLower(req.Channel) == "sms" {
		// Use Termii's secure Send Token API instead of standard SMS
		pinID, err := termii.SendToken(req.Phone, req.Token)
		if err != nil {
			log.Printf("[Termii SMS] Failed to send OTP token to %s: %v", req.Phone, err)
			dispatchStatus = "failed"
			dispatchError = err.Error()
		} else {
			dispatchStatus = "sms_sent"
			otpMutex.Lock()
			otpStore[req.Phone] = "termii_pin_id:" + pinID
			otpMutex.Unlock()
			log.Printf("[Termii SMS] Sent token to %s, PinID: %s", req.Phone, pinID)
		}
	} else {
		err := whatsapp.SendOTP(req.Phone, code, req.Token)
		if err != nil {
			log.Printf("[WhatsApp] Failed to send OTP to %s: %v", req.Phone, err)
			dispatchStatus = "failed"
			dispatchError = err.Error()
		} else {
			dispatchStatus = "whatsapp_sent"
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "sent",
		"message":         fmt.Sprintf("OTP request received. For testing, use code: %s", code),
		"whatsapp_status": dispatchStatus,
		"whatsapp_error":  dispatchError,
	})
}

func handleOTPVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req OTPVerifyReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.Phone == "" || req.Code == "" || req.Token == "" {
		http.Error(w, `{"error": "Missing fields"}`, http.StatusBadRequest)
		return
	}

	otpMutex.RLock()
	cachedCode, ok := otpStore[req.Phone]
	otpMutex.RUnlock()

	var isVerified = false
	if ok {
		if strings.HasPrefix(cachedCode, "termii_pin_id:") {
			pinID := strings.TrimPrefix(cachedCode, "termii_pin_id:")
			verified, err := termii.VerifyToken(pinID, req.Code)
			if err != nil {
				log.Printf("[Termii SMS] Failed to verify OTP token for %s: %v", req.Phone, err)
			} else {
				isVerified = verified
			}
		} else {
			isVerified = (cachedCode == req.Code)
		}
	}

	// Always allow the master bypass "123456" for testing
	if req.Code == "123456" {
		isVerified = true
	}

	if !isVerified {
		http.Error(w, `{"error": "Invalid OTP code"}`, http.StatusBadRequest)
		return
	}

	// OTP confirmed. Clear it.
	otpMutex.Lock()
	delete(otpStore, req.Phone)
	otpMutex.Unlock()

	// Generate a verification confirmation signature (signed payload) to prove OTP was verified
	// Verification session token contains token + phone + timestamp
	sessionPayload := fmt.Sprintf("%s|%s|%d", req.Token, req.Phone, time.Now().Unix())
	signature := crypto.SignToken(sessionPayload)
	sessionToken := fmt.Sprintf("%s.%s", sessionPayload, signature)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":        "verified",
		"session_token": sessionToken,
	})
}

func handleSeedData(w http.ResponseWriter, r *http.Request) {
	// Seed initial tenant 'AURA Skincare' and admin user
	var count int
	db.DB.QueryRow(`SELECT count(*) FROM producers`).Scan(&count)
	if count > 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Database already seeded."})
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Seed Producer
	res, err := tx.Exec(`INSERT INTO producers (name, slug, plan_tier, contact_email, status, created_at)
		VALUES ('AURA Skincare', 'aura', 'growth', 'hello@auraskin.com', 'active', ?)`, time.Now())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	producerID, _ := res.LastInsertId()
	if producerID == 0 {
		// Postgres fallback
		var pid int
		tx.QueryRow(`INSERT INTO producers (name, slug, plan_tier, contact_email, status, created_at)
			VALUES ('AURA Skincare', 'aura', 'growth', 'hello@auraskin.com', 'active', ?) RETURNING id`, time.Now()).Scan(&pid)
		producerID = int64(pid)
	}

	// Seed Users
	pwdHash, _ := crypto.HashPassword("aura123456")
	_, err = tx.Exec(`INSERT INTO users (email, password_hash, role, producer_id, status, created_at)
		VALUES ('admin@auraskin.com', ?, 'producer', ?, 'active', ?)`, pwdHash, producerID, time.Now())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Seed Platform Admin
	pwdAdminHash, _ := crypto.HashPassword("admin123456")
	_, err = tx.Exec(`INSERT INTO users (email, password_hash, role, producer_id, status, created_at)
		VALUES ('admin@antifakeng.com', ?, 'admin', NULL, 'active', ?)`, pwdAdminHash, time.Now())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Seed Product
	prodRes, err := tx.Exec(`INSERT INTO products (producer_id, name, sku, category, description, image_url, created_at)
		VALUES (?, 'AURA Skincare Serum', 'AURA-SERUM-50ML', 'Cosmetics', 'Premium hydrating skincare serum with Hyaluronic Acid.', '/logo.png', ?)`,
		producerID, time.Now())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	productID, _ := prodRes.LastInsertId()
	if productID == 0 {
		var prid int
		tx.QueryRow(`INSERT INTO products (producer_id, name, sku, category, description, image_url, created_at)
			VALUES (?, 'AURA Skincare Serum', 'AURA-SERUM-50ML', 'Cosmetics', 'Premium hydrating skincare serum with Hyaluronic Acid.', '/logo.png', ?) RETURNING id`,
			producerID, time.Now()).Scan(&prid)
		productID = int64(prid)
	}

	// Seed Batch
	batchRes, err := tx.Exec(`INSERT INTO batches (product_id, batch_code, quantity, manufacture_date, expiry_date, status, created_at)
		VALUES (?, 'B-AUR-2026-01', 5000, ?, ?, 'active', ?)`,
		productID, time.Now(), time.Now().AddDate(2, 0, 0), time.Now())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	batchID, _ := batchRes.LastInsertId()
	if batchID == 0 {
		var bid int
		tx.QueryRow(`INSERT INTO batches (product_id, batch_code, quantity, manufacture_date, expiry_date, status, created_at)
			VALUES (?, 'B-AUR-2026-01', 5000, ?, ?, 'active', ?) RETURNING id`,
			productID, time.Now(), time.Now().AddDate(2, 0, 0), time.Now()).Scan(&bid)
		batchID = int64(bid)
	}

	// Seed a specific test QRCode token "9F3C-71AE"
	sig := crypto.SignToken("9F3C-71AE")
	_, err = tx.Exec(`INSERT INTO qr_codes (batch_id, token, signature, status, created_at)
		VALUES (?, '9F3C-71AE', ?, 'active', ?)`, batchID, sig, time.Now())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tx.Commit()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Database successfully seeded with tenant 'AURA Skincare', test user 'admin@auraskin.com' (password: aura123456), product, batch, and test QR token '9F3C-71AE'.",
	})
}

func handleMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var email, role, status string
	var producerID sql.NullInt64
	err := db.DB.QueryRow(`SELECT email, role, producer_id, status FROM users WHERE id = ?`, userID).Scan(&email, &role, &producerID, &status)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, `{"error": "User not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		}
		return
	}

	roleUpper := strings.ToUpper(role)
	
	// Map to User struct required by front-end
	res := map[string]interface{}{
		"id":    fmt.Sprintf("%d", userID),
		"email": email,
		"name":  roleUpper + " Admin",
		"role":  roleUpper,
	}
	if producerID.Valid {
		res["producer_id"] = producerID.Int64
		// Retrieve producer name
		var prodName string
		db.DB.QueryRow(`SELECT name FROM producers WHERE id = ?`, producerID.Int64).Scan(&prodName)
		if prodName != "" {
			res["name"] = prodName + " Admin"
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleWhatsAppStatus(w http.ResponseWriter, r *http.Request) {
	status := "disconnected"
	if whatsapp.IsConfigured() {
		status = "connected"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": status,
	})
}

func handleSupportSubmit(w http.ResponseWriter, r *http.Request) {
	// Enable CORS (this is a public endpoint)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		FormType  string `json:"form_type"` // contact, report
		Name      string `json:"name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Subject   string `json:"subject"`
		Token     string `json:"token"`
		StoreName string `json:"store_name"`
		Message   string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Insert into support_submissions table
	_, dbErr := db.DB.Exec(`
		INSERT INTO support_submissions (form_type, name, email, phone, subject, token, store_name, message, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
		req.FormType, req.Name, req.Email, req.Phone, req.Subject, req.Token, req.StoreName, req.Message,
	)
	if dbErr != nil {
		log.Printf("Failed to store support submission in database: %v", dbErr)
	}

	// Dispatch notification email to administrator (ifeanyireed@gmail.com)
	err := email.SendSupportNotification(req.FormType, req.Name, req.Email, req.Phone, req.Subject, req.Token, req.StoreName, req.Message)
	if err != nil {
		log.Printf("Failed to dispatch support notification email: %v", err)
		http.Error(w, fmt.Sprintf(`{"error": "Failed to send email notification: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"message": "Notification dispatched successfully",
	})
}

func handleWhatsAppWebhook(w http.ResponseWriter, r *http.Request) {
	// 1. Webhook Verification (GET request from Meta)
	if r.Method == http.MethodGet {
		mode := r.URL.Query().Get("hub.mode")
		token := r.URL.Query().Get("hub.verify_token")
		challenge := r.URL.Query().Get("hub.challenge")

		if mode != "" && token != "" {
			verifyToken := os.Getenv("WHATSAPP_WEBHOOK_VERIFY_TOKEN")
			if verifyToken == "" {
				verifyToken = "antifakeng_secret_verify_token" // secure default fallback
			}

			if mode == "subscribe" && token == verifyToken {
				log.Println("[WhatsApp Webhook] Verification successful!")
				w.Header().Set("Content-Type", "text/plain")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(challenge))
				return
			}
		}
		
		log.Println("[WhatsApp Webhook] Verification failed.")
		w.WriteHeader(http.StatusForbidden)
		return
	}

	// 2. Webhook Event Notifications (POST request from Meta)
	if r.Method == http.MethodPost {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("[WhatsApp Webhook] Error reading body: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		
		// Log raw JSON event payload
		log.Printf("[WhatsApp Webhook] Incoming event: %s", string(body))

		var payload map[string]interface{}
		if err := json.Unmarshal(body, &payload); err != nil {
			log.Printf("[WhatsApp Webhook] Error parsing JSON: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Traverse structure to log status/messaging events
		if entries, ok := payload["entry"].([]interface{}); ok {
			for _, entryItem := range entries {
				if entry, ok := entryItem.(map[string]interface{}); ok {
					if changes, ok := entry["changes"].([]interface{}); ok {
						for _, changeItem := range changes {
							if change, ok := changeItem.(map[string]interface{}); ok {
								if val, ok := change["value"].(map[string]interface{}); ok {
									// Status changes (delivered, read, failed, etc.)
									if statuses, ok := val["statuses"].([]interface{}); ok {
										for _, sItem := range statuses {
											if s, ok := sItem.(map[string]interface{}); ok {
												msgID := s["id"]
												status := s["status"]
												recipient := s["recipient_id"]
												log.Printf("[WhatsApp Status Update] Msg ID: %v | Recipient: %v | Status: %v", msgID, recipient, status)
											}
										}
									}
									
									// Incoming messages (consumer texts the business)
									if messages, ok := val["messages"].([]interface{}); ok {
										for _, mItem := range messages {
											if m, ok := mItem.(map[string]interface{}); ok {
												from := m["from"]
												msgType := m["type"]
												msgID := m["id"]
												
												if msgText, ok := m["text"].(map[string]interface{}); ok {
													body := msgText["body"]
													log.Printf("[WhatsApp Incoming Message] From: %v | ID: %v | Type: %v | Body: %v", from, msgID, msgType, body)
												} else {
													log.Printf("[WhatsApp Incoming Event] From: %v | ID: %v | Type: %v", from, msgID, msgType)
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "success"}`))
		return
	}

	w.WriteHeader(http.StatusMethodNotAllowed)
}

func handleVerifyEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}
	if req.Email == "" || req.Code == "" {
		http.Error(w, `{"error": "Missing email or code"}`, http.StatusBadRequest)
		return
	}

	emailOtpMutex.RLock()
	cachedCode, exists := emailOtpStore[req.Email]
	emailOtpMutex.RUnlock()

	if !exists || cachedCode != req.Code {
		http.Error(w, `{"error": "Invalid or expired verification code"}`, http.StatusBadRequest)
		return
	}

	// Code matches, update status in DB
	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Database error: %v"}`, err), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Find the user's producer ID
	var producerID int
	err = tx.QueryRow(`SELECT producer_id FROM users WHERE email = ?`, req.Email).Scan(&producerID)
	if err != nil {
		http.Error(w, `{"error": "User account not found"}`, http.StatusBadRequest)
		return
	}

	// Update status to pending_payment
	_, err = tx.Exec(`UPDATE producers SET status = 'pending_payment' WHERE id = ?`, producerID)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Failed to update brand status: %v"}`, err), http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, `{"error": "Transaction commit failed"}`, http.StatusInternalServerError)
		return
	}

	// Delete from store
	emailOtpMutex.Lock()
	delete(emailOtpStore, req.Email)
	emailOtpMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Email verified successfully",
	})
}

func handleResendEmailVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}
	if req.Email == "" {
		http.Error(w, `{"error": "Missing email"}`, http.StatusBadRequest)
		return
	}

	// Generate new code
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	emailOtpMutex.Lock()
	emailOtpStore[req.Email] = code
	emailOtpMutex.Unlock()

	// Send in background
	go func() {
		err := email.SendEmailVerificationCode(req.Email, code)
		if err != nil {
			log.Printf("[Email Verification Error] Failed to resend verification code to %s: %v", req.Email, err)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Verification email sent successfully",
	})
}

func handleChangePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized: no user ID found"}`, http.StatusUnauthorized)
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		http.Error(w, `{"error": "Current and new passwords are required"}`, http.StatusBadRequest)
		return
	}

	// Fetch user from DB
	var emailStr, pwdHash string
	err := db.DB.QueryRow(`SELECT email, password_hash FROM users WHERE id = ?`, userID).Scan(&emailStr, &pwdHash)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, `{"error": "User not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		}
		return
	}

	// Verify current password
	if !crypto.CheckPasswordHash(req.CurrentPassword, pwdHash) {
		http.Error(w, `{"error": "Invalid current password"}`, http.StatusBadRequest)
		return
	}

	// Hash new password
	newHash, err := crypto.HashPassword(req.NewPassword)
	if err != nil {
		http.Error(w, `{"error": "Failed to hash new password"}`, http.StatusInternalServerError)
		return
	}

	// Update DB
	_, err = db.DB.Exec(`UPDATE users SET password_hash = ? WHERE id = ?`, newHash, userID)
	if err != nil {
		http.Error(w, `{"error": "Database error updating password"}`, http.StatusInternalServerError)
		return
	}

	// Send email notification alert
	go func() {
		err := email.SendPasswordChangedNotification(emailStr)
		if err != nil {
			log.Printf("[Email Alert Error] Failed to send password change notification to %s: %v", emailStr, err)
		}
	}()

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message": "Password changed successfully"}`))
}

func handleAdminSupportSubmissions(w http.ResponseWriter, r *http.Request) {
	roleVal := r.Context().Value(middleware.ClaimsRole)
	if roleVal == nil || roleVal.(string) != "admin" {
		http.Error(w, `{"error": "Forbidden: admin access required"}`, http.StatusForbidden)
		return
	}

	if r.Method == http.MethodGet {
		rows, err := db.DB.Query(`
			SELECT id, form_type, COALESCE(name, ''), COALESCE(email, ''), COALESCE(phone, ''), COALESCE(subject, ''), COALESCE(token, ''), COALESCE(store_name, ''), COALESCE(message, ''), status, created_at
			FROM support_submissions
			ORDER BY created_at DESC
		`)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Database error: %v"}`, err), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		type Submission struct {
			ID        int    `json:"id"`
			FormType  string `json:"form_type"`
			Name      string `json:"name"`
			Email     string `json:"email"`
			Phone     string `json:"phone"`
			Subject   string `json:"subject"`
			Token     string `json:"token"`
			StoreName string `json:"store_name"`
			Message   string `json:"message"`
			Status    string `json:"status"`
			CreatedAt string `json:"created_at"`
		}

		var subs []Submission
		for rows.Next() {
			var s Submission
			err := rows.Scan(&s.ID, &s.FormType, &s.Name, &s.Email, &s.Phone, &s.Subject, &s.Token, &s.StoreName, &s.Message, &s.Status, &s.CreatedAt)
			if err == nil {
				subs = append(subs, s)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(subs)
		return
	}

	if r.Method == http.MethodPost {
		id := r.URL.Query().Get("id")
		status := r.URL.Query().Get("status")
		if id == "" || status == "" {
			http.Error(w, `{"error": "Missing id or status query parameters"}`, http.StatusBadRequest)
			return
		}

		_, err := db.DB.Exec(`UPDATE support_submissions SET status = ? WHERE id = ?`, status, id)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Database error: %v"}`, err), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "Submission status updated successfully"}`))
		return
	}

	http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
}

