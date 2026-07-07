package main

import (
	"bytes"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/ahnara/antifake/backend/pkg/crypto"
	"github.com/ahnara/antifake/backend/pkg/db"
	"github.com/ahnara/antifake/backend/pkg/middleware"
	"github.com/ahnara/antifake/backend/pkg/models"
)

type SubmitReportReq struct {
	Token            string `json:"token"`
	Phone            string `json:"phone"`
	Description      string `json:"description"`
	RetailerName     string `json:"retailer_name"`
	RetailerLocation string `json:"retailer_location"`
	PhotoURL         string `json:"photo_url"`
}

func main() {
	db.InitDB()
	defer db.DB.Close()

	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("/api/analytics/reports/submit", handlePublicReportSubmit)
	mux.HandleFunc("/api/analytics/support/chat", handleSupportChat)
	mux.HandleFunc("/api/analytics/users/delete", handlePublicUserDataDeletion)

	// Auth-required routes
	mux.Handle("/api/analytics/summary", middleware.RequireAuth(http.HandlerFunc(handleSummary)))
	mux.Handle("/api/analytics/scans", middleware.RequireAuth(http.HandlerFunc(handleScansTimeline)))
	mux.Handle("/api/analytics/reports", middleware.RequireAuth(http.HandlerFunc(handleProducerReports)))
	mux.Handle("/api/analytics/reports/", middleware.RequireAuth(http.HandlerFunc(handleSingleReportOperations)))
	mux.Handle("/api/analytics/alerts", middleware.RequireAuth(http.HandlerFunc(handleProducerAlerts)))
	mux.Handle("/api/analytics/alerts/", middleware.RequireAuth(http.HandlerFunc(handleResolveAlert)))
	mux.Handle("/api/analytics/history", middleware.RequireAuth(http.HandlerFunc(handleProducerHistory)))
	mux.Handle("/api/analytics/audit-logs", middleware.RequireAuth(http.HandlerFunc(handleAuditLogs)))

	log.Println("Analytics & Reports Service starting on port 8084...")
	log.Fatal(http.ListenAndServe(":8084", middleware.CORS(mux)))
}

func handlePublicReportSubmit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req SubmitReportReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.Token == "" || req.Phone == "" {
		http.Error(w, `{"error": "Token and phone number are required to submit a report"}`, http.StatusBadRequest)
		return
	}

	// Find the QR code ID
	var qrCodeID int
	err := db.DB.QueryRow(`SELECT id FROM qr_codes WHERE token = ?`, req.Token).Scan(&qrCodeID)
	if err == sql.ErrNoRows {
		http.Error(w, `{"error": "Invalid token"}`, http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		return
	}

	// Find or create consumer ID
	phoneHash := crypto.SignToken(req.Phone) // hash phone
	var consumerID int
	err = db.DB.QueryRow(`SELECT id FROM consumers WHERE phone_number_hash = ?`, phoneHash).Scan(&consumerID)
	if err == sql.ErrNoRows {
		res, _ := db.DB.Exec(`INSERT INTO consumers (phone_number_hash, verification_count, created_at) VALUES (?, 1, ?)`, phoneHash, time.Now())
		cid, _ := res.LastInsertId()
		if cid == 0 {
			db.DB.QueryRow(`SELECT id FROM consumers WHERE phone_number_hash = ?`, phoneHash).Scan(&consumerID)
		} else {
			consumerID = int(cid)
		}
	} else {
		consumerID = int(consumerID)
	}

	_, err = db.DB.Exec(`INSERT INTO reports (qr_code_id, consumer_id, description, retailer_name, retailer_location, photo_url, status, created_at)
		VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
		qrCodeID, consumerID, req.Description, req.RetailerName, req.RetailerLocation, req.PhotoURL, time.Now())
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Failed to create report: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Report submitted successfully. Thank you for protecting the market!"})
}

func handleSummary(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		// If Admin, they can view global overview
		handleAdminSummary(w, r)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var productCount, batchCount, scanCount, genuineCount, suspiciousCount, recalledCount int

	// Totals
	db.DB.QueryRow(`SELECT COUNT(*) FROM products WHERE producer_id = ?`, prodID).Scan(&productCount)
	db.DB.QueryRow(`SELECT COUNT(*) FROM batches b JOIN products p ON b.product_id = p.id WHERE p.producer_id = ?`, prodID).Scan(&batchCount)
	
	// Scans
	scanQuery := `SELECT COUNT(vs.id) FROM verification_sessions vs
		JOIN qr_codes q ON vs.qr_code_id = q.id
		JOIN batches b ON q.batch_id = b.id
		JOIN products p ON b.product_id = p.id
		WHERE p.producer_id = ?`
	db.DB.QueryRow(scanQuery, prodID).Scan(&scanCount)

	// Scans genuine
	db.DB.QueryRow(scanQuery+` AND vs.result = 'genuine'`, prodID).Scan(&genuineCount)

	// Scans suspicious
	db.DB.QueryRow(scanQuery+` AND vs.result IN ('suspicious', 'highrisk')`, prodID).Scan(&suspiciousCount)

	// Recalled/Blocked QRs
	recalledQuery := `SELECT COUNT(q.id) FROM qr_codes q
		JOIN batches b ON q.batch_id = b.id
		JOIN products p ON b.product_id = p.id
		WHERE p.producer_id = ? AND (q.status = 'recalled' OR b.status = 'recalled')`
	db.DB.QueryRow(recalledQuery, prodID).Scan(&recalledCount)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"products_count":   productCount,
		"batches_count":    batchCount,
		"scans_count":      scanCount,
		"genuine_count":    genuineCount,
		"suspicious_count": suspiciousCount,
		"recalled_count":   recalledCount,
	})
}

func handleAdminSummary(w http.ResponseWriter, r *http.Request) {
	// Simple global summary stats for Platform Admin
	var producers, products, batches, scans, alerts int
	db.DB.QueryRow(`SELECT COUNT(*) FROM producers`).Scan(&producers)
	db.DB.QueryRow(`SELECT COUNT(*) FROM products`).Scan(&products)
	db.DB.QueryRow(`SELECT COUNT(*) FROM batches`).Scan(&batches)
	db.DB.QueryRow(`SELECT COUNT(*) FROM verification_sessions`).Scan(&scans)
	db.DB.QueryRow(`SELECT COUNT(*) FROM fraud_events WHERE resolved_at IS NULL`).Scan(&alerts)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"producers_count": producers,
		"products_count":   products,
		"batches_count":    batches,
		"scans_count":      scans,
		"active_alerts":    alerts,
	})
}

func handleScansTimeline(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusForbidden)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Fetch scan timeseries (last 7 days grouped by date)
	// Supports MySQL date grouping. Fallback logic is standard.
	query := `
		SELECT DATE(vs.created_at) as scan_date, vs.result, COUNT(*) as count
		FROM verification_sessions vs
		JOIN qr_codes q ON vs.qr_code_id = q.id
		JOIN batches b ON q.batch_id = b.id
		JOIN products p ON b.product_id = p.id
		WHERE p.producer_id = ? AND vs.created_at >= ?
		GROUP BY DATE(vs.created_at), vs.result
		ORDER BY scan_date ASC
	`
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	rows, err := db.DB.Query(query, prodID, sevenDaysAgo)
	if err != nil {
		// Postgres format fallback (date grouping slightly different)
		queryPostgres := `
			SELECT TO_CHAR(vs.created_at, 'YYYY-MM-DD') as scan_date, vs.result, COUNT(*) as count
			FROM verification_sessions vs
			JOIN qr_codes q ON vs.qr_code_id = q.id
			JOIN batches b ON q.batch_id = b.id
			JOIN products p ON b.product_id = p.id
			WHERE p.producer_id = ? AND vs.created_at >= ?
			GROUP BY TO_CHAR(vs.created_at, 'YYYY-MM-DD'), vs.result
			ORDER BY scan_date ASC
		`
		rows, err = db.DB.Query(queryPostgres, prodID, sevenDaysAgo)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Timeline fetch error: %v"}`, err), http.StatusInternalServerError)
			return
		}
	}
	defer rows.Close()

	type TimeData struct {
		Date      string `json:"date"`
		Verdict   string `json:"verdict"`
		ScanCount int    `json:"count"`
	}
	var timeline []TimeData
	for rows.Next() {
		var td TimeData
		if err := rows.Scan(&td.Date, &td.Verdict, &td.ScanCount); err == nil {
			timeline = append(timeline, td)
		}
	}

	// Fetch geographic distribution
	geoQuery := `
		SELECT vs.ip_country, COUNT(*) as count
		FROM verification_sessions vs
		JOIN qr_codes q ON vs.qr_code_id = q.id
		JOIN batches b ON q.batch_id = b.id
		JOIN products p ON b.product_id = p.id
		WHERE p.producer_id = ?
		GROUP BY vs.ip_country
	`
	geoRows, err := db.DB.Query(geoQuery, prodID)
	var geoDist = make(map[string]int)
	if err == nil {
		defer geoRows.Close()
		for geoRows.Next() {
			var country string
			var count int
			if err := geoRows.Scan(&country, &count); err == nil {
				if country == "" {
					country = "Unknown"
				}
				geoDist[country] = count
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"timeline": timeline,
		"geography": geoDist,
	})
}

func handleProducerReports(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusForbidden)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`SELECT r.id, r.qr_code_id, r.consumer_id, r.description, r.retailer_name, r.retailer_location, r.photo_url, r.status, r.created_at,
		q.token, p.name, p.sku
		FROM reports r
		JOIN qr_codes q ON r.qr_code_id = q.id
		JOIN batches b ON q.batch_id = b.id
		JOIN products p ON b.product_id = p.id
		WHERE p.producer_id = ?
		ORDER BY r.created_at DESC`, prodID)
	if err != nil {
		http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type ReportDetail struct {
		models.Report
		Token       string `json:"token"`
		ProductName string `json:"product_name"`
		SKU         string `json:"sku"`
	}

	var reports []ReportDetail
	for rows.Next() {
		var rd ReportDetail
		var desc, rName, rLoc, photo sql.NullString
		if err := rows.Scan(&rd.ID, &rd.QRCodeID, &rd.ConsumerID, &desc, &rName, &rLoc, &photo, &rd.Status, &rd.CreatedAt,
			&rd.Token, &rd.ProductName, &rd.SKU); err == nil {
			rd.Description = desc.String
			rd.RetailerName = rName.String
			rd.RetailerLocation = rLoc.String
			rd.PhotoURL = photo.String
			reports = append(reports, rd)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reports)
}

func handleProducerAlerts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	prodID, ok := middleware.GetProducerID(r.Context())
	var rows *sql.Rows
	var err error

	if !ok {
		// Admin: get all alerts
		rows, err = db.DB.Query(`SELECT fe.id, fe.verification_session_id, fe.signal_type, fe.severity, fe.resolved_by, fe.resolved_at, fe.created_at,
			vs.risk_score, vs.device_id, vs.ip_country, q.token, p.name, pr.name
			FROM fraud_events fe
			JOIN verification_sessions vs ON fe.verification_session_id = vs.id
			JOIN qr_codes q ON vs.qr_code_id = q.id
			JOIN batches b ON q.batch_id = b.id
			JOIN products p ON b.product_id = p.id
			JOIN producers pr ON p.producer_id = pr.id
			ORDER BY fe.created_at DESC`)
	} else {
		// Producer: get only their alerts
		rows, err = db.DB.Query(`SELECT fe.id, fe.verification_session_id, fe.signal_type, fe.severity, fe.resolved_by, fe.resolved_at, fe.created_at,
			vs.risk_score, vs.device_id, vs.ip_country, q.token, p.name, pr.name
			FROM fraud_events fe
			JOIN verification_sessions vs ON fe.verification_session_id = vs.id
			JOIN qr_codes q ON vs.qr_code_id = q.id
			JOIN batches b ON q.batch_id = b.id
			JOIN products p ON b.product_id = p.id
			JOIN producers pr ON p.producer_id = pr.id
			WHERE p.producer_id = ?
			ORDER BY fe.created_at DESC`, prodID)
	}

	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Database error: %v"}`, err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type AlertDetail struct {
		models.FraudEvent
		RiskScore float64   `json:"risk_score"`
		DeviceID  string    `json:"device_id"`
		Country   string    `json:"ip_country"`
		Token     string    `json:"token"`
		Product   string    `json:"product_name"`
		BrandName string    `json:"brand_name"`
	}

	var alerts []AlertDetail
	for rows.Next() {
		var ad AlertDetail
		var resBy sql.NullInt64
		var resAt sql.NullTime
		var device, country sql.NullString
		err := rows.Scan(&ad.ID, &ad.VerificationSessionID, &ad.SignalType, &ad.Severity, &resBy, &resAt, &ad.CreatedAt,
			&ad.RiskScore, &device, &country, &ad.Token, &ad.Product, &ad.BrandName)
		if err == nil {
			if resBy.Valid {
				uid := int(resBy.Int64)
				ad.ResolvedBy = &uid
			}
			if resAt.Valid {
				ad.ResolvedAt = &resAt.Time
			}
			if country.Valid {
				ad.Country = country.String
			}
			if device.Valid {
				ad.DeviceID = device.String
			}
			alerts = append(alerts, ad)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alerts)
}

func handleResolveAlert(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusForbidden)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Path: /api/analytics/alerts/:id/resolve
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, `{"error": "Invalid path"}`, http.StatusBadRequest)
		return
	}

	alertIDStr := parts[4]
	alertID, err := strconv.Atoi(alertIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid alert ID"}`, http.StatusBadRequest)
		return
	}

	// Verify alert belongs to this producer
	var alertOwnerProdID int
	err = db.DB.QueryRow(`SELECT p.producer_id FROM fraud_events fe
		JOIN verification_sessions vs ON fe.verification_session_id = vs.id
		JOIN qr_codes q ON vs.qr_code_id = q.id
		JOIN batches b ON q.batch_id = b.id
		JOIN products p ON b.product_id = p.id
		WHERE fe.id = ?`, alertID).Scan(&alertOwnerProdID)
	if err == sql.ErrNoRows || alertOwnerProdID != prodID {
		http.Error(w, `{"error": "Forbidden: invalid alert ID"}`, http.StatusForbidden)
		return
	}

	userID, _ := middleware.GetUserID(r.Context())
	now := time.Now()
	_, err = db.DB.Exec(`UPDATE fraud_events SET resolved_by = ?, resolved_at = ? WHERE id = ?`, userID, now, alertID)
	if err != nil {
		http.Error(w, `{"error": "Failed to resolve alert"}`, http.StatusInternalServerError)
		return
	}

	// Audit Log
	db.DB.Exec(`INSERT INTO audit_logs (actor_user_id, action, target_entity, target_id, created_at)
		VALUES (?, 'RESOLVE_FRAUD_ALERT', 'fraud_event', ?, ?)`, userID, alertID, now)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "resolved",
		"resolved_by": userID,
		"resolved_at": now,
	})
}

func handleSingleReportOperations(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusForbidden)
		return
	}

	// Path: /api/analytics/reports/:id/resolve
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, `{"error": "Invalid path"}`, http.StatusBadRequest)
		return
	}

	reportIDStr := parts[4]
	reportID, err := strconv.Atoi(reportIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid report ID"}`, http.StatusBadRequest)
		return
	}

	// Verify report ownership
	var reportOwnerProdID int
	err = db.DB.QueryRow(`SELECT p.producer_id FROM reports r
		JOIN qr_codes q ON r.qr_code_id = q.id
		JOIN batches b ON q.batch_id = b.id
		JOIN products p ON b.product_id = p.id
		WHERE r.id = ?`, reportID).Scan(&reportOwnerProdID)
	if err == sql.ErrNoRows || reportOwnerProdID != prodID {
		http.Error(w, `{"error": "Forbidden: invalid report ID"}`, http.StatusForbidden)
		return
	}

	action := ""
	if len(parts) >= 6 {
		action = parts[5]
	}

	if action == "resolve" && r.Method == http.MethodPost {
		_, err = db.DB.Exec(`UPDATE reports SET status = 'resolved' WHERE id = ?`, reportID)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Failed to resolve report: %v"}`, err), http.StatusInternalServerError)
			return
		}

		// Audit Log
		userID, _ := middleware.GetUserID(r.Context())
		db.DB.Exec(`INSERT INTO audit_logs (actor_user_id, action, target_entity, target_id, created_at)
			VALUES (?, 'RESOLVE_REPORT', 'report', ?, ?)`, userID, reportID, time.Now())

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Report marked as resolved successfully."})
		return
	}

	http.Error(w, `{"error": "Invalid request or action"}`, http.StatusNotFound)
}

func handleProducerHistory(w http.ResponseWriter, r *http.Request) {
	prodID, ok := middleware.GetProducerID(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized: no producer ID associated with user"}`, http.StatusForbidden)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`SELECT vs.id, vs.created_at, vs.result, vs.risk_score, vs.ip_country, vs.device_id, q.token, p.name
		FROM verification_sessions vs
		JOIN qr_codes q ON vs.qr_code_id = q.id
		JOIN batches b ON q.batch_id = b.id
		JOIN products p ON b.product_id = p.id
		WHERE p.producer_id = ?
		ORDER BY vs.created_at DESC`, prodID)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Database error: %v"}`, err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type HistoryDetail struct {
		ID          int       `json:"id"`
		CreatedAt   time.Time `json:"created_at"`
		Result      string    `json:"result"`
		RiskScore   float64   `json:"risk_score"`
		IPCountry   string    `json:"ip_country"`
		DeviceID    string    `json:"device_id"`
		Token       string    `json:"token"`
		ProductName string    `json:"product_name"`
	}

	var history []HistoryDetail
	for rows.Next() {
		var hd HistoryDetail
		var deviceID, ipCountry sql.NullString
		err := rows.Scan(&hd.ID, &hd.CreatedAt, &hd.Result, &hd.RiskScore, &ipCountry, &deviceID, &hd.Token, &hd.ProductName)
		if err == nil {
			if deviceID.Valid {
				hd.DeviceID = deviceID.String
			}
			if ipCountry.Valid {
				hd.IPCountry = ipCountry.String
			}
			history = append(history, hd)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

func handleAuditLogs(w http.ResponseWriter, r *http.Request) {
	// Require role to be admin
	roleVal := r.Context().Value(middleware.ClaimsRole)
	if roleVal == nil || roleVal.(string) != "admin" {
		http.Error(w, `{"error": "Forbidden: admin access required"}`, http.StatusForbidden)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`SELECT al.id, al.actor_user_id, al.action, al.target_entity, al.target_id, al.created_at, u.email
		FROM audit_logs al
		LEFT JOIN users u ON al.actor_user_id = u.id
		ORDER BY al.created_at DESC`)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Database error: %v"}`, err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type AuditLogDetail struct {
		ID           int       `json:"id"`
		ActorUserID  *int      `json:"actor_user_id"`
		ActorEmail   string    `json:"actor_email"`
		Action       string    `json:"action"`
		TargetEntity string    `json:"target_entity"`
		TargetID     int       `json:"target_id"`
		CreatedAt    time.Time `json:"created_at"`
	}

	var logs []AuditLogDetail
	for rows.Next() {
		var ald AuditLogDetail
		var actorUserID sql.NullInt64
		var actorEmail sql.NullString
		err := rows.Scan(&ald.ID, &actorUserID, &ald.Action, &ald.TargetEntity, &ald.TargetID, &ald.CreatedAt, &actorEmail)
		if err == nil {
			if actorUserID.Valid {
				uid := int(actorUserID.Int64)
				ald.ActorUserID = &uid
			}
			if actorEmail.Valid {
				ald.ActorEmail = actorEmail.String
			}
			logs = append(logs, ald)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type MistralRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
	MaxTokens   int           `json:"max_tokens"`
}

type MistralChoice struct {
	Message ChatMessage `json:"message"`
}

type MistralResponse struct {
	Choices []MistralChoice `json:"choices"`
}

type SupportChatRequest struct {
	Messages []ChatMessage `json:"messages"`
}

type SupportChatResponse struct {
	Reply string `json:"reply"`
	Error string `json:"error,omitempty"`
}

func handleSupportChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte(`{"error": "Method not allowed"}`))
		return
	}

	var req SupportChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error": "Invalid request payload"}`))
		return
	}

	mistralAPIKey := os.Getenv("MISTRAL_API_KEY")
	if mistralAPIKey == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(SupportChatResponse{Error: "MISTRAL_API_KEY environment variable is not configured"})
		return
	}
	mistralAPIKey = strings.Trim(strings.ReplaceAll(mistralAPIKey, "\"", ""), " ")
	mistralAPIKey = strings.Trim(strings.ReplaceAll(mistralAPIKey, "'", ""), " ")

	systemContent := `You are the AntiFakeNG Assistant, an AI support agent trained on the AntiFakeNG knowledge base.
AntiFakeNG is a modern product authenticity platform that secures manufacturer goods using unique, encrypted QR codes and serial tokens.

Key Knowledge Details:
1. Product Verification:
   - Consumers scan the QR code on a product label or manually type the 8-digit serial token (formatted as XXXX-XXXX) at the consumer portal (http://localhost:3000/consumer).
   - The platform prompts the consumer to bind their scan session with a phone number (via WhatsApp or SMS).
   - An OTP (One-Time Password) is sent to the consumer to verify their session.
   - WhatsApp is the default, primary delivery channel of choice. SMS is the secondary fallback.
   - Consumers must insist on using their OWN phone numbers for accurate validation and loyalty rewards.
   - If verification fails (verdict is SUSPICIOUS or INVALID), consumers should NOT buy the product and should file a report on the Support page.

2. Brand/Producer Management:
   - Manufacturers/Producers register accounts, add products, and generate unique serial token batches.
   - Batches can be bulk-generated (e.g., 2000 codes at once).
   - Producers print codes using the Roll Width Layout. The layout grid auto-calculates columns and enforces exactly 1px spacing (TBLR) and 2px label padding around each QR code to ensure clean cutting.
   - Producers can access analytics to view scan counts, locations, and suspicious/invalid scanning trends.

3. General Platform Info:
   - Secure verification utilizes whatsmeow for WhatsApp pairing on startup via simple 8-digit pairing codes.
   - Admin email notifications are automatically sent using SMTP (Hostinger secure TLS/SSL).
   - Self-healing checks run daily to ensure the WhatsApp OTP gateway remains paired and healthy.

Instructions:
- Be concise, helpful, and highly professional.
- Address consumers and manufacturers politely.
- If they report a counterfeit, guide them to use the "Report Fake" tab on the Support page.
- Do not mention technical implementation details unless specifically asked.`

	systemPrompt := ChatMessage{
		Role:    "system",
		Content: systemContent,
	}

	mistralMessages := append([]ChatMessage{systemPrompt}, req.Messages...)

	mistralReqBody := MistralRequest{
		Model:       "open-mixtral-8x7b",
		Messages:    mistralMessages,
		Temperature: 0.7,
		MaxTokens:   500,
	}

	jsonBytes, err := json.Marshal(mistralReqBody)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Failed to marshal request"}`))
		return
	}

	client := &http.Client{Timeout: 30 * time.Second}
	httpReq, err := http.NewRequest(http.MethodPost, "https://api.mistral.ai/v1/chat/completions", bytes.NewBuffer(jsonBytes))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Failed to create request"}`))
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+mistralAPIKey)

	resp, err := client.Do(httpReq)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(SupportChatResponse{Error: fmt.Sprintf("Failed to contact Mistral API: %v", err)})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBodyBytes, _ := io.ReadAll(resp.Body)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		json.NewEncoder(w).Encode(SupportChatResponse{Error: fmt.Sprintf("Mistral API error (%d): %s", resp.StatusCode, string(respBodyBytes))})
		return
	}

	var mistralResp MistralResponse
	if err := json.NewDecoder(resp.Body).Decode(&mistralResp); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(SupportChatResponse{Error: "Failed to parse Mistral response"})
		return
	}

	reply := ""
	if len(mistralResp.Choices) > 0 {
		reply = mistralResp.Choices[0].Message.Content
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(SupportChatResponse{Reply: reply})
}

type DeleteUserDataReq struct {
	Phone string `json:"phone"`
}

type DeleteUserDataResp struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

func handlePublicUserDataDeletion(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(DeleteUserDataResp{Error: "Method not allowed"})
		return
	}

	var req DeleteUserDataReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DeleteUserDataResp{Error: "Invalid request payload"})
		return
	}

	phoneClean := strings.TrimPrefix(req.Phone, "+")
	phoneClean = strings.ReplaceAll(phoneClean, " ", "")
	if phoneClean == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DeleteUserDataResp{Error: "Phone number is required"})
		return
	}

	// Compute phone hash (SHA-256)
	h := sha256.New()
	h.Write([]byte(phoneClean))
	phoneHash := hex.EncodeToString(h.Sum(nil))

	// Delete from database
	_, err := db.DB.Exec("DELETE FROM consumers WHERE phone_number_hash = ?", phoneHash)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(DeleteUserDataResp{Error: fmt.Sprintf("Database deletion error: %v", err)})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(DeleteUserDataResp{
		Success: true,
		Message: "User data deletion request processed successfully. All session linkages and report data associated with this phone number have been permanently deleted.",
	})
}
