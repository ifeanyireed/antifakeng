package whatsapp

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/ahnara/antifake/backend/pkg/email"
	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
)

var Client *whatsmeow.Client

// InitWhatsApp initializes the WhatsApp client and handles pairing if not logged in
func InitWhatsApp() {
	dbLog := waLog.Stdout("Database", "WARN", true)
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:wameow_session.db?_foreign_keys=on", dbLog)
	if err != nil {
		log.Printf("Failed to initialize SQLite for whatsmeow: %v", err)
		return
	}
	deviceStore, err := container.GetFirstDevice(context.Background())
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
