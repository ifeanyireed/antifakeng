package main

import (
	"fmt"
	"log"
	"os"
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

	var auths []ssh.AuthMethod
	if pass != "" {
		auths = append(auths, ssh.Password(pass))
	}

	sshConfig := &ssh.ClientConfig{
		User:            user,
		Auth:            auths,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	addr := fmt.Sprintf("%s:%s", host, port)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		log.Fatalf("ssh connection failed: %v", err)
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		log.Fatalf("sftp connection failed: %v", err)
	}
	defer sftpClient.Close()

	log.Printf("Listing files in remoteDir: %s", remoteDir)
	files, err := sftpClient.ReadDir(remoteDir)
	if err != nil {
		log.Fatalf("Failed to read remote directory: %v", err)
	}

	for _, file := range files {
		log.Printf("File: %s, Size: %d, Mode: %s", file.Name(), file.Size(), file.Mode())
	}
}
