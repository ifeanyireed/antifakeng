package storage

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

// UploadImage handles uploading a file via Hostinger SFTP or local fallback
func UploadImage(file multipart.File, header *multipart.FileHeader) (string, error) {
	// Clean filename and add timestamp prefix
	filename := fmt.Sprintf("%d-%s", time.Now().Unix(), filepath.Base(header.Filename))

	host := os.Getenv("SFTP_HOST")
	port := os.Getenv("SFTP_PORT")
	user := os.Getenv("SFTP_USER")
	remoteDir := os.Getenv("SFTP_REMOTE_DIR")
	baseURL := os.Getenv("SFTP_BASE_URL")

	// If SFTP configurations are missing, fallback to local uploads directory
	if host == "" || user == "" {
		localDir := "./uploads"
		if err := os.MkdirAll(localDir, 0755); err != nil {
			return "", fmt.Errorf("failed to create local uploads directory: %w", err)
		}
		
		outPath := filepath.Join(localDir, filename)
		outFile, err := os.Create(outPath)
		if err != nil {
			return "", fmt.Errorf("failed to create local file: %w", err)
		}
		defer outFile.Close()

		if _, err := io.Copy(outFile, file); err != nil {
			return "", fmt.Errorf("failed to save local file: %w", err)
		}

		// Return local URL
		return fmt.Sprintf("http://localhost:8080/uploads/%s", filename), nil
	}

	if port == "" {
		port = "65002" // default Hostinger SSH port
	}

	// Setup SSH authentication methods (try SSH private key, fallback to password)
	var auths []ssh.AuthMethod

	keyPath := os.Getenv("SFTP_KEY_PATH")
	if keyPath != "" {
		keyBytes, err := os.ReadFile(keyPath)
		if err == nil {
			var signer ssh.Signer
			passphrase := os.Getenv("SFTP_KEY_PASSPHRASE")
			var parseErr error
			if passphrase != "" {
				signer, parseErr = ssh.ParsePrivateKeyWithPassphrase(keyBytes, []byte(passphrase))
			} else {
				signer, parseErr = ssh.ParsePrivateKey(keyBytes)
			}
			if parseErr == nil {
				auths = append(auths, ssh.PublicKeys(signer))
			}
		}
	}

	sftpPass := os.Getenv("SFTP_PASS")
	if sftpPass != "" {
		auths = append(auths, ssh.Password(sftpPass))
	}

	if len(auths) == 0 {
		return "", fmt.Errorf("no SSH authentication method found: private key missing and SFTP_PASS not set")
	}

	// SSH Config using Key and/or Password Authentication
	sshConfig := &ssh.ClientConfig{
		User:            user,
		Auth:            auths,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	// Connect to SSH Server
	addr := fmt.Sprintf("%s:%s", host, port)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return "", fmt.Errorf("ssh connection failed to %s: %w", addr, err)
	}
	defer client.Close()

	// Connect to SFTP Subsystem
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		return "", fmt.Errorf("sftp connection failed: %w", err)
	}
	defer sftpClient.Close()

	// Ensure remote upload path exists
	_ = sftpClient.MkdirAll(remoteDir)
	_ = sftpClient.Chmod(remoteDir, 0755) // Ensure directory is traversable

	// Create remote file
	remotePath := remoteDir + "/" + filename
	dstFile, err := sftpClient.Create(remotePath)
	if err != nil {
		return "", fmt.Errorf("failed to create remote file %s: %w", remotePath, err)
	}
	defer dstFile.Close()

	// Write file content via SFTP stream
	if _, err := io.Copy(dstFile, file); err != nil {
		return "", fmt.Errorf("failed to upload file contents: %w", err)
	}

	// Change file permissions to public read so the web server can serve it
	_ = sftpClient.Chmod(remotePath, 0644)

	if baseURL == "" {
		baseURL = "https://antifake.ng/uploads"
	}
	return fmt.Sprintf("%s/%s", baseURL, filename), nil
}
