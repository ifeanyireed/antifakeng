package email

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"os"
)

// sendSMTP is a unified private helper to handle the SSL/TLS/SMTP transmission
func sendSMTP(recipient, subject, bodyHTML string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	if smtpHost == "" {
		smtpHost = "smtp.hostinger.com"
	}
	smtpPortStr := os.Getenv("SMTP_PORT")
	if smtpPortStr == "" {
		smtpPortStr = "465"
	}
	smtpUser := os.Getenv("SMTP_USER")
	if smtpUser == "" {
		smtpUser = "noreply@resultspro.ng"
	}
	smtpPass := os.Getenv("SMTP_PASS")
	if smtpPass == "" {
		smtpPass = "*Reedb4b4"
	}
	fromEmail := os.Getenv("FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "noreply@antifake.ng"
	}

	fromHeader := fmt.Sprintf("From: AntiFakeNG <%s>\n", fromEmail)
	subjectHeader := fmt.Sprintf("Subject: %s\n", subject)
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"

	msg := []byte(fromHeader + subjectHeader + mime + bodyHTML)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPortStr)
	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	// Secure SSL/TLS configuration for Port 465 (Default Hostinger Configuration)
	if smtpPortStr == "465" {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: true,
			ServerName:         smtpHost,
		}
		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			return fmt.Errorf("failed to dial SMTP SSL/TLS connection: %w", err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, smtpHost)
		if err != nil {
			return fmt.Errorf("failed to create SMTP SSL client: %w", err)
		}
		defer client.Quit()

		if err = client.Auth(auth); err != nil {
			return fmt.Errorf("SMTP SSL credentials authorization failed: %w", err)
		}
		if err = client.Mail(smtpUser); err != nil {
			return fmt.Errorf("SMTP SSL MAIL FROM declaration failed: %w", err)
		}
		if err = client.Rcpt(recipient); err != nil {
			return fmt.Errorf("SMTP SSL RCPT TO destination address rejected: %w", err)
		}
		w, err := client.Data()
		if err != nil {
			return fmt.Errorf("SMTP SSL DATA pipeline creation failed: %w", err)
		}
		_, err = w.Write(msg)
		if err != nil {
			return fmt.Errorf("SMTP SSL write payload to buffer failed: %w", err)
		}
		err = w.Close()
		if err != nil {
			return fmt.Errorf("SMTP SSL writer stream termination failed: %w", err)
		}
	} else {
		// Port 587 (TLS/StartTLS)
		err := smtp.SendMail(addr, auth, smtpUser, []string{recipient}, msg)
		if err != nil {
			return fmt.Errorf("SMTP SendMail standard pipeline failed: %w", err)
		}
	}

	log.Printf("[SMTP Email] Sent email successfully to %s: %s", recipient, subject)
	return nil
}

// wrapInTemplate wraps specific notification content inside the global Ahnara / AntiFakeNG layout frame
func wrapInTemplate(title, contentHTML string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet">
	<style>
		body {
			margin: 0;
			padding: 0;
			width: 100%% !important;
			background-color: #E8EFF4;
			font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
		}
		.email-container {
			max-width: 580px;
			margin: 40px auto;
			background-color: #FFFFFF;
			border-radius: 16px;
			border: 1px solid rgba(0, 0, 0, 0.05);
			box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
			overflow: hidden;
		}
		.header {
			background-color: #FFFFFF;
			padding: 24px 32px;
			text-align: center;
			border-bottom: 3px solid #245C44;
		}
		.logo-container {
			display: inline-flex;
			flex-direction: column;
			align-items: center;
			gap: 12px;
			text-decoration: none;
		}
		.logo-img {
			height: 48px;
			width: 48px;
			object-fit: contain;
		}
		.logo-text {
			font-size: 22px;
			font-weight: 800;
			color: #0D090C;
			letter-spacing: -0.04em;
			font-family: 'DM Sans', sans-serif;
		}
		.body {
			padding: 40px 32px 32px 32px;
		}
		.title {
			font-size: 22px;
			font-weight: 700;
			color: #0D090C;
			margin-top: 0;
			margin-bottom: 20px;
			letter-spacing: -0.03em;
			line-height: 1.25;
		}
		.text {
			font-size: 15px;
			color: #334155;
			line-height: 1.6;
			margin-top: 0;
			margin-bottom: 16px;
		}
		
		/* Form Field Styles matching Ahnara Forms */
		.form-card {
			background-color: #FFFFFF;
			border: 1px solid rgba(0, 0, 0, 0.07);
			border-radius: 16px;
			padding: 24px;
			margin: 24px 0;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
		}
		.form-field {
			margin-bottom: 20px;
		}
		.form-field:last-child {
			margin-bottom: 0;
		}
		.field-label {
			font-size: 11px;
			font-weight: 700;
			color: #64748B;
			text-transform: uppercase;
			letter-spacing: 0.1em;
			display: block;
			margin-bottom: 6px;
		}
		.field-input {
			display: block;
			width: 100%%;
			box-sizing: border-box;
			background-color: #FFFFFF;
			border: 1px solid rgba(0, 0, 0, 0.07);
			border-radius: 8px;
			padding: 12px 16px;
			font-size: 14px;
			color: #0D090C;
			font-weight: 500;
			font-family: 'DM Sans', sans-serif;
		}
		.field-textarea {
			display: block;
			width: 100%%;
			box-sizing: border-box;
			background-color: #FFFFFF;
			border: 1px solid rgba(0, 0, 0, 0.07);
			border-radius: 8px;
			padding: 14px 16px;
			font-size: 14px;
			color: #334155;
			line-height: 1.6;
			min-height: 100px;
			white-space: pre-wrap;
			font-family: 'DM Sans', sans-serif;
		}
		
		/* Highlight Box for OTP Codes using Blue theme instead of Orange */
		.highlight-box {
			background-color: #F0F9FF;
			border: 1px solid #B9E6FE;
			border-radius: 12px;
			padding: 24px;
			margin: 24px 0;
			text-align: center;
		}
		.highlight-code {
			font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
			font-size: 36px;
			font-weight: 800;
			color: #0089C1;
			letter-spacing: 4px;
			margin: 0;
		}
		.highlight-sub {
			font-size: 12px;
			color: #0089C1;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin-top: 8px;
			margin-bottom: 0;
		}
		
		.footer {
			background-color: #F8FAFC;
			padding: 24px 32px;
			text-align: center;
			border-top: 1px solid #E2E8F0;
		}
		.footer-text {
			font-size: 11px;
			color: #94A3B8;
			margin: 0;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.08em;
		}
		ol {
			padding-left: 20px;
			margin: 0 0 16px 0;
		}
		li {
			font-size: 14px;
			color: #334155;
			margin-bottom: 8px;
			line-height: 1.5;
		}
	</style>
</head>
<body>
	<div class="email-container">
		<div class="header">
			<a href="https://antifake.ng" class="logo-container">
				<img src="https://antifake.ng/logo.png" alt="AntiFakeNG Logo" class="logo-img">
				<span class="logo-text">AntiFake<span style="color: #245C44;">NG</span></span>
			</a>
		</div>
		<div class="body">
			<h2 class="title">%s</h2>
			%s
		</div>
		<div class="footer">
			<p class="footer-text">AntiFakeNG Automated Notification Gateway</p>
		</div>
	</div>
</body>
</html>`, title, contentHTML)
}

// SendProducerSignupNotification emails the administrator when a new producer signs up
func SendProducerSignupNotification(producerName, producerEmail, plan string) error {
	recipient := os.Getenv("NOTIFICATION_EMAIL")
	if recipient == "" {
		recipient = "ifeanyireed@gmail.com"
	}

	subject := fmt.Sprintf("🚀 New Producer Registered: %s", producerName)
	content := fmt.Sprintf(`
		<p class="text">A new manufacturer has registered a tenant profile on AntiFakeNG:</p>
		
		<div class="form-card">
			<div class="form-field">
				<span class="field-label">Brand Name</span>
				<div class="field-input" style="font-weight: 700;">%s</div>
			</div>
			<div class="form-field">
				<span class="field-label">Contact Email</span>
				<div class="field-input">%s</div>
			</div>
			<div class="form-field">
				<span class="field-label">Requested Plan</span>
				<div class="field-input" style="color: #245C44; font-weight: 700; text-transform: uppercase;">%s</div>
			</div>
		</div>
		
		<p class="text">Please review and approve this tenant's registration inside the Administrator Dashboard.</p>
	`, producerName, producerEmail, plan)

	bodyHTML := wrapInTemplate("New Producer Onboarding Signal", content)
	return sendSMTP(recipient, subject, bodyHTML)
}

// SendEmailVerificationCode sends the 6-digit email OTP verification code to a newly registered producer
func SendEmailVerificationCode(recipient, code string) error {
	subject := "🔑 Verify Your AntiFakeNG Account"
	content := fmt.Sprintf(`
		<p class="text">Thank you for signing up for AntiFakeNG. Please use the verification code below to verify your email address and continue onboarding:</p>
		
		<div class="highlight-box">
			<h3 class="highlight-code">%s</h3>
			<p class="highlight-sub">Verification Code</p>
		</div>

		<p class="text" style="font-size: 13px; color: #64748B; text-align: center;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
	`, code)

	bodyHTML := wrapInTemplate("Verify Your Email Address", content)
	return sendSMTP(recipient, subject, bodyHTML)
}

// SendWhatsAppPairingCode emails the administrator when WhatsApp needs reconnection/pairing
func SendWhatsAppPairingCode(phone, pairingCode string) error {
	recipient := os.Getenv("NOTIFICATION_EMAIL")
	if recipient == "" {
		recipient = "ifeanyireed@gmail.com"
	}

	subject := "⚠️ ACTION REQUIRED: Link WhatsApp Gateway"
	
	// Strip +234 if it exists in the raw phone variable for rendering the national number
	displayPhone := phone
	if len(phone) > 3 && phone[:3] == "234" {
		displayPhone = phone[3:]
	} else if len(phone) > 4 && phone[:4] == "+234" {
		displayPhone = phone[4:]
	}

	content := fmt.Sprintf(`
		<p class="text">Your AntiFakeNG WhatsApp OTP Gateway requires linking or re-authentication.</p>
		
		<div class="form-card">
			<div class="form-field">
				<span class="field-label">Phone Number</span>
				<div style="display: flex; align-items: center; background-color: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 8px; padding: 10px 14px; font-size: 14px; color: #0D090C;">
					<div style="display: inline-flex; align-items: center; margin-right: 12px; border-right: 1px solid rgba(0,0,0,0.07); padding-right: 12px;">
						<!-- Nigeria Flag -->
						<div style="width: 18px; height: 12px; display: inline-flex; overflow: hidden; border-radius: 1px; border: 0.5px solid rgba(0,0,0,0.05); margin-right: 6px; vertical-align: middle;">
							<div style="width: 6px; height: 100%%; background-color: #008751;"></div>
							<div style="width: 6px; height: 100%%; background-color: #FFFFFF;"></div>
							<div style="width: 6px; height: 100%%; background-color: #008751;"></div>
						</div>
						<span style="font-weight: 600; font-size: 13px; color: #0D090C; vertical-align: middle;">+234</span>
					</div>
					<span style="font-weight: 600; font-size: 14px; font-family: 'DM Sans', sans-serif;">%s</span>
				</div>
			</div>
		</div>

		<div class="highlight-box">
			<h3 class="highlight-code">%s</h3>
			<p class="highlight-sub">Pairing Code</p>
		</div>

		<h3 style="color: #0D090C; font-size: 16px; font-weight: 700; margin-top: 24px; margin-bottom: 12px;">Pairing Instructions:</h3>
		<ol>
			<li>Open <b>WhatsApp</b> on your phone.</li>
			<li>Go to <b>Settings</b> &rarr; <b>Linked Devices</b> &rarr; <b>Link a Device</b>.</li>
			<li>Choose <b>Link with phone number instead</b>.</li>
			<li>Enter the pairing code shown above: <b>%s</b>.</li>
		</ol>
		<p class="text" style="font-size: 13px; color: #64748B;">The code will expire shortly. If it expires before you pair, run the check again to generate a new code.</p>
	`, displayPhone, pairingCode, pairingCode)

	bodyHTML := wrapInTemplate("WhatsApp Connection Required", content)
	return sendSMTP(recipient, subject, bodyHTML)
}

// SendSupportNotification emails the administrator when a support message or counterfeit report is submitted
func SendSupportNotification(formType, name, email, phone, subject, token, storeName, message string) error {
	recipient := os.Getenv("NOTIFICATION_EMAIL")
	if recipient == "" {
		recipient = "ifeanyireed@gmail.com"
	}

	title := "New Support Inquiry Received"
	subjectHeader := "New Support Inquiry"
	if formType == "report" {
		title = "🚨 Counterfeit Product Report"
		subjectHeader = "🚨 COUNTERFEIT PRODUCT REPORT"
	}

	if subject != "" {
		subjectHeader = fmt.Sprintf("%s: %s", subjectHeader, subject)
	}

	// Construct HTML details inside a form card
	var fieldsHTML string
	if formType == "report" {
		fieldsHTML = fmt.Sprintf(`
			<div class="form-field">
				<span class="field-label">Fake Token</span>
				<div class="field-input" style="font-family: monospace; font-weight: 700; color: #DC2626; letter-spacing: 1px;">%s</div>
			</div>
			<div class="form-field">
				<span class="field-label">Retailer Name</span>
				<div class="field-input">%s</div>
			</div>
			<div class="form-field">
				<span class="field-label">Retailer Location</span>
				<div class="field-input">%s</div>
			</div>
			<div class="form-field">
				<span class="field-label">Reporter Phone</span>
				<div class="field-input">%s</div>
			</div>
		`, token, storeName, subject, phone)
	} else {
		fieldsHTML = fmt.Sprintf(`
			<div class="form-field">
				<span class="field-label">Name</span>
				<div class="field-input" style="font-weight: 700;">%s</div>
			</div>
			<div class="form-field">
				<span class="field-label">Email</span>
				<div class="field-input">%s</div>
			</div>
			<div class="form-field">
				<span class="field-label">Phone</span>
				<div class="field-input">%s</div>
			</div>
		`, name, email, phone)
	}

	content := fmt.Sprintf(`
		<div class="form-card">
			%s
			<div class="form-field">
				<span class="field-label">Message / Inquiry Details</span>
				<div class="field-textarea">%s</div>
			</div>
		</div>
	`, fieldsHTML, message)

	bodyHTML := wrapInTemplate(title, content)
	return sendSMTP(recipient, subjectHeader, bodyHTML)
}
