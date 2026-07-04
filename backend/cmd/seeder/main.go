package main

import (
	"fmt"
	"log"
	"time"

	"github.com/ahnara/antifake/backend/pkg/crypto"
	"github.com/ahnara/antifake/backend/pkg/db"
)

func main() {
	// Initialize database connection
	database := db.InitDB()
	defer database.Close()

	fmt.Println("=== Starting Database Seeding ===")

	// Clear existing tables in dependency order
	tables := []string{"audit_logs", "fraud_events", "reports", "verification_sessions", "consumers", "qr_codes", "batches", "products", "users", "producers"}
	for _, t := range tables {
		_, err := database.Exec(fmt.Sprintf("DELETE FROM %s", t))
		if err != nil {
			log.Printf("Warning: failed to clear table %s: %v", t, err)
		} else {
			fmt.Printf("Cleared table: %s\n", t)
		}
	}

	// 1. Seed Producers
	_, err := database.Exec(`INSERT INTO producers (id, name, slug, plan_tier, contact_email, brand_logo_url, status, created_at)
		VALUES (1, 'AURA Skincare', 'aura', 'growth', 'hello@auraskin.com', '/logo.png', 'active', ?)`, time.Now().AddDate(0, 0, -14))
	if err != nil {
		log.Fatalf("Failed to seed producers: %v", err)
	}
	fmt.Println("Seeded producers.")

	// 2. Seed Users
	pwdHash, _ := crypto.HashPassword("aura123456")
	_, err = database.Exec(`INSERT INTO users (id, email, password_hash, role, producer_id, status, created_at)
		VALUES (1, 'admin@auraskin.com', ?, 'producer', 1, 'active', ?)`, pwdHash, time.Now().AddDate(0, 0, -14))
	if err != nil {
		log.Fatalf("Failed to seed users: %v", err)
	}
	pwdAdminHash, _ := crypto.HashPassword("admin123456")
	_, err = database.Exec(`INSERT INTO users (id, email, password_hash, role, producer_id, status, created_at)
		VALUES (2, 'admin@antifakeng.com', ?, 'admin', NULL, 'active', ?)`, pwdAdminHash, time.Now().AddDate(0, 0, -14))
	if err != nil {
		log.Fatalf("Failed to seed admin user: %v", err)
	}
	fmt.Println("Seeded users.")

	// 3. Seed Products
	_, err = database.Exec(`INSERT INTO products (id, producer_id, name, sku, category, description, image_url, created_at)
		VALUES 
		(1, 1, 'AURA Skincare Serum 50ml', 'AURA-SERUM-50ML', 'Cosmetics', 'Premium hydrating skincare serum with Hyaluronic Acid.', '/logo.png', ?),
		(2, 1, 'AURA Cleanser 100ml', 'AURA-CLEANSE-100', 'Cosmetics', 'Gentle foaming facial cleanser.', '/logo.png', ?),
		(3, 1, 'Hydra Essence', 'AURA-HYDRA-ESSENCE', 'Cosmetics', 'Deep hydrating skin prep essence.', '/logo.png', ?)`,
		time.Now().AddDate(0, 0, -14), time.Now().AddDate(0, 0, -12), time.Now().AddDate(0, 0, -10))
	if err != nil {
		log.Fatalf("Failed to seed products: %v", err)
	}
	fmt.Println("Seeded products.")

	// 4. Seed Batches
	_, err = database.Exec(`INSERT INTO batches (id, product_id, batch_code, quantity, manufacture_date, expiry_date, status, created_at)
		VALUES 
		(1, 1, 'B-AUR-2026-01', 5000, ?, ?, 'active', ?),
		(2, 2, 'B-CLEAN-2026-01', 2000, ?, ?, 'active', ?),
		(3, 3, 'B-HYDRA-2026-01', 3000, ?, ?, 'active', ?)`,
		time.Now().AddDate(0, 0, -14), time.Now().AddDate(2, 0, -14), time.Now().AddDate(0, 0, -14),
		time.Now().AddDate(0, 0, -12), time.Now().AddDate(2, 0, -12), time.Now().AddDate(0, 0, -12),
		time.Now().AddDate(0, 0, -10), time.Now().AddDate(2, 0, -10), time.Now().AddDate(0, 0, -10))
	if err != nil {
		log.Fatalf("Failed to seed batches: %v", err)
	}
	fmt.Println("Seeded batches.")

	// 5. Seed QR Codes
	sig1 := crypto.SignToken("9F3C-71AE")
	sig2 := crypto.SignToken("8E2B-60CD")
	sig3 := crypto.SignToken("7D1A-59BC")
	sig4 := crypto.SignToken("6C0F-48DE")
	_, err = database.Exec(`INSERT INTO qr_codes (id, batch_id, token, signature, status, created_at)
		VALUES 
		(1, 1, '9F3C-71AE', ?, 'active', ?),
		(2, 1, '8E2B-60CD', ?, 'active', ?),
		(3, 2, '7D1A-59BC', ?, 'active', ?),
		(4, 3, '6C0F-48DE', ?, 'active', ?)`,
		sig1, time.Now().AddDate(0, 0, -14),
		sig2, time.Now().AddDate(0, 0, -14),
		sig3, time.Now().AddDate(0, 0, -12),
		sig4, time.Now().AddDate(0, 0, -10))
	if err != nil {
		log.Fatalf("Failed to seed qr_codes: %v", err)
	}
	fmt.Println("Seeded qr_codes.")

	// 6. Seed Consumers
	_, err = database.Exec(`INSERT INTO consumers (id, phone_number_hash, verification_count, created_at)
		VALUES 
		(1, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 3, ?),
		(2, 'd41d8cd98f00b204e9800998ecf8427e', 1, ?),
		(3, '4b84b15bff6ee57961524e5a28b83295c52e46b3f7f1a3a31c518b52f1e6871a', 5, ?)`,
		time.Now().AddDate(0, 0, -1), time.Now().AddDate(0, 0, -1), time.Now().AddDate(0, 0, -2))
	if err != nil {
		log.Fatalf("Failed to seed consumers: %v", err)
	}
	fmt.Println("Seeded consumers.")

	// 7. Seed Verification Sessions
	_, err = database.Exec(`INSERT INTO verification_sessions (id, qr_code_id, consumer_id, device_id, ip_country, result, risk_score, created_at)
		VALUES 
		(1, 1, 1, 'device_browser_1', 'Nigeria', 'genuine', 0.05, ?),
		(2, 1, 1, 'device_browser_2', 'Nigeria', 'previously_verified', 0.85, ?),
		(3, 3, 2, 'device_browser_3', 'Nigeria', 'genuine', 0.02, ?),
		(4, 4, 3, 'device_browser_4', 'Nigeria', 'genuine', 0.08, ?),
		(5, 4, 3, 'device_browser_5', 'Nigeria', 'previously_verified', 0.75, ?),
		(6, 1, 1, 'device_browser_6', 'Ghana', 'suspicious', 0.95, ?),
		(7, 4, 3, 'device_browser_7', 'Nigeria', 'genuine', 0.04, ?),
		(8, 4, 3, 'device_browser_8', 'Nigeria', 'genuine', 0.03, ?),
		(9, 2, 1, 'device_browser_9', 'Nigeria', 'genuine', 0.06, ?)`,
		time.Now().AddDate(0, 0, -1), time.Now().AddDate(0, -1, 0), time.Now().AddDate(0, 0, -1),
		time.Now().AddDate(0, 0, -2), time.Now().AddDate(0, 0, -2), time.Now().AddDate(0, 0, -1),
		time.Now().AddDate(0, 0, -3), time.Now().AddDate(0, 0, -4), time.Now().AddDate(0, 0, -5))
	if err != nil {
		log.Fatalf("Failed to seed verification_sessions: %v", err)
	}
	fmt.Println("Seeded verification_sessions.")

	// 8. Seed Fraud Events
	_, err = database.Exec(`INSERT INTO fraud_events (id, verification_session_id, signal_type, severity, resolved_by, resolved_at, created_at)
		VALUES 
		(1, 2, 'Impossible Travel Velocity: Duplicate check in Lagos & Abuja in 10 mins.', 'high', NULL, NULL, ?),
		(2, 5, 'High-Volume Duplicates: Serial token checked from 6 distinct device fingerprints.', 'medium', NULL, NULL, ?),
		(3, 6, 'Geo-Fencing Collision: Token signed for Nigeria scanned from Ghana.', 'high', 1, ?, ?)`,
		time.Now().AddDate(0, 0, -1), time.Now().AddDate(0, 0, -2), time.Now().AddDate(0, 0, -1), time.Now().AddDate(0, 0, -1))
	if err != nil {
		log.Fatalf("Failed to seed fraud_events: %v", err)
	}
	fmt.Println("Seeded fraud_events.")

	// 9. Seed Reports
	_, err = database.Exec(`INSERT INTO reports (id, qr_code_id, consumer_id, description, retailer_name, retailer_location, photo_url, status, created_at)
		VALUES 
		(1, 1, 1, 'The packaging seal looks completely different from the one I bought last month. The serum color is also yellow instead of clear.', 'VeeCare Pharmacy', 'Wuse II, Abuja', '', 'pending', ?),
		(2, 3, 2, 'The QR code was printed on a generic sticker pasted over the packaging box. The merchant insisted it was original.', 'Market Stall 4, Kano Market', 'Kano City', '', 'pending', ?),
		(3, 1, 3, 'Bought it from an Instagram page. Smells like baby oil and the verification page threw a warning.', 'Instagram Vendor', 'Lagos (Instagram)', '', 'resolved', ?)`,
		time.Now().AddDate(0, 0, -1), time.Now().AddDate(0, 0, -2), time.Now().AddDate(0, 0, -3))
	if err != nil {
		log.Fatalf("Failed to seed reports: %v", err)
	}
	fmt.Println("Seeded reports.")

	// 10. Seed Audit Logs
	_, err = database.Exec(`INSERT INTO audit_logs (id, actor_user_id, action, target_entity, target_id, created_at)
		VALUES 
		(1, 1, 'CREATE_BATCH', 'batch', 1, ?),
		(2, 1, 'GENERATE_QR_CODES', 'batch', 1, ?),
		(3, 1, 'RESOLVE_FRAUD_ALERT', 'fraud_event', 3, ?)`,
		time.Now().AddDate(0, 0, -14), time.Now().AddDate(0, 0, -14), time.Now().AddDate(0, 0, -1))
	if err != nil {
		log.Fatalf("Failed to seed audit_logs: %v", err)
	}
	fmt.Println("Seeded audit_logs.")

	fmt.Println("=== Seeding completed successfully! ===")
}
