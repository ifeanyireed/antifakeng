package whatsapp

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/ahnara/antifake/backend/pkg/email"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	whatsmeow "github.com/pbribeiro/whatsmeow-mysql"
	"github.com/pbribeiro/whatsmeow-mysql/proto/waCompanionReg"
	"github.com/pbribeiro/whatsmeow-mysql/proto/waE2E"
	"github.com/pbribeiro/whatsmeow-mysql/store"
	"github.com/pbribeiro/whatsmeow-mysql/store/sqlstore"
	"github.com/pbribeiro/whatsmeow-mysql/types"
	waLog "github.com/pbribeiro/whatsmeow-mysql/util/log"
	"google.golang.org/protobuf/proto"
)

var Client *whatsmeow.Client

// InitWhatsApp initializes the WhatsApp client and handles pairing if not logged in
func InitWhatsApp() {
	// Request 0 days of history and set quota to 0MB to disable history sync completely
	store.DeviceProps.HistorySyncConfig = &waCompanionReg.DeviceProps_HistorySyncConfig{
		FullSyncDaysLimit:   proto.Uint32(0),
		FullSyncSizeMbLimit: proto.Uint32(0),
		StorageQuotaMb:      proto.Uint32(0),
	}

	// Fetch the latest version from WhatsApp servers dynamically to prevent outdated version (405) errors
	latestVer, err := whatsmeow.GetLatestVersion(nil)
	if err == nil {
		store.SetWAVersion(*latestVer)
		log.Printf("[WhatsApp] Dynamically configured client version to: %s", latestVer.String())
	} else {
		log.Printf("[WhatsApp] Failed to fetch latest WhatsApp version dynamically: %v", err)
	}

	var driverName string
	var dsn string

	// Try dedicated WHATSAPP_DATABASE_URL first, fall back to main DATABASE_URL
	dbURL := os.Getenv("WHATSAPP_DATABASE_URL")
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}

	if dbURL != "" {
		if strings.HasPrefix(dbURL, "mysql://") {
			driverName = "mysql"
			u, err := url.Parse(dbURL)
			if err == nil {
				pass, _ := u.User.Password()
				dsn = fmt.Sprintf("%s:%s@tcp(%s)%s", u.User.Username(), pass, u.Host, u.Path)
				if !strings.Contains(dsn, "parseTime=") {
					if strings.Contains(dsn, "?") {
						dsn += "&parseTime=true"
					} else {
						dsn += "?parseTime=true"
					}
				}
			} else {
				log.Printf("Failed to parse DATABASE_URL for MySQL: %v", err)
				return
			}
		} else if strings.HasPrefix(dbURL, "postgres://") || strings.HasPrefix(dbURL, "postgresql://") {
			driverName = "postgres"
			dsn = dbURL
		} else {
			driverName = "sqlite3"
			dbPath := os.Getenv("WAMEOW_DB_PATH")
			if dbPath == "" {
				dbPath = "wameow_session.db"
			}
			dsn = fmt.Sprintf("file:%s?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", dbPath)
		}
	} else {
		driverName = "sqlite3"
		dbPath := os.Getenv("WAMEOW_DB_PATH")
		if dbPath == "" {
			dbPath = "wameow_session.db"
		}
		dsn = fmt.Sprintf("file:%s?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", dbPath)
	}

	dbLog := waLog.Stdout("Database", "WARN", true)
	container, err := sqlstore.New(driverName, dsn, dbLog)
	if err != nil {
		log.Printf("Failed to initialize database store for whatsmeow: %v", err)
		return
	}
	deviceStore, err := container.GetFirstDevice()
	if err != nil {
		log.Printf("Failed to get device store for whatsmeow: %v", err)
		return
	}
	clientLog := waLog.Stdout("Client", "WARN", true)
	Client = whatsmeow.NewClient(deviceStore, clientLog)

	if Client.Store.ID == nil {
		err = Client.Connect()
		if err != nil {
			log.Printf("Failed to connect whatsmeow: %v", err)
			return
		}

		phoneNum := os.Getenv("WHATSAPP_PHONE")
		if phoneNum != "" {
			// Generate 8-character pairing code
			code, err := Client.PairPhone(phoneNum, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
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
