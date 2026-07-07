package storage

import (
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

// CleanOldUploads deletes local and remote uploads older than 90 days
func CleanOldUploads() error {
	const maxAge = 90 * 24 * time.Hour
	cutoff := time.Now().Add(-maxAge)

	log.Printf("[Cleanup] Starting cleanup of uploads older than 90 days (Cutoff: %s)", cutoff.Format("2006-01-02 15:04:05"))

	// 1. Clean up local uploads
	localDir := "./uploads"
	if localDirExists(localDir) {
		err := filepath.WalkDir(localDir, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() {
				return nil
			}
			info, err := d.Info()
			if err != nil {
				return err
			}
			if info.ModTime().Before(cutoff) {
				log.Printf("[Cleanup] Deleting local file: %s (ModTime: %s)", path, info.ModTime())
				if err := os.Remove(path); err != nil {
					log.Printf("[Cleanup] Failed to delete local file %s: %v", path, err)
				}
			}
			return nil
		})
		if err != nil {
			log.Printf("[Cleanup] Error walking local uploads: %v", err)
		}
	}

	// 2. Clean up remote SFTP uploads if configured
	host := os.Getenv("SFTP_HOST")
	user := os.Getenv("SFTP_USER")
	remoteDir := os.Getenv("SFTP_REMOTE_DIR")
	if host != "" && user != "" && remoteDir != "" {
		port := os.Getenv("SFTP_PORT")
		if port == "" {
			port = "65002"
		}

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

		if len(auths) > 0 {
			sshConfig := &ssh.ClientConfig{
				User:            user,
				Auth:            auths,
				HostKeyCallback: ssh.InsecureIgnoreHostKey(),
				Timeout:         15 * time.Second,
			}

			addr := fmt.Sprintf("%s:%s", host, port)
			client, err := ssh.Dial("tcp", addr, sshConfig)
			if err != nil {
				return fmt.Errorf("cleanup ssh connection failed: %w", err)
			}
			defer client.Close()

			sftpClient, err := sftp.NewClient(client)
			if err != nil {
				return fmt.Errorf("cleanup sftp client creation failed: %w", err)
			}
			defer sftpClient.Close()

			// List files in the remote directory
			files, err := sftpClient.ReadDir(remoteDir)
			if err != nil {
				// If directory doesn't exist, we don't need to clean it up
				if os.IsNotExist(err) || strings.Contains(err.Error(), "does not exist") {
					log.Printf("[Cleanup] Remote uploads directory does not exist yet. Skipping remote cleanup.")
				} else {
					return fmt.Errorf("failed to read remote uploads directory: %w", err)
				}
			} else {
				for _, file := range files {
					if file.IsDir() {
						continue
					}
					if file.ModTime().Before(cutoff) {
						remotePath := remoteDir + "/" + file.Name()
						log.Printf("[Cleanup] Deleting remote file: %s (ModTime: %s)", remotePath, file.ModTime())
						if err := sftpClient.Remove(remotePath); err != nil {
							log.Printf("[Cleanup] Failed to delete remote file %s: %v", remotePath, err)
						}
					}
				}
			}
		}
	}

	log.Println("[Cleanup] Cleanup process complete.")
	return nil
}

// StartCleanupScheduler runs the cleanup process periodically in a background goroutine
func StartCleanupScheduler(interval time.Duration) {
	go func() {
		// Run once on startup
		if err := CleanOldUploads(); err != nil {
			log.Printf("[Cleanup] Startup cleanup failed: %v", err)
		}
		
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for range ticker.C {
			if err := CleanOldUploads(); err != nil {
				log.Printf("[Cleanup] Scheduled cleanup failed: %v", err)
			}
		}
	}()
}

// Helper to check if file/directory exists
func localDirExists(filename string) bool {
	_, err := os.Stat(filename)
	return !os.IsNotExist(err)
}
