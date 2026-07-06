package db

import (
	"database/sql"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB initializes the database connection and creates tables if they do not exist
func InitDB() *sql.DB {
	var err error
	var driver string
	var dsn string

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL != "" {
		if strings.HasPrefix(dbURL, "mysql://") {
			driver = "mysql"
			// Parse mysql://user:pass@host:port/dbname
			u, err := url.Parse(dbURL)
			if err != nil {
				log.Fatalf("Failed to parse DATABASE_URL as MySQL URL: %v", err)
			}
			pass, _ := u.User.Password()
			// Reconstruct DSN: username:password@tcp(host:port)/dbname?parseTime=true
			dsn = fmt.Sprintf("%s:%s@tcp(%s)%s", u.User.Username(), pass, u.Host, u.Path)
			if !strings.Contains(dsn, "parseTime=") {
				if strings.Contains(dsn, "?") {
					dsn += "&parseTime=true"
				} else {
					dsn += "?parseTime=true"
				}
			}
		} else {
			driver = "postgres"
			dsn = dbURL
		}
	} else if os.Getenv("DB_HOST") != "" {
		driver = "postgres"
		dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
			os.Getenv("DB_HOST"),
			os.Getenv("DB_PORT"),
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_NAME"),
		)
	} else {
		log.Fatalf("Database configuration is missing. Please set DATABASE_URL or DB_HOST environment variable.")
	}

	log.Printf("Connecting to database using driver: %s", driver)
	DB, err = sql.Open(driver, dsn)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("Database connection ping failed: %v", err)
	}

	createTables(driver)
	return DB
}

func createTables(driver string) {
	var queries []string

	if driver == "mysql" {
		// MySQL schema
		queries = []string{
			`CREATE TABLE IF NOT EXISTS producers (
				id INT AUTO_INCREMENT PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				slug VARCHAR(255) NOT NULL UNIQUE,
				plan_tier VARCHAR(50) NOT NULL,
				contact_email VARCHAR(255) NOT NULL,
				brand_logo_url VARCHAR(512),
				status VARCHAR(50) NOT NULL DEFAULT 'active',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS users (
				id INT AUTO_INCREMENT PRIMARY KEY,
				email VARCHAR(255) NOT NULL UNIQUE,
				password_hash VARCHAR(255) NOT NULL,
				role VARCHAR(50) NOT NULL,
				producer_id INT,
				status VARCHAR(50) NOT NULL DEFAULT 'active',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE SET NULL
			);`,
			`CREATE TABLE IF NOT EXISTS products (
				id INT AUTO_INCREMENT PRIMARY KEY,
				producer_id INT NOT NULL,
				name VARCHAR(255) NOT NULL,
				sku VARCHAR(255) NOT NULL UNIQUE,
				category VARCHAR(100) NOT NULL,
				description TEXT,
				image_url VARCHAR(512),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE
			);`,
			`CREATE TABLE IF NOT EXISTS batches (
				id INT AUTO_INCREMENT PRIMARY KEY,
				product_id INT NOT NULL,
				batch_code VARCHAR(100) NOT NULL UNIQUE,
				quantity INT NOT NULL,
				manufacture_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				expiry_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				status VARCHAR(50) NOT NULL DEFAULT 'draft',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
			);`,
			`CREATE TABLE IF NOT EXISTS qr_codes (
				id INT AUTO_INCREMENT PRIMARY KEY,
				batch_id INT NOT NULL,
				token VARCHAR(100) NOT NULL UNIQUE,
				signature VARCHAR(255) NOT NULL,
				status VARCHAR(50) NOT NULL DEFAULT 'active',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
			);`,
			`CREATE TABLE IF NOT EXISTS consumers (
				id INT AUTO_INCREMENT PRIMARY KEY,
				phone_number_hash VARCHAR(255) NOT NULL UNIQUE,
				verification_count INT DEFAULT 0,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS verification_sessions (
				id INT AUTO_INCREMENT PRIMARY KEY,
				qr_code_id INT NOT NULL,
				consumer_id INT,
				device_id TEXT,
				ip_country VARCHAR(100),
				result VARCHAR(50) NOT NULL,
				risk_score DOUBLE NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
				FOREIGN KEY (consumer_id) REFERENCES consumers(id) ON DELETE SET NULL
			);`,
			`CREATE TABLE IF NOT EXISTS reports (
				id INT AUTO_INCREMENT PRIMARY KEY,
				qr_code_id INT NOT NULL,
				consumer_id INT NOT NULL,
				description TEXT,
				retailer_name VARCHAR(255),
				retailer_location TEXT,
				photo_url VARCHAR(512),
				status VARCHAR(50) NOT NULL DEFAULT 'pending',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
				FOREIGN KEY (consumer_id) REFERENCES consumers(id) ON DELETE CASCADE
			);`,
			`CREATE TABLE IF NOT EXISTS fraud_events (
				id INT AUTO_INCREMENT PRIMARY KEY,
				verification_session_id INT NOT NULL,
				signal_type VARCHAR(100) NOT NULL,
				severity VARCHAR(50) NOT NULL,
				resolved_by INT,
				resolved_at TIMESTAMP NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (verification_session_id) REFERENCES verification_sessions(id) ON DELETE CASCADE,
				FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
			);`,
			`CREATE TABLE IF NOT EXISTS audit_logs (
				id INT AUTO_INCREMENT PRIMARY KEY,
				actor_user_id INT,
				action VARCHAR(255) NOT NULL,
				target_entity VARCHAR(100) NOT NULL,
				target_id INT NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
			);`,
		}
	} else {
		// PostgreSQL schema
		queries = []string{
			`CREATE TABLE IF NOT EXISTS producers (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				slug VARCHAR(255) NOT NULL UNIQUE,
				plan_tier VARCHAR(50) NOT NULL,
				contact_email VARCHAR(255) NOT NULL,
				brand_logo_url VARCHAR(512),
				status VARCHAR(50) NOT NULL DEFAULT 'active',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				email VARCHAR(255) NOT NULL UNIQUE,
				password_hash VARCHAR(255) NOT NULL,
				role VARCHAR(50) NOT NULL,
				producer_id INTEGER REFERENCES producers(id) ON DELETE SET NULL,
				status VARCHAR(50) NOT NULL DEFAULT 'active',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS products (
				id SERIAL PRIMARY KEY,
				producer_id INTEGER NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
				name VARCHAR(255) NOT NULL,
				sku VARCHAR(255) NOT NULL UNIQUE,
				category VARCHAR(100) NOT NULL,
				description TEXT,
				image_url VARCHAR(512),
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE
			);`,
			`CREATE TABLE IF NOT EXISTS batches (
				id SERIAL PRIMARY KEY,
				product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
				batch_code VARCHAR(100) NOT NULL UNIQUE,
				quantity INTEGER NOT NULL,
				manufacture_date TIMESTAMP WITH TIME ZONE NOT NULL,
				expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
				status VARCHAR(50) NOT NULL DEFAULT 'draft',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
			);`,
			`CREATE TABLE IF NOT EXISTS qr_codes (
				id SERIAL PRIMARY KEY,
				batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
				token VARCHAR(100) NOT NULL UNIQUE,
				signature VARCHAR(255) NOT NULL,
				status VARCHAR(50) NOT NULL DEFAULT 'active',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
			);`,
			`CREATE TABLE IF NOT EXISTS consumers (
				id SERIAL PRIMARY KEY,
				phone_number_hash VARCHAR(255) NOT NULL UNIQUE,
				verification_count INTEGER DEFAULT 0,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS verification_sessions (
				id SERIAL PRIMARY KEY,
				qr_code_id INTEGER NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
				consumer_id INTEGER REFERENCES consumers(id) ON DELETE SET NULL,
				device_id TEXT,
				ip_country VARCHAR(100),
				result VARCHAR(50) NOT NULL,
				risk_score DOUBLE PRECISION NOT NULL,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS reports (
				id SERIAL PRIMARY KEY,
				qr_code_id INTEGER NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
				consumer_id INTEGER NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
				description TEXT,
				retailer_name VARCHAR(255),
				retailer_location TEXT,
				photo_url VARCHAR(512),
				status VARCHAR(50) NOT NULL DEFAULT 'pending',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS fraud_events (
				id SERIAL PRIMARY KEY,
				verification_session_id INTEGER NOT NULL REFERENCES verification_sessions(id) ON DELETE CASCADE,
				signal_type VARCHAR(100) NOT NULL,
				severity VARCHAR(50) NOT NULL,
				resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
				resolved_at TIMESTAMP WITH TIME ZONE,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS audit_logs (
				id SERIAL PRIMARY KEY,
				actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
				action VARCHAR(255) NOT NULL,
				target_entity VARCHAR(100) NOT NULL,
				target_id INTEGER NOT NULL,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);`,
		}
	}

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			log.Fatalf("Failed to execute database migration query: %v\nQuery: %s", err, q)
		}
	}

	// Run schema migrations to add KYC columns to producers table (ignore errors if columns already exist)
	_, _ = DB.Exec(`ALTER TABLE producers ADD COLUMN id_card_url VARCHAR(512) NULL`)
	_, _ = DB.Exec(`ALTER TABLE producers ADD COLUMN selfie_url VARCHAR(512) NULL`)
	_, _ = DB.Exec(`ALTER TABLE producers ADD COLUMN utility_bill_url VARCHAR(512) NULL`)

	log.Println("Database migration completed successfully.")
}
