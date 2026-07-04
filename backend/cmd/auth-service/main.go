package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/ahnara/antifake/backend/pkg/crypto"
	"github.com/ahnara/antifake/backend/pkg/db"
	"github.com/ahnara/antifake/backend/pkg/middleware"
	"github.com/ahnara/antifake/backend/pkg/models"
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
	Token string `json:"token"`
	Phone string `json:"phone"`
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
)

func main() {
	// Initialize Database
	db.InitDB()
	defer db.DB.Close()

	// Seed random number generator
	rand.Seed(time.Now().UnixNano())

	// Create a router
	mux := http.NewServeMux()

	// Register Routes
	mux.HandleFunc("/api/auth/register", handleRegister)
	mux.HandleFunc("/api/auth/login", handleLogin)
	mux.HandleFunc("/api/auth/otp/request", handleOTPRequest)
	mux.HandleFunc("/api/auth/otp/verify", handleOTPVerify)

	// Admin route to seed default data if DB is empty
	mux.HandleFunc("/api/auth/seed", handleSeedData)

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

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Database error: %v"}`, err), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// 1. Create Producer
	planTier := req.PlanTier
	if planTier == "" {
		planTier = "starter"
	}
	var producerID int64
	producerQuery := `INSERT INTO producers (name, slug, plan_tier, contact_email, status, created_at) 
		VALUES (?, ?, ?, ?, ?, ?)`

	// SQLite returns last insert row ID differently than Postgres, so we check driver style
	res, err := tx.Exec(producerQuery, req.ProducerName, req.ProducerSlug, planTier, req.ContactEmail, models.StatusActive, time.Now())
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Failed to create producer (slug might be taken): %v"}`, err), http.StatusBadRequest)
		return
	}
	producerID, err = res.LastInsertId()
	if err != nil {
		// Postgres driver Exec doesn't support LastInsertId on Exec, let's use QueryRow if Postgres
		// But Exec works on SQLite. Let's do a backup query if producerID is 0
		var id int
		err = db.DB.QueryRow(`SELECT id FROM producers WHERE slug = ?`, req.ProducerSlug).Scan(&id)
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

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Producer and user registered successfully",
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
	query := `SELECT id, email, password_hash, role, producer_id, status FROM users WHERE email = ?`
	err := db.DB.QueryRow(query, req.Email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.ProducerID, &u.Status)
	if err == sql.ErrNoRows {
		http.Error(w, `{"error": "Invalid credentials"}`, http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		return
	}

	if u.Status == models.StatusSuspended {
		http.Error(w, `{"error": "User account is suspended"}`, http.StatusForbidden)
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
		"token":       token,
		"role":        u.Role,
		"producer_id": u.ProducerID,
		"email":       u.Email,
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

	log.Printf("[MOCK OTP] Sent code %s to consumer phone %s for token %s", code, req.Phone, req.Token)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "sent",
		"message": fmt.Sprintf("OTP request received. For testing, use code: %s", code),
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

	// Let "123456" be a master bypass for convenience in demo
	if (!ok || cachedCode != req.Code) && req.Code != "123456" {
		http.Error(w, `{"error": "Invalid OTP code"}`, http.StatusBadRequest)
		return
	}

	// OTP confirmed. In a real system, we'd clear it.
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
