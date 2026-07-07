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

type SendTokenPayload struct {
	APIKey         string `json:"api_key"`
	PinType        string `json:"pin_type"`
	To             string `json:"to"`
	From           string `json:"from"`
	Channel        string `json:"channel"`
	PinAttempts    int    `json:"pin_attempts"`
	PinTimeToLive  int    `json:"pin_time_to_live"`
	PinLength      int    `json:"pin_length"`
	PinPlaceholder string `json:"pin_placeholder"`
	MessageText    string `json:"message_text"`
}

type SendTokenResponse struct {
	PinID     string `json:"pinId"`
	To        string `json:"to"`
	SMSStatus string `json:"smsStatus"`
}

type VerifyTokenPayload struct {
	APIKey string `json:"api_key"`
	PinID  string `json:"pin_id"`
	Pin    string `json:"pin"`
}

// SendSMS sends a plain SMS verification code via Termii SMS API (standard route)
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
		Channel: "generic", // standard generic channel
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

// SendToken generates and sends a secure OTP token via Termii Send Token API
func SendToken(phone string, token string) (string, error) {
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
		return "", fmt.Errorf("Termii API key is not configured in environment")
	}

	// Clean and format phone number (e.g., 2348000000000)
	phoneClean := strings.TrimPrefix(phone, "+")
	phoneClean = strings.ReplaceAll(phoneClean, " ", "")
	if strings.HasPrefix(phoneClean, "0") {
		phoneClean = "234" + phoneClean[1:]
	}

	// Termii Send Token requires the pin placeholder to match the generated code block
	placeholder := "< 1234 >"
	messageText := fmt.Sprintf(
		"Your AntiFakeNG verification code is: %s for package serial: %s. Visit antifake.ng/verify to verify.", 
		placeholder, token,
	)

	payload := SendTokenPayload{
		APIKey:         apiKey,
		PinType:        "NUMERIC",
		To:             phoneClean,
		From:           senderID,
		Channel:        "dnd", // Use DND channel to route OTPs past mobile provider restrictions
		PinAttempts:    3,
		PinTimeToLive:  5, // Valid for 5 minutes
		PinLength:      6,
		PinPlaceholder: placeholder,
		MessageText:    messageText,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to serialize termii send token request: %w", err)
	}

	endpoint := fmt.Sprintf("%s/api/sms/otp/send", strings.TrimSuffix(baseURL, "/"))
	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", fmt.Errorf("failed to instantiate termii send token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("termii send token HTTP dispatch failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("termii API returned HTTP status error: %d", resp.StatusCode)
	}

	var sendResp SendTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&sendResp); err != nil {
		return "", fmt.Errorf("failed to decode termii send token response: %w", err)
	}

	if sendResp.PinID == "" {
		return "", fmt.Errorf("termii send token response did not contain a pinId")
	}

	return sendResp.PinID, nil
}

// VerifyToken validates a user-submitted code using Termii Verify Token API
func VerifyToken(pinID string, pin string) (bool, error) {
	baseURL := os.Getenv("TERMII_BASE_URL")
	if baseURL == "" {
		baseURL = "https://v3.api.termii.com"
	}
	apiKey := os.Getenv("TERMII_API_KEY")
	if apiKey == "" {
		return false, fmt.Errorf("Termii API key is not configured in environment")
	}

	payload := VerifyTokenPayload{
		APIKey: apiKey,
		PinID:  pinID,
		Pin:    pin,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return false, fmt.Errorf("failed to serialize termii verification request: %w", err)
	}

	endpoint := fmt.Sprintf("%s/api/sms/otp/verify", strings.TrimSuffix(baseURL, "/"))
	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return false, fmt.Errorf("failed to instantiate termii verification request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("termii verification HTTP dispatch failed: %w", err)
	}
	defer resp.Body.Close()

	var verifyResp struct {
		Status   string      `json:"status"`
		Verified interface{} `json:"verified"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&verifyResp); err != nil {
		return false, fmt.Errorf("failed to decode termii verification response: %w", err)
	}

	switch val := verifyResp.Verified.(type) {
	case bool:
		return val, nil
	case string:
		return strings.ToLower(val) == "true" || strings.ToLower(val) == "success", nil
	default:
		return false, nil
	}
}
