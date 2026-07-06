package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ahnara/antifake/backend/pkg/crypto"
	"github.com/ahnara/antifake/backend/pkg/db"
	"github.com/ahnara/antifake/backend/pkg/middleware"
	"github.com/ahnara/antifake/backend/pkg/models"
	"github.com/ahnara/antifake/backend/pkg/printer"
	"github.com/ahnara/antifake/backend/pkg/storage"
)

func main() {
	db.InitDB()
	defer db.DB.Close()

	mux := http.NewServeMux()

	// Endpoints wrapped with CORS + RequireAuth middleware
	mux.Handle("/api/producer/products", middleware.RequireAuth(http.HandlerFunc(handleProducts)))
	mux.Handle("/api/producer/batches", middleware.RequireAuth(http.HandlerFunc(handleBatches)))
	mux.Handle("/api/producer/batches/", middleware.RequireAuth(http.HandlerFunc(handleSingleBatchOperations)))
	mux.Handle("/api/producer/upload", middleware.RequireAuth(http.HandlerFunc(handleUpload)))
	mux.Handle("/api/producer/profile", middleware.RequireAuth(http.HandlerFunc(handleProfile)))
	mux.Handle("/api/producer/admin/producers", middleware.RequireAuth(http.HandlerFunc(handleAdminProducers)))
	mux.Handle("/api/producer/admin/producers/", middleware.RequireAuth(http.HandlerFunc(handleAdminSingleProducer)))

	// Serve static uploads
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	log.Println("Producer Service starting on port 8082...")
	log.Fatal(http.ListenAndServe(":8082", middleware.CORS(mux)))
}

func handleProducts(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized: no producer ID associated with user"}`, http.StatusForbidden)
		return
	}

	switch r.Method {
	case http.MethodGet:
		rows, err := db.DB.Query(`SELECT id, producer_id, name, sku, category, description, image_url, created_at 
			FROM products WHERE producer_id = ?`, prodID)
		if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var products []models.Product
		for rows.Next() {
			var p models.Product
			var desc, img sql.NullString
			if err := rows.Scan(&p.ID, &p.ProducerID, &p.Name, &p.SKU, &p.Category, &desc, &img, &p.CreatedAt); err != nil {
				http.Error(w, `{"error": "Failed to scan products"}`, http.StatusInternalServerError)
				return
			}
			p.Description = desc.String
			p.ImageURL = img.String
			products = append(products, p)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(products)

	case http.MethodPost:
		var p models.Product
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if p.Name == "" || p.SKU == "" || p.Category == "" {
			http.Error(w, `{"error": "Missing required fields (name, sku, category)"}`, http.StatusBadRequest)
			return
		}

		_, err := db.DB.Exec(`INSERT INTO products (producer_id, name, sku, category, description, image_url, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
			prodID, p.Name, p.SKU, p.Category, p.Description, p.ImageURL, time.Now())
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Product creation failed (SKU may exist): %v"}`, err), http.StatusBadRequest)
			return
		}

		// Fetch created product to return
		var created models.Product
		err = db.DB.QueryRow(`SELECT id, producer_id, name, sku, category, description, image_url, created_at 
			FROM products WHERE sku = ?`, p.SKU).Scan(
			&created.ID, &created.ProducerID, &created.Name, &created.SKU, &created.Category, &created.Description, &created.ImageURL, &created.CreatedAt)
		if err != nil {
			http.Error(w, `{"error": "Created but failed to retrieve product"}`, http.StatusInternalServerError)
			return
		}

		// Log audit trail
		userID, _ := middleware.GetUserID(r.Context())
		db.DB.Exec(`INSERT INTO audit_logs (actor_user_id, action, target_entity, target_id, created_at)
			VALUES (?, ?, 'product', ?, ?)`, userID, "CREATE_PRODUCT", created.ID, time.Now())

		w.WriteHeader(http.StatusCreated)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(created)

	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func handleBatches(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized: no producer ID associated with user"}`, http.StatusForbidden)
		return
	}

	switch r.Method {
	case http.MethodGet:
		rows, err := db.DB.Query(`SELECT b.id, b.product_id, b.batch_code, b.quantity, b.manufacture_date, b.expiry_date, b.status, b.created_at 
			FROM batches b
			JOIN products p ON b.product_id = p.id
			WHERE p.producer_id = ?`, prodID)
		if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var batches []models.Batch
		for rows.Next() {
			var b models.Batch
			if err := rows.Scan(&b.ID, &b.ProductID, &b.BatchCode, &b.Quantity, &b.ManufactureDate, &b.ExpiryDate, &b.Status, &b.CreatedAt); err != nil {
				http.Error(w, `{"error": "Failed to scan batches"}`, http.StatusInternalServerError)
				return
			}
			batches = append(batches, b)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(batches)

	case http.MethodPost:
		var b models.Batch
		if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if b.ProductID == 0 || b.BatchCode == "" || b.Quantity <= 0 {
			http.Error(w, `{"error": "Missing product_id, batch_code, or quantity"}`, http.StatusBadRequest)
			return
		}

		// Ensure product belongs to this producer
		var ownerProdID int
		err := db.DB.QueryRow(`SELECT producer_id FROM products WHERE id = ?`, b.ProductID).Scan(&ownerProdID)
		if err == sql.ErrNoRows || ownerProdID != prodID {
			http.Error(w, `{"error": "Forbidden: invalid product ID"}`, http.StatusForbidden)
			return
		}

		mDate := b.ManufactureDate
		if mDate.IsZero() {
			mDate = time.Now()
		}
		eDate := b.ExpiryDate
		if eDate.IsZero() {
			eDate = mDate.AddDate(2, 0, 0) // default 2 years expiry
		}

		_, err = db.DB.Exec(`INSERT INTO batches (product_id, batch_code, quantity, manufacture_date, expiry_date, status, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
			b.ProductID, b.BatchCode, b.Quantity, mDate, eDate, models.StatusActive, time.Now())
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Batch creation failed (batch_code may exist): %v"}`, err), http.StatusBadRequest)
			return
		}

		var created models.Batch
		err = db.DB.QueryRow(`SELECT id, product_id, batch_code, quantity, manufacture_date, expiry_date, status, created_at 
			FROM batches WHERE batch_code = ?`, b.BatchCode).Scan(
			&created.ID, &created.ProductID, &created.BatchCode, &created.Quantity, &created.ManufactureDate, &created.ExpiryDate, &created.Status, &created.CreatedAt)
		if err != nil {
			http.Error(w, `{"error": "Created but failed to retrieve batch"}`, http.StatusInternalServerError)
			return
		}

		// Log audit trail
		userID, _ := middleware.GetUserID(r.Context())
		db.DB.Exec(`INSERT INTO audit_logs (actor_user_id, action, target_entity, target_id, created_at)
			VALUES (?, ?, 'batch', ?, ?)`, userID, "CREATE_BATCH", created.ID, time.Now())

		w.WriteHeader(http.StatusCreated)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(created)

	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func handleSingleBatchOperations(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusForbidden)
		return
	}

	// Parse batch ID from path: /api/producer/batches/:id/generate or /api/producer/batches/:id/qr-codes
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, `{"error": "Invalid path"}`, http.StatusBadRequest)
		return
	}

	batchIDStr := parts[4]
	batchID, err := strconv.Atoi(batchIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid batch ID"}`, http.StatusBadRequest)
		return
	}

	// Verify batch ownership
	var ownerProdID int
	var batchQty int
	err = db.DB.QueryRow(`SELECT p.producer_id, b.quantity FROM batches b 
		JOIN products p ON b.product_id = p.id 
		WHERE b.id = ?`, batchID).Scan(&ownerProdID, &batchQty)
	if err == sql.ErrNoRows || ownerProdID != prodID {
		http.Error(w, `{"error": "Forbidden: invalid batch ID"}`, http.StatusForbidden)
		return
	}

	action := ""
	if len(parts) >= 6 {
		action = parts[5]
	}

	if action == "generate" && r.Method == http.MethodPost {
		// Generate QR codes for the batch
		// 1. Check if we already have codes generated for this batch
		var count int
		db.DB.QueryRow(`SELECT COUNT(*) FROM qr_codes WHERE batch_id = ?`, batchID).Scan(&count)
		if count > 0 {
			http.Error(w, `{"error": "QR codes have already been generated for this batch"}`, http.StatusBadRequest)
			return
		}

		tx, err := db.DB.Begin()
		if err != nil {
			http.Error(w, `{"error": "Failed to begin transaction"}`, http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		insertQuery := `INSERT INTO qr_codes (batch_id, token, signature, status, created_at) VALUES (?, ?, ?, ?, ?)`
		generatedCount := 0

		for i := 0; i < batchQty; i++ {
			token := generateRandomToken()
			sig := crypto.SignToken(token)

			_, err := tx.Exec(insertQuery, batchID, token, sig, models.StatusActive, time.Now())
			if err != nil {
				// Retry once with a new token on collision
				token = generateRandomToken()
				sig = crypto.SignToken(token)
				if _, err2 := tx.Exec(insertQuery, batchID, token, sig, models.StatusActive, time.Now()); err2 != nil {
					http.Error(w, fmt.Sprintf(`{"error": "Failed to generate unique tokens due to collision: %v"}`, err2), http.StatusInternalServerError)
					return
				}
			}
			generatedCount++
		}

		if err := tx.Commit(); err != nil {
			http.Error(w, `{"error": "Failed to commit QR generation"}`, http.StatusInternalServerError)
			return
		}

		// Audit Log
		userID, _ := middleware.GetUserID(r.Context())
		db.DB.Exec(`INSERT INTO audit_logs (actor_user_id, action, target_entity, target_id, created_at)
			VALUES (?, 'GENERATE_QR_CODES', 'batch', ?, ?)`, userID, batchID, time.Now())

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": fmt.Sprintf("Successfully generated %d QR code tokens.", generatedCount),
			"count":   generatedCount,
		})
		return
	}

	if action == "qr-codes" && r.Method == http.MethodGet {
		// Retrieve generated QR codes
		rows, err := db.DB.Query(`SELECT id, token, signature, status, created_at FROM qr_codes WHERE batch_id = ?`, batchID)
		if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}

		var codes []models.QRCode
		for rows.Next() {
			var q models.QRCode
			if err := rows.Scan(&q.ID, &q.Token, &q.Signature, &q.Status, &q.CreatedAt); err != nil {
				rows.Close()
				http.Error(w, `{"error": "Failed to scan QR codes"}`, http.StatusInternalServerError)
				return
			}
			codes = append(codes, q)
		}
		rows.Close()

		// Auto-generate missing tokens to match batch quantity (Bulk Insert optimized)
		if len(codes) < batchQty {
			needed := batchQty - len(codes)
			tx, err := db.DB.Begin()
			if err != nil {
				http.Error(w, `{"error": "Failed to start token generation transaction"}`, http.StatusInternalServerError)
				return
			}
			defer tx.Rollback()

			chunkSize := 500
			for i := 0; i < needed; i += chunkSize {
				end := i + chunkSize
				if end > needed {
					end = needed
				}
				currentChunkSize := end - i

				queryStrings := make([]string, 0, currentChunkSize)
				valueArgs := make([]interface{}, 0, currentChunkSize*5)

				for j := 0; j < currentChunkSize; j++ {
					token := generateRandomToken()
					sig := crypto.SignToken(token)
					queryStrings = append(queryStrings, "(?, ?, ?, ?, ?)")
					valueArgs = append(valueArgs, batchID, token, sig, models.StatusActive, time.Now())
				}

				stmt := fmt.Sprintf("INSERT INTO qr_codes (batch_id, token, signature, status, created_at) VALUES %s", strings.Join(queryStrings, ","))
				res, err := tx.Exec(stmt, valueArgs...)
				if err != nil {
					http.Error(w, fmt.Sprintf(`{"error": "Failed to bulk generate tokens: %v"}`, err), http.StatusInternalServerError)
					return
				}

				firstID, _ := res.LastInsertId()
				for j := 0; j < currentChunkSize; j++ {
					codes = append(codes, models.QRCode{
						ID:        int(firstID) + j,
						Token:     valueArgs[j*5+1].(string),
						Signature: valueArgs[j*5+2].(string),
						Status:    models.StatusActive,
						CreatedAt: valueArgs[j*5+4].(time.Time),
					})
				}
			}

			if err := tx.Commit(); err != nil {
				http.Error(w, `{"error": "Failed to commit generated tokens"}`, http.StatusInternalServerError)
				return
			}

			// Log this generation action
			userID, _ := middleware.GetUserID(r.Context())
			db.DB.Exec(`INSERT INTO audit_logs (actor_user_id, action, target_entity, target_id, created_at)
				VALUES (?, 'GENERATE_QR_CODES', 'batch', ?, ?)`, userID, batchID, time.Now())
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(codes)
		return
	}

	if action == "print" && r.Method == http.MethodGet {
		// Retrieve all tokens for printing
		rows, err := db.DB.Query(`SELECT token FROM qr_codes WHERE batch_id = ?`, batchID)
		if err != nil {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}

		var tokens []string
		for rows.Next() {
			var token string
			if err := rows.Scan(&token); err != nil {
				rows.Close()
				http.Error(w, `{"error": "Failed to scan tokens"}`, http.StatusInternalServerError)
				return
			}
			tokens = append(tokens, token)
		}
		rows.Close()

		// Auto-generate missing tokens to match batch quantity (Bulk Insert optimized)
		if len(tokens) < batchQty {
			needed := batchQty - len(tokens)
			tx, err := db.DB.Begin()
			if err != nil {
				http.Error(w, `{"error": "Failed to start token generation transaction"}`, http.StatusInternalServerError)
				return
			}
			defer tx.Rollback()

			chunkSize := 500
			for i := 0; i < needed; i += chunkSize {
				end := i + chunkSize
				if end > needed {
					end = needed
				}
				currentChunkSize := end - i

				queryStrings := make([]string, 0, currentChunkSize)
				valueArgs := make([]interface{}, 0, currentChunkSize*5)

				for j := 0; j < currentChunkSize; j++ {
					token := generateRandomToken()
					sig := crypto.SignToken(token)
					queryStrings = append(queryStrings, "(?, ?, ?, ?, ?)")
					valueArgs = append(valueArgs, batchID, token, sig, models.StatusActive, time.Now())
					
					tokens = append(tokens, token)
				}

				stmt := fmt.Sprintf("INSERT INTO qr_codes (batch_id, token, signature, status, created_at) VALUES %s", strings.Join(queryStrings, ","))
				_, err := tx.Exec(stmt, valueArgs...)
				if err != nil {
					http.Error(w, fmt.Sprintf(`{"error": "Failed to bulk generate tokens: %v"}`, err), http.StatusInternalServerError)
					return
				}
			}

			if err := tx.Commit(); err != nil {
				http.Error(w, `{"error": "Failed to commit generated tokens"}`, http.StatusInternalServerError)
				return
			}

			// Log this generation action
			userID, _ := middleware.GetUserID(r.Context())
			db.DB.Exec(`INSERT INTO audit_logs (actor_user_id, action, target_entity, target_id, created_at)
				VALUES (?, 'GENERATE_QR_CODES', 'batch', ?, ?)`, userID, batchID, time.Now())
		}

		if len(tokens) == 0 {
			http.Error(w, `{"error": "No QR codes found for this batch and could not auto-generate."}`, http.StatusBadRequest)
			return
		}

		// Read parameters
		msg := r.URL.Query().Get("message")
		if msg == "" {
			msg = "Scan QR code or visit antifake.ng/verify, input serial to check authenticity."
		}

		widthOpt := r.URL.Query().Get("width")
		if widthOpt == "" {
			widthOpt = "4ft"
		}

		colsStr := r.URL.Query().Get("columns")
		cols, _ := strconv.Atoi(colsStr)
		if cols <= 0 {
			cols = 12
		}

		printConfig := printer.PrintConfig{
			BatchCode:   batchIDStr,
			Message:     msg,
			WidthOption: widthOpt,
			Format:      "pdf",
			Columns:     cols,
		}

		// Determine if download or inline preview is requested
		disposition := "inline"
		if r.URL.Query().Get("download") == "true" {
			disposition = "attachment"
		}
		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", fmt.Sprintf("%s; filename=\"antifake-print-%s.pdf\"", disposition, batchIDStr))

		err = printer.GenerateVectorPDF(w, printConfig, tokens)
		if err != nil {
			log.Printf("Failed to generate PDF print sheet: %v", err)
		}
		return
	}

	if action == "recall" && r.Method == http.MethodPost {
		tx, err := db.DB.Begin()
		if err != nil {
			http.Error(w, `{"error": "Failed to start transaction"}`, http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		_, err = tx.Exec(`UPDATE batches SET status = ? WHERE id = ?`, models.StatusRecalled, batchID)
		if err != nil {
			http.Error(w, `{"error": "Failed to update batch status"}`, http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec(`UPDATE qr_codes SET status = ? WHERE batch_id = ?`, models.StatusRecalled, batchID)
		if err != nil {
			http.Error(w, `{"error": "Failed to update QR codes status"}`, http.StatusInternalServerError)
			return
		}

		if err := tx.Commit(); err != nil {
			http.Error(w, `{"error": "Failed to commit recall"}`, http.StatusInternalServerError)
			return
		}

		// Audit Log
		userID, _ := middleware.GetUserID(r.Context())
		db.DB.Exec(`INSERT INTO audit_logs (actor_user_id, action, target_entity, target_id, created_at)
			VALUES (?, 'RECALL_BATCH', 'batch', ?, ?)`, userID, batchID, time.Now())

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Batch recalled successfully.",
			"status":  models.StatusRecalled,
		})
		return
	}

	http.Error(w, `{"error": "Invalid request or action"}`, http.StatusNotFound)
}

// generateRandomToken generates uppercase alphanumeric token in XXXX-XXXX format
func generateRandomToken() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // avoid confusing characters (I, O, 0, 1)
	b := make([]byte, 8)
	rand.Read(b)
	
	var sb strings.Builder
	for i, val := range b {
		if i == 4 {
			sb.WriteByte('-')
		}
		sb.WriteByte(charset[int(val)%len(charset)])
	}
	return sb.String()
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Limit upload size to 10MB
	r.ParseMultipartForm(10 << 20)

	file, header, err := r.FormFile("image")
	if err != nil {
		http.Error(w, `{"error": "Failed to read uploaded file"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Upload image via SFTP to Hostinger or local fallback
	urlStr, err := storage.UploadImage(file, header)
	if err != nil {
		log.Printf("File upload error: %v", err)
		http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": urlStr,
	})
}

func handleProfile(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized: no producer ID associated with user"}`, http.StatusForbidden)
		return
	}

	switch r.Method {
	case http.MethodGet:
		var p models.Producer
		var logo, idCard, selfie, utilBill sql.NullString
		err := db.DB.QueryRow(`SELECT id, name, slug, plan_tier, contact_email, brand_logo_url, id_card_url, selfie_url, utility_bill_url, status, created_at 
			FROM producers WHERE id = ?`, prodID).Scan(&p.ID, &p.Name, &p.Slug, &p.PlanTier, &p.ContactEmail, &logo, &idCard, &selfie, &utilBill, &p.Status, &p.CreatedAt)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, `{"error": "Producer profile not found"}`, http.StatusNotFound)
			} else {
				http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			}
			return
		}
		p.BrandLogoURL = logo.String
		p.IDCardURL = idCard.String
		p.SelfieURL = selfie.String
		p.UtilityBillURL = utilBill.String

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(p)

	case http.MethodPut:
		var req struct {
			Name           string `json:"name"`
			ContactEmail   string `json:"contact_email"`
			BrandLogoURL   string `json:"brand_logo_url"`
			PlanTier       string `json:"plan_tier"`
			IDCardURL      string `json:"id_card_url"`
			SelfieURL      string `json:"selfie_url"`
			UtilityBillURL string `json:"utility_bill_url"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if req.Name == "" || req.ContactEmail == "" {
			http.Error(w, `{"error": "Name and contact email are required"}`, http.StatusBadRequest)
			return
		}

		// Update database
		query := `UPDATE producers SET name = ?, contact_email = ?`
		args := []interface{}{req.Name, req.ContactEmail}
		if req.BrandLogoURL != "" {
			query += `, brand_logo_url = ?`
			args = append(args, req.BrandLogoURL)
		}
		if req.PlanTier != "" {
			query += `, plan_tier = ?`
			args = append(args, req.PlanTier)
		}
		if req.IDCardURL != "" {
			query += `, id_card_url = ?`
			args = append(args, req.IDCardURL)
		}
		if req.SelfieURL != "" {
			query += `, selfie_url = ?`
			args = append(args, req.SelfieURL)
		}
		if req.UtilityBillURL != "" {
			query += `, utility_bill_url = ?`
			args = append(args, req.UtilityBillURL)
		}
		query += ` WHERE id = ?`
		args = append(args, prodID)

		_, err := db.DB.Exec(query, args...)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Failed to update profile: %v"}`, err), http.StatusInternalServerError)
			return
		}

		// Log audit trail
		userID, _ := middleware.GetUserID(r.Context())
		db.DB.Exec(`INSERT INTO audit_logs (actor_user_id, action, target_entity, target_id, created_at)
			VALUES (?, 'UPDATE_PRODUCER_PROFILE', 'producer', ?, ?)`, userID, prodID, time.Now())

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Profile updated successfully"})

	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func handleAdminProducers(w http.ResponseWriter, r *http.Request) {
	// Role check
	roleVal := r.Context().Value(middleware.ClaimsRole)
	if roleVal == nil || roleVal.(string) != "admin" {
		http.Error(w, `{"error": "Forbidden: admin access required"}`, http.StatusForbidden)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`SELECT id, name, slug, plan_tier, contact_email, brand_logo_url, status, created_at FROM producers ORDER BY name ASC`)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Database error: %v"}`, err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var list []models.Producer
	for rows.Next() {
		var p models.Producer
		var logo sql.NullString
		err := rows.Scan(&p.ID, &p.Name, &p.Slug, &p.PlanTier, &p.ContactEmail, &logo, &p.Status, &p.CreatedAt)
		if err == nil {
			p.BrandLogoURL = logo.String
			list = append(list, p)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func handleAdminSingleProducer(w http.ResponseWriter, r *http.Request) {
	// Role check
	roleVal := r.Context().Value(middleware.ClaimsRole)
	if roleVal == nil || roleVal.(string) != "admin" {
		http.Error(w, `{"error": "Forbidden: admin access required"}`, http.StatusForbidden)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 6 {
		http.Error(w, `{"error": "Invalid path"}`, http.StatusBadRequest)
		return
	}

	prodIDStr := parts[5]
	prodID, err := strconv.Atoi(prodIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid producer ID"}`, http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodPut {
		var req struct {
			Status   string `json:"status"`
			PlanTier string `json:"plan_tier"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if req.Status == "" && req.PlanTier == "" {
			http.Error(w, `{"error": "Missing status or plan_tier"}`, http.StatusBadRequest)
			return
		}

		query := "UPDATE producers SET "
		var args []interface{}
		var updates []string
		if req.Status != "" {
			updates = append(updates, "status = ?")
			args = append(args, req.Status)
		}
		if req.PlanTier != "" {
			updates = append(updates, "plan_tier = ?")
			args = append(args, req.PlanTier)
		}
		query += strings.Join(updates, ", ")
		query += " WHERE id = ?"
		args = append(args, prodID)

		_, err = db.DB.Exec(query, args...)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Failed to update producer: %v"}`, err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Producer updated successfully."})
		return
	}

	http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
}
