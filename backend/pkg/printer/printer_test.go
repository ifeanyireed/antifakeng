package printer

import (
	"bytes"
	"image"
	_ "image/png"
	"testing"
	_ "golang.org/x/image/tiff"
)

func TestGenerateImageSheets(t *testing.T) {
	tokens := []string{
		"MOCK-TOKEN-1",
		"MOCK-TOKEN-2",
		"MOCK-TOKEN-3",
	}

	config := PrintConfig{
		BatchCode:   "B-MOCK",
		Message:     "Scan QR code to verify product.",
		WidthOption: "4ft",
		Columns:     3,
		QRPosition:  "bottom-right",
	}

	// 1. Test PNG format
	config.Format = "png"
	var pngBuf bytes.Buffer
	err := GenerateVectorPDF(&pngBuf, config, tokens)
	if err != nil {
		t.Fatalf("Failed to generate PNG print sheet: %v", err)
	}

	if pngBuf.Len() == 0 {
		t.Fatal("Generated PNG buffer is empty")
	}

	// Verify it's a valid PNG image
	_, _, err = image.DecodeConfig(&pngBuf)
	if err != nil {
		t.Fatalf("Generated PNG buffer is not a valid image: %v", err)
	}

	// 2. Test TIFF format
	config.Format = "tiff"
	var tiffBuf bytes.Buffer
	err = GenerateVectorPDF(&tiffBuf, config, tokens)
	if err != nil {
		t.Fatalf("Failed to generate TIFF print sheet: %v", err)
	}

	if tiffBuf.Len() == 0 {
		t.Fatal("Generated TIFF buffer is empty")
	}

	// Verify it's a valid TIFF image
	_, _, err = image.DecodeConfig(&tiffBuf)
	if err != nil {
		t.Fatalf("Generated TIFF buffer is not a valid image: %v", err)
	}
}
