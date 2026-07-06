package email

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"os"
)

// SendProducerSignupNotification emails the administrator when a new producer signs up
func SendProducerSignupNotification(producerName, producerEmail, plan string) error {
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
	recipient := os.Getenv("NOTIFICATION_EMAIL")
	if recipient == "" {
		recipient = "ifeanyireed@gmail.com"
	}
	fromEmail := os.Getenv("FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "noreply@antifake.ng"
	}

	fromHeader := fmt.Sprintf("From: AntiFakeNG <%s>\n", fromEmail)
	subject := fmt.Sprintf("Subject: 🚀 New Producer Registered: %s\n", producerName)
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: sans-serif; line-height: 1.6; color: #1E293B;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 16px;">
				<h2 style="color: #0F172A; margin-bottom: 20px;">New Producer Onboarding Signal</h2>
				<p>A new manufacturer has registered a tenant profile on AntiFakeNG:</p>
				<table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
					<tr style="background-color: #F8FAFC;">
						<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0;">Brand Name</td>
						<td style="padding: 10px; border: 1px solid #E2E8F0;">%s</td>
					</tr>
					<tr>
						<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0;">Contact Email</td>
						<td style="padding: 10px; border: 1px solid #E2E8F0;">%s</td>
					</tr>
					<tr style="background-color: #F8FAFC;">
						<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0;">Requested Plan</td>
						<td style="padding: 10px; border: 1px solid #E2E8F0; text-transform: uppercase; font-weight: bold; color: #0089C1;">%s</td>
					</tr>
				</table>
				<p>Please review and approve this tenant's registration inside the Administrator Dashboard.</p>
				<hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
				<p style="font-size: 11px; color: #64748B;">AntiFakeNG Automated Notification Gateway</p>
			</div>
		</body>
		</html>
	`, producerName, producerEmail, plan)

	msg := []byte(fromHeader + subject + mime + body)
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

	log.Printf("[SMTP Email] Registration notification sent successfully to %s", recipient)
	return nil
}

// SendWhatsAppPairingCode emails the administrator when WhatsApp needs reconnection/pairing
func SendWhatsAppPairingCode(phone, pairingCode string) error {
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
	recipient := "ifeanyireed@gmail.com"
	fromEmail := os.Getenv("FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "noreply@antifake.ng"
	}

	fromHeader := fmt.Sprintf("From: AntiFakeNG <%s>\n", fromEmail)
	subject := "Subject: ⚠️ ACTION REQUIRED: Link WhatsApp Gateway\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: sans-serif; line-height: 1.6; color: #1E293B;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 16px;">
				<h2 style="color: #0F172A; margin-bottom: 20px;">WhatsApp Connection Required</h2>
				<p>Your AntiFakeNG WhatsApp OTP Gateway requires linking or re-authentication.</p>
				
				<div style="background-color: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
					<span style="font-size: 11px; font-weight: bold; color: #64748B; text-transform: uppercase; tracking-wider: 0.1em; display: block; margin-bottom: 8px;">Phone Number: %s</span>
					<span style="font-size: 32px; font-family: monospace; font-weight: 900; color: #0089C1; letter-spacing: 2px;">%s</span>
				</div>

				<h3 style="color: #0F172A; margin-top: 20px;">Pairing Instructions:</h3>
				<ol style="padding-left: 20px;">
					<li>Open <b>WhatsApp</b> on your phone.</li>
					<li>Go to <b>Settings</b> -> <b>Linked Devices</b> -> <b>Link a Device</b>.</li>
					<li>Choose <b>Link with phone number instead</b>.</li>
					<li>Enter the pairing code shown above: <b>%s</b>.</li>
				</ol>
				<p>The code will expire shortly. If it expires before you pair, run the check again to generate a new code.</p>
				<hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
				<p style="font-size: 11px; color: #64748B;">AntiFakeNG Automated Notification Gateway</p>
			</div>
		</body>
		</html>
	`, phone, pairingCode, pairingCode)

	msg := []byte(fromHeader + subject + mime + body)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPortStr)
	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

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
		err := smtp.SendMail(addr, auth, smtpUser, []string{recipient}, msg)
		if err != nil {
			return fmt.Errorf("SMTP SendMail standard pipeline failed: %w", err)
		}
	}

	log.Printf("[SMTP Email] WhatsApp pairing code sent successfully to %s", recipient)
	return nil
}

// SendSupportNotification emails the administrator when a support message or counterfeit report is submitted
func SendSupportNotification(formType, name, email, phone, subject, token, storeName, message string) error {
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
	recipient := "ifeanyireed@gmail.com"
	fromEmail := os.Getenv("FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "noreply@antifake.ng"
	}

	title := "New Support Inquiry Received"
	if formType == "report" {
		title = "🚨 COUNTERFEIT PRODUCT REPORT FILED"
	}

	fromHeader := fmt.Sprintf("From: AntiFakeNG <%s>\n", fromEmail)
	subjectHeader := fmt.Sprintf("Subject: %s: %s\n", title, subject)
	if subject == "" {
		subjectHeader = fmt.Sprintf("Subject: %s\n", title)
	}
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"

	// Construct HTML details
	var detailsHTML string
	if formType == "report" {
		detailsHTML = fmt.Sprintf(`
			<p><b>Report Details:</b></p>
			<table style="width: 100%%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
				<tr style="background-color: #F8FAFC;">
					<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0; width: 30%%;">Fake Token</td>
					<td style="padding: 10px; border: 1px solid #E2E8F0; font-family: monospace; font-weight: bold; color: #DC2626;">%s</td>
				</tr>
				<tr>
					<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0;">Retailer Name</td>
					<td style="padding: 10px; border: 1px solid #E2E8F0;">%s</td>
				</tr>
				<tr style="background-color: #F8FAFC;">
					<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0;">Retailer Location</td>
					<td style="padding: 10px; border: 1px solid #E2E8F0;">%s</td>
				</tr>
				<tr>
					<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0;">Reporter Phone</td>
					<td style="padding: 10px; border: 1px solid #E2E8F0;">%s</td>
				</tr>
			</table>
		`, token, storeName, subject, phone)
	} else {
		detailsHTML = fmt.Sprintf(`
			<p><b>Contact Details:</b></p>
			<table style="width: 100%%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
				<tr style="background-color: #F8FAFC;">
					<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0; width: 30%%;">Name</td>
					<td style="padding: 10px; border: 1px solid #E2E8F0;">%s</td>
				</tr>
				<tr>
					<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0;">Email</td>
					<td style="padding: 10px; border: 1px solid #E2E8F0;">%s</td>
				</tr>
				<tr style="background-color: #F8FAFC;">
					<td style="padding: 10px; font-weight: bold; border: 1px solid #E2E8F0;">Phone</td>
					<td style="padding: 10px; border: 1px solid #E2E8F0;">%s</td>
				</tr>
			</table>
		`, name, email, phone)
	}

	body := fmt.Sprintf(`
		<html>
		<body style="font-family: sans-serif; line-height: 1.6; color: #1E293B;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 16px;">
				<h2 style="color: #0F172A; margin-bottom: 20px;">%s</h2>
				%s
				<p><b>Message Content:</b></p>
				<div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 15px; font-size: 13px; color: #334155; white-space: pre-wrap;">%s</div>
				<hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
				<p style="font-size: 11px; color: #64748B;">AntiFakeNG Automated Support System</p>
			</div>
		</body>
		</html>
	`, title, detailsHTML, message)

	msg := []byte(fromHeader + subjectHeader + mime + body)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPortStr)
	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

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
		err := smtp.SendMail(addr, auth, smtpUser, []string{recipient}, msg)
		if err != nil {
			return fmt.Errorf("SMTP SendMail standard pipeline failed: %w", err)
		}
	}

	log.Printf("[SMTP Email] Support notification sent successfully to %s", recipient)
	return nil
}
