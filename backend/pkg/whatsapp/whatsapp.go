package whatsapp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

// InitWhatsApp initializes the WhatsApp client credentials check
func InitWhatsApp() {
	token := os.Getenv("WHATSAPP_ACCESS_TOKEN")
	phoneID := os.Getenv("WHATSAPP_PHONE_NUMBER_ID")
	if token == "" || phoneID == "" {
		log.Println("[WhatsApp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing. WhatsApp Cloud API is not configured.")
	} else {
		log.Printf("[WhatsApp] Cloud API initialized successfully with Phone Number ID: %s", phoneID)
	}
}

// IsConfigured returns true if the Meta WhatsApp Cloud API credentials are set
func IsConfigured() bool {
	return os.Getenv("WHATSAPP_ACCESS_TOKEN") != "" && os.Getenv("WHATSAPP_PHONE_NUMBER_ID") != ""
}

// SendOTP sends verification details to the consumer via Meta WhatsApp Business Cloud API
func SendOTP(phone string, code string, token string) error {
	accessToken := os.Getenv("WHATSAPP_ACCESS_TOKEN")
	phoneID := os.Getenv("WHATSAPP_PHONE_NUMBER_ID")

	if accessToken == "" || phoneID == "" {
		return fmt.Errorf("whatsapp cloud API credentials are not configured")
	}

	// Format phone number: remove '+' and spaces
	phoneClean := strings.TrimPrefix(phone, "+")
	phoneClean = strings.ReplaceAll(phoneClean, " ", "")
	if strings.HasPrefix(phoneClean, "0") {
		phoneClean = "234" + phoneClean[1:]
	}

	msgText := fmt.Sprintf(
		"🔒 *AntiFakeNG Verification Code*\n\n"+
		"Your verification code is: *%s*\n"+
		"Verification Token: `%s`\n\n"+
		"Scan QR code or visit https://antifake.ng/verify to verify authenticity.", 
		code, token,
	)

	// Build the payload
	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
		"recipient_type":    "individual",
		"to":                phoneClean,
		"type":              "text",
		"text": map[string]interface{}{
			"body": msgText,
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal whatsapp payload: %w", err)
	}

	apiURL := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/messages", phoneID)
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to create http request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("whatsapp http request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("whatsapp cloud API returned status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("[WhatsApp] Cloud API message sent successfully. Status: %s, Response: %s", resp.Status, string(body))
	return nil
}

// SendOTPWithTemplate sends verification details using a Meta approved WhatsApp Template
func SendOTPWithTemplate(phone string, code string, templateName string, langCode string) error {
	accessToken := os.Getenv("WHATSAPP_ACCESS_TOKEN")
	phoneID := os.Getenv("WHATSAPP_PHONE_NUMBER_ID")

	if accessToken == "" || phoneID == "" {
		return fmt.Errorf("whatsapp cloud API credentials are not configured")
	}

	phoneClean := strings.TrimPrefix(phone, "+")
	phoneClean = strings.ReplaceAll(phoneClean, " ", "")
	if strings.HasPrefix(phoneClean, "0") {
		phoneClean = "234" + phoneClean[1:]
	}

	// Build the template payload with code parameters
	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
		"recipient_type":    "individual",
		"to":                phoneClean,
		"type":              "template",
		"template": map[string]interface{}{
			"name": templateName,
			"language": map[string]interface{}{
				"code": langCode,
			},
			"components": []map[string]interface{}{
				{
					"type": "body",
					"parameters": []map[string]interface{}{
						{
							"type": "text",
							"text": code,
						},
					},
				},
				{
					"type": "button",
					"sub_type": "url",
					"index": "0",
					"parameters": []map[string]interface{}{
						{
							"type": "text",
							"text": code,
						},
					},
				},
			},
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal template payload: %w", err)
	}

	apiURL := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/messages", phoneID)
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to create http request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("whatsapp http request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("whatsapp cloud API template response %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("[WhatsApp] Cloud API Template message sent successfully. Status: %s, Response: %s", resp.Status, string(body))
	return nil
}
