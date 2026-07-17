package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"desktop/printer"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const CurrentVersion = "2.13.0"

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

type UpdateInfo struct {
	Version    string `json:"version"`
	WindowsURL string `json:"windows_url"`
	MacURL     string `json:"mac_url"`
	Changelog  string `json:"changelog"`
	Critical   bool   `json:"critical"`
}

// CheckForUpdates fetches the latest release metadata from the remote API gateway
func (a *App) CheckForUpdates(apiUrl string) (*UpdateInfo, error) {
	if apiUrl == "" {
		apiUrl = "https://api.antifake.ng/api" // Production gateway fallback
	}
	apiUrl = strings.TrimSuffix(apiUrl, "/")
	versionEndpoint := fmt.Sprintf("%s/auth/desktop/version", apiUrl)

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(versionEndpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status: %s", resp.Status)
	}

	var info UpdateInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}

	// If a different version is returned, indicate an update is available
	if info.Version != CurrentVersion {
		return &info, nil
	}
	return nil, nil
}

// DownloadAndInstallUpdate downloads the installer binary and executes it
func (a *App) DownloadAndInstallUpdate(downloadURL string) error {
	tempDir := os.TempDir()
	ext := ".exe"
	if runtime.GOOS == "darwin" {
		ext = ".dmg"
	}
	tempFile := filepath.Join(tempDir, "antifake-updater"+ext)

	out, err := os.Create(tempFile)
	if err != nil {
		return fmt.Errorf("failed to create local temp file: %w", err)
	}
	defer out.Close()

	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("failed to download from URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download server returned status: %s", resp.Status)
	}

	// Write package file and emit download progress events to the frontend WebView
	buf := make([]byte, 8192)
	total := resp.ContentLength
	var written int64

	for {
		nr, er := resp.Body.Read(buf)
		if nr > 0 {
			nw, ew := out.Write(buf[0:nr])
			if nw > 0 {
				written += int64(nw)
				if total > 0 {
					percent := int((float64(written) / float64(total)) * 100)
					wailsRuntime.EventsEmit(a.ctx, "download-progress", percent)
				}
			}
			if ew != nil {
				return fmt.Errorf("failed to write to file: %w", ew)
			}
		}
		if er == io.EOF {
			break
		}
		if er != nil {
			return fmt.Errorf("read error during download: %w", er)
		}
	}

	out.Close()

	// Launch installer process and terminate current app
	if runtime.GOOS == "windows" {
		// Run installer silently using the NSIS /S flag (if NSIS package)
		cmd := exec.Command(tempFile, "/S")
		if err := cmd.Start(); err != nil {
			// Fallback to normal execution if silent installer fails
			exec.Command("cmd", "/c", "start", tempFile).Start()
		}
	} else if runtime.GOOS == "darwin" {
		// Open DMG disk image mount on Mac
		exec.Command("open", tempFile).Start()
	}

	os.Exit(0)
	return nil
}

// SelectSavePath opens a native Windows save file dialog and returns the selected path
func (a *App) SelectSavePath(filename string, format string) (string, error) {
	var filter wailsRuntime.FileFilter
	formatClean := strings.ToLower(format)
	if formatClean == "png" {
		filter = wailsRuntime.FileFilter{DisplayName: "PNG Image (*.png)", Pattern: "*.png"}
	} else if formatClean == "tiff" {
		filter = wailsRuntime.FileFilter{DisplayName: "TIFF Image (*.tiff)", Pattern: "*.tiff"}
	} else {
		filter = wailsRuntime.FileFilter{DisplayName: "PDF Document (*.pdf)", Pattern: "*.pdf"}
	}

	return wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		Title:           "Save Print Layout Sheet",
		DefaultFilename: filename + "." + formatClean,
		Filters:         []wailsRuntime.FileFilter{filter},
	})
}

// GeneratePrintSheetLocal renders the print layout using local desktop memory and saves to the specified path
func (a *App) GeneratePrintSheetLocal(config printer.PrintConfig, tokens []string, savePath string) error {
	if savePath == "" {
		return fmt.Errorf("no save path specified")
	}

	file, err := os.Create(savePath)
	if err != nil {
		return fmt.Errorf("failed to create target file: %w", err)
	}
	defer file.Close()

	err = printer.GenerateVectorPDF(file, config, tokens)
	if err != nil {
		return fmt.Errorf("failed to generate print sheet: %w", err)
	}

	return nil
}
