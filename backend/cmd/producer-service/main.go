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
)

func main() {
	db.InitDB()
	defer db.DB.Close()

	mux := http.NewServeMux()

	// Endpoints wrapped with CORS + RequireAuth middleware
	mux.Handle("/api/producer/products", middleware.RequireAuth(http.HandlerFunc(handleProducts)))
	mux.Handle("/api/producer/batches", middleware.RequireAuth(http.HandlerFunc(handleBatches)))
	mux.Handle("/api/producer/batches/", middleware.RequireAuth(http.HandlerFunc(handleSingleBatchOperations)))

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
		defer rows.Close()

		var codes []models.QRCode
		for rows.Next() {
			var q models.QRCode
			if err := rows.Scan(&q.ID, &q.Token, &q.Signature, &q.Status, &q.CreatedAt); err != nil {
				http.Error(w, `{"error": "Failed to scan QR codes"}`, http.StatusInternalServerError)
				return
			}
			codes = append(codes, q)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(codes)
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
