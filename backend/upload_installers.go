package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

func loadDotEnv() {
	data, err := os.ReadFile(".env")
	if err != nil {
		log.Printf("Warning: failed to read .env file: %v", err)
		return
	}
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)
			os.Setenv(key, val)
		}
	}
}

func main() {
	loadDotEnv()

	host := os.Getenv("SFTP_HOST")
	port := os.Getenv("SFTP_PORT")
	user := os.Getenv("SFTP_USER")
	remoteDir := os.Getenv("SFTP_REMOTE_DIR")
	pass := os.Getenv("SFTP_PASS")

	if host == "" || user == "" || pass == "" {
		log.Fatalf("Missing SFTP credentials in .env")
	}

	var auths []ssh.AuthMethod
	auths = append(auths, ssh.Password(pass))

	sshConfig := &ssh.ClientConfig{
		User:            user,
		Auth:            auths,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         30 * time.Second,
	}

	addr := fmt.Sprintf("%s:%s", host, port)
	log.Printf("Connecting to SSH server at %s...", addr)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		log.Fatalf("ssh connection failed: %v", err)
	}
	defer client.Close()

	log.Println("Initializing SFTP client...")
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		log.Fatalf("sftp connection failed: %v", err)
	}
	defer sftpClient.Close()

	desktopRemoteDir := filepath.Join(remoteDir, "desktop")
	log.Printf("Ensuring remote directory %s exists...", desktopRemoteDir)
	err = sftpClient.MkdirAll(desktopRemoteDir)
	if err != nil {
		log.Fatalf("failed to create remote directory: %v", err)
	}

	// Files to upload
	filesToUpload := []struct {
		localPath  string
		remoteName string
	}{
		{
			localPath:  "../desktop/build/bin/antifake-desktop-setup.exe",
			remoteName: "antifake-desktop-setup.exe",
		},
		{
			localPath:  "../desktop/build/bin/antifake-desktop.dmg",
			remoteName: "antifake-desktop.dmg",
		},
	}

	for _, fileInfo := range filesToUpload {
		log.Printf("Uploading %s to remote %s...", fileInfo.localPath, fileInfo.remoteName)
		
		localFile, err := os.Open(fileInfo.localPath)
		if err != nil {
			log.Fatalf("failed to open local file %s: %v", fileInfo.localPath, err)
		}
		defer localFile.Close()

		remotePath := filepath.Join(desktopRemoteDir, fileInfo.remoteName)
		remoteFile, err := sftpClient.Create(remotePath)
		if err != nil {
			log.Fatalf("failed to create remote file %s: %v", remotePath, err)
		}
		defer remoteFile.Close()

		bytesCopied, err := io.Copy(remoteFile, localFile)
		if err != nil {
			log.Fatalf("failed to write remote file %s: %v", remotePath, err)
		}

		err = sftpClient.Chmod(remotePath, 0644)
		if err != nil {
			log.Printf("Warning: failed to chmod remote file: %v", err)
		}

		log.Printf("Successfully uploaded %s (%d bytes)", fileInfo.remoteName, bytesCopied)
	}

	log.Println("All uploads completed successfully!")
}
