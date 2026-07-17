package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"desktop/printer"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

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

// SelectSavePath opens a native Windows save file dialog and returns the selected path
func (a *App) SelectSavePath(filename string, format string) (string, error) {
	var filter runtime.FileFilter
	formatClean := strings.ToLower(format)
	if formatClean == "png" {
		filter = runtime.FileFilter{DisplayName: "PNG Image (*.png)", Pattern: "*.png"}
	} else if formatClean == "tiff" {
		filter = runtime.FileFilter{DisplayName: "TIFF Image (*.tiff)", Pattern: "*.tiff"}
	} else {
		filter = runtime.FileFilter{DisplayName: "PDF Document (*.pdf)", Pattern: "*.pdf"}
	}

	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Print Layout Sheet",
		DefaultFilename: filename + "." + formatClean,
		Filters:         []runtime.FileFilter{filter},
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
