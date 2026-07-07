package whatsapp

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/ahnara/antifake/backend/pkg/db"
	"github.com/ahnara/antifake/backend/pkg/email"
	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waCompanionReg"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
)

var Client *whatsmeow.Client

// InitWhatsApp initializes the WhatsApp client and handles pairing if not logged in
func InitWhatsApp() {
	if db.DB == nil {
		log.Println("[WhatsApp] Database connection is not initialized. Skipping WhatsApp setup.")
		return
	}

	// Auto-migrate the session persistence table
	_, err := db.DB.Exec(`CREATE TABLE IF NOT EXISTS whatsapp_sessions (
		id INT PRIMARY KEY,
		data LONGBLOB,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	)`)
	if err != nil {
		// Fallback for Postgres compatibility if database is PostgreSQL
		_, err = db.DB.Exec(`CREATE TABLE IF NOT EXISTS whatsapp_sessions (
			id INT PRIMARY KEY,
			data BYTEA,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)`)
	}
	if err != nil {
		log.Printf("[WhatsApp] Failed to create session persistence table: %v", err)
	}

	// Restore the SQLite session database from MySQL/Postgres if it exists
	var fileData []byte
	row := db.DB.QueryRow("SELECT data FROM whatsapp_sessions WHERE id = 1")
	err = row.Scan(&fileData)
	if err == nil && len(fileData) > 0 {
		err = os.WriteFile("wameow_session.db", fileData, 0644)
		if err != nil {
			log.Printf("[WhatsApp] Failed to write restored session to disk: %v", err)
		} else {
			log.Println("[WhatsApp] Successfully restored WhatsApp session file from database.")
		}
	}

	// Set history sync config to 0 (no history backlog)
	store.DeviceProps.HistorySyncConfig = &waCompanionReg.DeviceProps_HistorySyncConfig{
		FullSyncDaysLimit:   proto.Uint32(0),
		FullSyncSizeMbLimit: proto.Uint32(0),
		StorageQuotaMb:      proto.Uint32(0),
	}

	// Fetch the latest version from WhatsApp servers dynamically to prevent outdated version (405) errors
	latestVer, err := whatsmeow.GetLatestVersion(context.Background(), nil)
	if err == nil {
		store.SetWAVersion(*latestVer)
		log.Printf("[WhatsApp] Dynamically configured client version to: %s", latestVer.String())
	} else {
		log.Printf("[WhatsApp] Failed to fetch latest WhatsApp version dynamically: %v", err)
	}

	dbLog := waLog.Stdout("Database", "WARN", true)
	// Open the local SQLite database file (using journal_mode=truncate so we sync a single self-contained file with no -wal or -shm files)
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:wameow_session.db?_foreign_keys=on&_journal_mode=truncate", dbLog)
	if err != nil {
		log.Printf("[WhatsApp] Failed to initialize sqlstore: %v", err)
		return
	}
	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		log.Printf("[WhatsApp] Failed to get device store: %v", err)
		return
	}

	clientLog := waLog.Stdout("Client", "WARN", true)
	Client = whatsmeow.NewClient(deviceStore, clientLog)
	Client.ManualHistorySyncDownload = true

	// Start the database backup worker to persist session updates in the background
	startBackupWorker()

	if Client.Store.ID == nil {
		err = Client.Connect()
		if err != nil {
			log.Printf("Failed to connect whatsmeow: %v", err)
			return
		}

		// Wait for connection to be fully established and stabilized (up to 10s)
		connected := false
		for i := 0; i < 20; i++ {
			if Client.IsConnected() {
				connected = true
				break
			}
			time.Sleep(500 * time.Millisecond)
		}

		if !connected {
			log.Println("Failed to generate WhatsApp pairing code: connection handshake timed out.")
			return
		}
		time.Sleep(1500 * time.Millisecond) // Let WebSocket handshake fully stabilize

		phoneNum := os.Getenv("WHATSAPP_PHONE")
		if phoneNum != "" {
			// Generate 8-character pairing code
			code, err := Client.PairPhone(context.Background(), phoneNum, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
			if err != nil {
				log.Printf("Failed to generate WhatsApp phone pairing code: %v", err)
			} else {
				log.Printf("\n==================================================")
				log.Printf("  WHATSAPP PHONE PAIRING CODE GENERATED")
				log.Printf("  Phone Number: %s", phoneNum)
				log.Printf("  Pairing Code: %s", code)
				log.Printf("  Go to WhatsApp on your phone -> Linked Devices -> Link with Phone Number and enter this code.")
				log.Printf("==================================================\n")

				// Automatically email the pairing code to the admin
				errEmail := email.SendWhatsAppPairingCode(phoneNum, code)
				if errEmail != nil {
					log.Printf("[WhatsApp Pairing] Failed to email pairing code: %v", errEmail)
				} else {
					log.Printf("[WhatsApp Pairing] Successfully emailed pairing code to ifeanyireed@gmail.com")
				}
			}
		} else {
			// Fallback to QR channel pairing URL
			qrChan, _ := Client.GetQRChannel(context.Background())
			go func() {
				for evt := range qrChan {
					if evt.Event == "code" {
						log.Printf("\n==================================================")
						log.Printf("  WhatsApp Pairing Link Required (AntiFakeNG)")
						log.Printf("  Pairing code: %s", evt.Code)
						log.Printf("  Paste code into a QR scanner or link in WhatsApp.")
						log.Printf("==================================================\n")
					} else {
						log.Printf("WhatsApp pairing event: %s", evt.Event)
					}
				}
			}()
		}
	} else {
		// Already paired, just connect
		err = Client.Connect()
		if err != nil {
			log.Printf("Failed to connect paired whatsmeow: %v", err)
			return
		}
		log.Println("WhatsApp client connected successfully.")
	}
}

func startBackupWorker() {
	var lastHash string
	ticker := time.NewTicker(3 * time.Second)
	go func() {
		for range ticker.C {
			if db.DB == nil {
				continue
			}

			// In truncate journal mode, changes are written to the main file, keeping wameow_session.db self-contained
			data, err := os.ReadFile("wameow_session.db")
			if err != nil {
				continue
			}

			// Compute MD5 hash to detect actual changes
			hasher := md5.New()
			hasher.Write(data)
			hash := hex.EncodeToString(hasher.Sum(nil))

			if hash == lastHash {
				continue // No changes
			}

			// Database-agnostic upsert: UPDATE first, then INSERT if rows affected is 0
			res, err := db.DB.Exec("UPDATE whatsapp_sessions SET data = ? WHERE id = 1", data)
			if err == nil {
				rows, _ := res.RowsAffected()
				if rows == 0 {
					_, err = db.DB.Exec("INSERT INTO whatsapp_sessions (id, data) VALUES (1, ?)", data)
				}
			}

			if err != nil {
				log.Printf("[WhatsApp] Failed to backup session to database: %v", err)
			} else {
				lastHash = hash
				log.Println("[WhatsApp] Successfully backed up WhatsApp session file to database.")
			}
		}
	}()
}

// SendOTP sends verification details to the consumer via WhatsApp
func SendOTP(phone string, code string, token string) error {
	if Client == nil {
		return fmt.Errorf("whatsapp client is not initialized")
	}

	// Try connecting if disconnected
	if !Client.IsConnected() {
		err := Client.Connect()
		if err != nil {
			return fmt.Errorf("whatsapp client is disconnected and reconnection failed: %w", err)
		}
		// Wait a brief moment to authenticate
		time.Sleep(1 * time.Second)
	}

	// Format phone number to JID: e.g. "2348033333333@s.whatsapp.net"
	phoneClean := strings.TrimPrefix(phone, "+")
	phoneClean = strings.ReplaceAll(phoneClean, " ", "")
	
	// Default Nigerian prefix handling
	if strings.HasPrefix(phoneClean, "0") {
		phoneClean = "234" + phoneClean[1:]
	}

	// Ensure JID contains only digits and matches s.whatsapp.net format
	recipientJID := types.NewJID(phoneClean, types.DefaultUserServer)

	msgText := fmt.Sprintf(
		"🔒 *AntiFakeNG Verification Code*\n\n"+
		"Your verification code is: *%s*\n"+
		"Verification Token: `%s`\n\n"+
		"Scan QR code or visit https://antifake.ng/verify to verify authenticity.", 
		code, token,
	)
	
	msg := &waE2E.Message{
		Conversation: proto.String(msgText),
	}

	_, err := Client.SendMessage(context.Background(), recipientJID, msg)
	if err != nil {
		return fmt.Errorf("failed to send WhatsApp message: %w", err)
	}

	log.Printf("[WhatsApp] Successfully sent OTP code %s to %s", code, phoneClean)
	return nil
}
