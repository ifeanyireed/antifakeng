package termii

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type SendSMSPayload struct {
	To      string `json:"to"`
	From    string `json:"from"`
	SMS     string `json:"sms"`
	Type    string `json:"type"`
	Channel string `json:"channel"`
	APIKey  string `json:"api_key"`
}

// SendSMS sends an OTP verification code via Termii SMS API
func SendSMS(phone string, code string, token string) error {
	baseURL := os.Getenv("TERMII_BASE_URL")
	if baseURL == "" {
		baseURL = "https://v3.api.termii.com"
	}
	apiKey := os.Getenv("TERMII_API_KEY")
	senderID := os.Getenv("TERMII_SENDER_ID")
	if senderID == "" {
		senderID = "antifakeNG"
	}

	if apiKey == "" {
		return fmt.Errorf("Termii API key is not configured in environment")
	}

	// Clean and format phone number (e.g., 2348000000000)
	phoneClean := strings.TrimPrefix(phone, "+")
	phoneClean = strings.ReplaceAll(phoneClean, " ", "")
	if strings.HasPrefix(phoneClean, "0") {
		phoneClean = "234" + phoneClean[1:]
	}

	smsText := fmt.Sprintf(
		"Your AntiFakeNG verification code is: %s for package serial: %s. Visit antifake.ng/verify to verify.", 
		code, token,
	)

	payload := SendSMSPayload{
		To:      phoneClean,
		From:    senderID,
		SMS:     smsText,
		Type:    "plain",
		Channel: "generic", // standard transactional generic channel
		APIKey:  apiKey,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to serialize termii request: %w", err)
	}

	endpoint := fmt.Sprintf("%s/api/sms/send", strings.TrimSuffix(baseURL, "/"))
	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to instantiate termii request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("termii HTTP dispatch failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("termii API returned HTTP status error: %d", resp.StatusCode)
	}

	return nil
}
