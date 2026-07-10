package main

import (
	"fmt"
	"os"
	"github.com/ahnara/antifake/backend/pkg/printer"
)

func main() {
	tokens := []string{"TEST12345678", "TEST87654321"}
	
	// Test PDF
	pdfFile, err := os.Create("test_print_pdf.pdf")
	if err != nil {
		fmt.Printf("Error creating test_print_pdf.pdf: %v\n", err)
		return
	}
	defer pdfFile.Close()

	configPdf := printer.PrintConfig{
		BatchCode:     "BATCH123",
		Message:       "Scan to verify product authenticity.",
		WidthOption:   "4ft",
		Format:        "pdf",
		Columns:       12,
		LabelImage:    "",
		LabelRotation: 0,
		QRPosition:    "bottom-right",
		ProductImage:  "",
	}

	err = printer.GenerateVectorPDF(pdfFile, configPdf, tokens)
	if err != nil {
		fmt.Printf("GenerateVectorPDF (pdf) failed: %v\n", err)
	} else {
		fmt.Println("GenerateVectorPDF (pdf) succeeded")
	}

	// Test PNG
	pngFile, err := os.Create("test_print_png.png")
	if err != nil {
		fmt.Printf("Error creating test_print_png.png: %v\n", err)
		return
	}
	defer pngFile.Close()

	configPng := configPdf
	configPng.Format = "png"

	err = printer.GenerateVectorPDF(pngFile, configPng, tokens)
	if err != nil {
		fmt.Printf("GenerateVectorPDF (png) failed: %v\n", err)
	} else {
		fmt.Println("GenerateVectorPDF (png) succeeded")
	}

	// Test TIFF
	tiffFile, err := os.Create("test_print_tiff.tiff")
	if err != nil {
		fmt.Printf("Error creating test_print_tiff.tiff: %v\n", err)
		return
	}
	defer tiffFile.Close()

	configTiff := configPdf
	configTiff.Format = "tiff"

	err = printer.GenerateVectorPDF(tiffFile, configTiff, tokens)
	if err != nil {
		fmt.Printf("GenerateVectorPDF (tiff) failed: %v\n", err)
	} else {
		fmt.Println("GenerateVectorPDF (tiff) succeeded")
	}
}
