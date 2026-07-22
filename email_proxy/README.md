# Email Proxy API

A secure PHP email relay API designed to be hosted on Hostinger. It accepts authenticated HTTPS requests from a Go backend and sends transactional emails using PHPMailer via Hostinger's local mail service.

## Features
- JSON Payload handling (`to`, `subject`, `html`, `text`)
- API Key Authentication (Bearer token or `X-API-Key` header)
- Secure credential storage (via `.htaccess` protected directory)
- Basic IP-based rate limiting (10 requests per minute)
- Failed authentication logging

## Deployment Steps

1. **Upload Files:** Upload the entire `email_proxy` folder to your Hostinger server.
2. **Install Dependencies:** SSH into your server, navigate to the `email_proxy` folder, and run:
   ```bash
   composer install
   ```
   *(If you don't have SSH access, you can run `composer install` locally and upload the generated `vendor` folder.)*
3. **Configure Settings:**
   - Copy `config/config.example.php` to `config/config.php`.
   - Update `config/config.php` with your Hostinger SMTP credentials.
   - Generate a strong `api_key` and update it in `config.php`.
4. **Security Note:**
   - The `config` and `logs` directories contain an `.htaccess` file with `Require all denied` to prevent direct web access on Apache servers (which Hostinger uses). Ensure this file is uploaded.

## API Documentation

### Endpoint URL
`POST https://mail.resultspro.ng/email_proxy/api/send-email.php`

### Authentication
Include your API key in the headers. You can use either:
```
Authorization: Bearer my_api_key_6f3b92d8a4c1e7f50b4a1d9c2e8f7a3b
```
*or*
```
X-API-Key: my_api_key_6f3b92d8a4c1e7f50b4a1d9c2e8f7a3b
```

### Request Format (JSON)
```json
{
  "to": "recipient@example.com",
  "subject": "Welcome to our platform!",
  "html": "<h1>Hello!</h1><p>Thanks for joining.</p>",
  "text": "Hello! Thanks for joining.",
  "from": "info@netslogistics.com",
  "from_name": "Nets Logistics"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### Response (Error)
```json
{
  "error": "Invalid or missing \"to\" email address"
}
```

## Go Backend Integration Example

Here is how your Go service can reliably call the PHP endpoint:

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://mail.resultspro.ng/email_proxy/api/send-email.php"
	
	payload := map[string]string{
		"to":        "recipient@example.com",
		"subject":   "Test Email",
		"html":      "<b>Hello from Go!</b>",
		"from":      "info@netslogistics.com",
		"from_name": "Nets Logistics",
	}
	
	jsonPayload, _ := json.Marshal(payload)
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		fmt.Println("Error creating request:", err)
		return
	}
	
	req.Header.Set("Content-Type", "application/json")
	// Use the Bearer token standard or X-API-Key
	req.Header.Set("Authorization", "Bearer my_api_key_6f3b92d8a4c1e7f50b4a1d9c2e8f7a3b")
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()
	
	fmt.Println("Response Status:", resp.Status)
}
```
