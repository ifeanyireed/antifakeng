package printer

import (
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/boombuler/barcode/qr"
	"github.com/jung-kurt/gofpdf"
)

func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

// GetImagePhysicalWidth parses PNG/JPEG metadata to extract the horizontal density/DPI
// and calculates the physical width in millimeters. Returns 0 if metadata is missing or on error.
func GetImagePhysicalWidth(filePath string, pixelWidth int) float64 {
	file, err := os.Open(filePath)
	if err != nil {
		return 0
	}
	defer file.Close()

	header := make([]byte, 8)
	if _, err := io.ReadFull(file, header); err != nil {
		return 0
	}

	// Check PNG signature: \x89PNG\r\n\x1a\n
	if header[0] == 0x89 && header[1] == 'P' && header[2] == 'N' && header[3] == 'G' {
		for {
			lengthBuf := make([]byte, 4)
			if _, err := io.ReadFull(file, lengthBuf); err != nil {
				break
			}
			length := int(uint32(lengthBuf[0])<<24 | uint32(lengthBuf[1])<<16 | uint32(lengthBuf[2])<<8 | uint32(lengthBuf[3]))

			typeBuf := make([]byte, 4)
			if _, err := io.ReadFull(file, typeBuf); err != nil {
				break
			}
			chunkType := string(typeBuf)

			if chunkType == "pHYs" && length == 9 {
				data := make([]byte, 9)
				if _, err := io.ReadFull(file, data); err != nil {
					break
				}
				pxPerMeterX := uint32(data[0])<<24 | uint32(data[1])<<16 | uint32(data[2])<<8 | uint32(data[3])
				unit := data[8]
				if unit == 1 && pxPerMeterX > 0 { // unit 1 means meter
					return (float64(pixelWidth) / float64(pxPerMeterX)) * 1000.0
				}
				break
			} else if chunkType == "IDAT" || chunkType == "IEND" {
				// pHYs must appear before IDAT
				break
			} else {
				// skip data + 4 bytes CRC
				if _, err := file.Seek(int64(length+4), io.SeekCurrent); err != nil {
					break
				}
			}
		}
	} else if header[0] == 0xFF && header[1] == 0xD8 {
		// Seek to after SOI (offset 2)
		if _, err := file.Seek(2, io.SeekStart); err != nil {
			return 0
		}

		for {
			markerBuf := make([]byte, 2)
			if _, err := io.ReadFull(file, markerBuf); err != nil {
				break
			}
			if markerBuf[0] != 0xFF {
				break
			}
			marker := markerBuf[1]

			if marker == 0xD8 || marker == 0xD9 || marker == 0x01 {
				continue
			}

			lengthBuf := make([]byte, 2)
			if _, err := io.ReadFull(file, lengthBuf); err != nil {
				break
			}
			length := int(uint16(lengthBuf[0])<<8 | uint16(lengthBuf[1]))

			if marker == 0xE0 && length >= 16 { // APP0 JFIF
				data := make([]byte, length-2)
				if _, err := io.ReadFull(file, data); err != nil {
					break
				}
				if len(data) >= 10 && string(data[0:5]) == "JFIF\x00" {
					units := data[7] // 1 = dots per inch, 2 = dots per cm
					xDensity := uint16(data[8])<<8 | uint16(data[9])
					if xDensity > 0 {
						if units == 1 { // DPI
							return (float64(pixelWidth) / float64(xDensity)) * 25.4
						} else if units == 2 { // dots/cm
							return (float64(pixelWidth) / float64(xDensity)) * 10.0
						}
					}
				}
				break
			} else {
				// skip segment data (length includes length field, so skip length - 2)
				if _, err := file.Seek(int64(length-2), io.SeekCurrent); err != nil {
					break
				}
			}
		}
	}

	return 0
}

// ParseQrPositionAndScales parses "x;y;qrScale" or legacy "pos;qrScale" into coordinates and qrScale
func ParseQrPositionAndScales(raw string) (float64, float64, float64) {
	parts := strings.Split(raw, ";")
	xPercent := 80.0
	yPercent := 80.0
	qrScale := 100.0

	if len(parts) == 0 || parts[0] == "" {
		return xPercent, yPercent, qrScale
	}

	// Try to parse the first part as a float (modern X-axis coordinate)
	firstVal, err := strconv.ParseFloat(parts[0], 64)
	if err == nil {
		xPercent = firstVal
		if len(parts) > 1 {
			if val, err := strconv.ParseFloat(parts[1], 64); err == nil {
				yPercent = val
			}
		}
		if len(parts) > 2 {
			if val, err := strconv.ParseFloat(parts[2], 64); err == nil {
				qrScale = val
			}
		}
	} else {
		// Legacy format: pos;qrScale;lblScale
		pos := parts[0]
		if len(parts) > 1 {
			if val, err := strconv.ParseFloat(parts[1], 64); err == nil {
				qrScale = val
			}
		}
		// Map legacy named positions to percentages
		if pos == "top-left" {
			xPercent = 5.0
			yPercent = 5.0
		} else if pos == "top-right" {
			xPercent = 75.0
			yPercent = 5.0
		} else if pos == "bottom-left" {
			xPercent = 5.0
			yPercent = 75.0
		} else {
			xPercent = 75.0
			yPercent = 75.0
		}
	}

	return xPercent, yPercent, qrScale
}

func resolveImagePath(path string) string {
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	
	cleanPath := strings.TrimPrefix(path, "/")
	searchPaths := []string{
		cleanPath,
		"../" + cleanPath,
		"backend/" + cleanPath,
		"../backend/" + cleanPath,
		"web-app/public/" + cleanPath,
		"../web-app/public/" + cleanPath,
	}
	for _, sp := range searchPaths {
		if fileExists(sp) {
			return sp
		}
	}
	return path
}

// PrintConfig holds parameters for the PDF layout sheet
type PrintConfig struct {
	BatchCode     string
	ProductName   string
	Message       string
	WidthOption   string // 4ft, 6ft, 10ft, or custom
	WidthVal      float64 // in mm
	Format        string // pdf, png_zip, csv
	Columns       int
	LabelImage    string
	LabelRotation int
	QRPosition    string
	ProductImage  string
}

// ParseWidth parses a width option string (e.g. "4ft", "120cm", "48inch") into millimeters
func ParseWidth(widthStr string) float64 {
	widthStr = strings.ToLower(strings.TrimSpace(widthStr))
	if widthStr == "4ft" {
		return 1219.2 // 48 inches
	} else if widthStr == "6ft" {
		return 1828.8 // 72 inches
	} else if widthStr == "10ft" {
		return 3048.0 // 120 inches
	}

	// Parse custom e.g., "120cm", "48inch", "4ft"
	// Find numerical part
	numPart := ""
	unitPart := ""
	for _, char := range widthStr {
		if (char >= '0' && char <= '9') || char == '.' {
			numPart += string(char)
		} else {
			unitPart += string(char)
		}
	}

	val, err := strconv.ParseFloat(numPart, 64)
	if err != nil {
		return 1219.2 // Default to 4ft on parse error
	}

	unitPart = strings.TrimSpace(unitPart)
	switch unitPart {
	case "cm", "centimeters":
		return val * 10.0
	case "inch", "inches", "in":
		return val * 25.4
	case "ft", "feet", "foot":
		return val * 304.8
	case "mm", "millimeters":
		return val
	default:
		return val // Default raw value
	}
}

// GenerateVectorPDF generates a custom-width roll PDF containing vector QR codes and serial metadata labels
func GenerateVectorPDF(w io.Writer, config PrintConfig, tokens []string) error {
	outputFormat := strings.ToLower(config.Format)
	var pdfWriter io.Writer = w
	var tempPdfFile *os.File
	var err error

	if outputFormat == "png" || outputFormat == "tiff" {
		tempPdfFile, err = os.CreateTemp("", "print-*.pdf")
		if err != nil {
			return fmt.Errorf("failed to create temp pdf file: %v", err)
		}
		defer os.Remove(tempPdfFile.Name())
		defer tempPdfFile.Close()
		pdfWriter = tempPdfFile
	}

	xPercent, yPercent, qrScale := ParseQrPositionAndScales(config.QRPosition)
	labelScale := 100.0

	labelPath := resolveImagePath(config.LabelImage)
	localImage := labelPath
	isTempFile := false
	if labelPath != "" && (strings.HasPrefix(labelPath, "http://") || strings.HasPrefix(labelPath, "https://")) {
		resp, err := http.Get(labelPath)
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			tempFile, err := os.CreateTemp("", "label-*.png")
			if err == nil {
				_, err = io.Copy(tempFile, resp.Body)
				tempFile.Close()
				if err == nil {
					localImage = tempFile.Name()
					isTempFile = true
				}
			}
		}
	}
	if isTempFile {
		defer os.Remove(localImage)
	}

	prodImagePath := resolveImagePath(config.ProductImage)
	localProductImage := prodImagePath
	isProductTempFile := false
	if prodImagePath != "" && (strings.HasPrefix(prodImagePath, "http://") || strings.HasPrefix(prodImagePath, "https://")) {
		resp, err := http.Get(prodImagePath)
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			tempFile, err := os.CreateTemp("", "product-*.png")
			if err == nil {
				_, err = io.Copy(tempFile, resp.Body)
				tempFile.Close()
				if err == nil {
					localProductImage = tempFile.Name()
					isProductTempFile = true
				}
			}
		}
	}
	if isProductTempFile {
		defer os.Remove(localProductImage)
	}

	rollWidth := config.WidthVal
	if rollWidth <= 0 {
		rollWidth = ParseWidth(config.WidthOption)
	}

	columns := config.Columns
	if columns <= 0 {
		columns = 12
	}

	// Calculate label sizing and spacing dynamically based on columns and roll width
	padding := 5.0
	aspectRatio := 2.0 // default 2:1

	if localImage != "" && fileExists(localImage) {
		if file, err := os.Open(localImage); err == nil {
			if imgConfig, _, err := image.DecodeConfig(file); err == nil {
				if imgConfig.Width > 0 && imgConfig.Height > 0 {
					aspectRatio = float64(imgConfig.Width) / float64(imgConfig.Height)
				}
			}
			file.Close()
		}
	}

	// Dynamic labelWidth computed to fit rollWidth exactly based on user selected columns
	labelWidth := (rollWidth - padding*float64(columns+1)) / float64(columns)
	if labelWidth < 10.0 {
		labelWidth = 10.0
	}
	labelHeight := labelWidth / aspectRatio

	// Row calculations
	totalCodes := len(tokens)
	rows := int(math.Ceil(float64(totalCodes) / float64(columns)))
	
	// Limit maximum single page height to 4000mm to prevent PDF engine/viewer crashes.
	// Split into multiple pages if it exceeds this threshold.
	rowHeightWithPadding := labelHeight + padding
	maxPageHeight := 4000.0
	rowsPerPage := int(math.Floor((maxPageHeight - padding) / rowHeightWithPadding))
	if rowsPerPage <= 0 {
		rowsPerPage = 1
	}

	// Create PDF engine (Custom page size: width, height in mm)
	currentPageHeight := float64(rows) * rowHeightWithPadding + padding
	if currentPageHeight > maxPageHeight {
		currentPageHeight = float64(rowsPerPage)*rowHeightWithPadding + padding
	}

	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		OrientationStr: "P",
		UnitStr:        "mm",
		Size:           gofpdf.SizeType{Wd: rollWidth, Ht: currentPageHeight},
	})
	pdf.SetMargins(padding, padding, padding)
	pdf.SetAutoPageBreak(false, 0)

	// Look for IBM Plex Sans fonts to maintain the same body font as on the site
	fontFamily := "Helvetica"
	fontRegularPaths := []string{
		"assets/fonts/IBMPlexSans-Regular.ttf",
		"../assets/fonts/IBMPlexSans-Regular.ttf",
		"backend/assets/fonts/IBMPlexSans-Regular.ttf",
		"../backend/assets/fonts/IBMPlexSans-Regular.ttf",
	}
	fontBoldPaths := []string{
		"assets/fonts/IBMPlexSans-Bold.ttf",
		"../assets/fonts/IBMPlexSans-Bold.ttf",
		"backend/assets/fonts/IBMPlexSans-Bold.ttf",
		"../backend/assets/fonts/IBMPlexSans-Bold.ttf",
	}

	var foundRegularFont string
	for _, fp := range fontRegularPaths {
		if fileExists(fp) {
			foundRegularFont = fp
			break
		}
	}

	var foundBoldFont string
	for _, fp := range fontBoldPaths {
		if fileExists(fp) {
			foundBoldFont = fp
			break
		}
	}

	if foundRegularFont != "" && foundBoldFont != "" {
		pdf.AddUTF8Font("IBMPlexSans", "", foundRegularFont)
		pdf.AddUTF8Font("IBMPlexSans", "B", foundBoldFont)
		fontFamily = "IBMPlexSans"
	}

	// Look for site logo to embed
	logoPaths := []string{
		"logo.png",
		"../logo.png",
		"backend/logo.png",
		"../backend/logo.png",
		"web-app/public/logo.png",
		"../web-app/public/logo.png",
	}
	var foundLogo string
	for _, lp := range logoPaths {
		if fileExists(lp) {
			foundLogo = lp
			break
		}
	}

	pdf.AddPage()

	currentRowInPage := 0
	
	for i, token := range tokens {
		colIndex := i % columns
		rowIndex := i / columns

		// If we exceed rows per page, add a new page
		if rowIndex > 0 && colIndex == 0 && rowIndex%rowsPerPage == 0 {
			// Calculate remaining height for next page
			remainingRows := rows - rowIndex
			nextPageHeight := float64(remainingRows)*rowHeightWithPadding + padding
			if nextPageHeight > maxPageHeight {
				nextPageHeight = float64(rowsPerPage)*rowHeightWithPadding + padding
			}
			
			// Add page with dynamic height
			pdf.AddPageFormat("P", gofpdf.SizeType{Wd: rollWidth, Ht: nextPageHeight})
			currentRowInPage = 0
		}

		// Calculate precise X and Y coordinates
		x := padding + float64(colIndex)*(labelWidth+padding)
		y := padding + float64(currentRowInPage)*(labelHeight+padding)

		// Draw Label Border (vector path)
		pdf.SetLineWidth(0.2)
		pdf.SetDrawColor(180, 180, 180)
		pdf.Rect(x, y, labelWidth, labelHeight, "D")

		// Draw background label image if provided
		if localImage != "" && fileExists(localImage) {
			pdf.TransformBegin()
			if config.LabelRotation != 0 {
				centerX := x + labelWidth/2.0
				centerY := y + labelHeight/2.0
				pdf.TransformRotate(float64(config.LabelRotation), centerX, centerY)
			}
			
			// Calculate zoom/scale for the background label graphic
			drawWidth := labelWidth * (labelScale / 100.0)
			drawHeight := labelHeight * (labelScale / 100.0)
			offsetX := (drawWidth - labelWidth) / 2.0
			offsetY := (drawHeight - labelHeight) / 2.0

			pdf.Image(localImage, x - offsetX, y - offsetY, drawWidth, drawHeight, false, "", 0, "")
			pdf.TransformEnd()
		}

		// Calculate overlay container bounds
		var overlayX, overlayY, overlayW, overlayH float64
		isCustom := config.LabelImage != ""
		paddingScale := 1.0

		// Find the base width that was used at design time
		baseWidth := 80.0
		if isCustom {
			if localImage != "" && fileExists(localImage) {
				if file, err := os.Open(localImage); err == nil {
					if imgConfig, _, err := image.DecodeConfig(file); err == nil {
						if imgConfig.Width > 0 {
							if physWidth := GetImagePhysicalWidth(localImage, imgConfig.Width); physWidth > 0 {
								baseWidth = physWidth
							}
						}
					}
					file.Close()
				}
			}
			scaleFactor := labelWidth / baseWidth
			paddingScale = (qrScale / 100.0) * scaleFactor
			overlayW = 72.0 * paddingScale
			overlayH = 34.0 * paddingScale
			overlayX = x + (xPercent/100.0)*(labelWidth-overlayW)
			overlayY = y + (yPercent/100.0)*(labelHeight-overlayH)

			// Draw white background card for the overlay original QR label
			pdf.SetFillColor(255, 255, 255)
			pdf.SetDrawColor(220, 220, 220)
			pdf.SetLineWidth(0.1)
			pdf.Rect(overlayX, overlayY, overlayW, overlayH, "FD")
		} else {
			scaleFactor := labelWidth / 80.0
			paddingScale = scaleFactor
			overlayX = x
			overlayY = y
			overlayW = labelWidth
			overlayH = labelHeight
		}

		// 1. Generate QR Code Matrix for the token
		verificationURL := fmt.Sprintf("https://antifake.ng/verify?token=%s", token)
		qrCode, err := qr.Encode(verificationURL, qr.M, qr.Auto)
		if err == nil {
			qrSize := overlayH * 0.85
			qrX := overlayX + (overlayH-qrSize)/2.0
			qrY := overlayY + (overlayH-qrSize)/2.0

			// Render QR code modules as raw vector rectangles
			pdf.SetFillColor(0, 0, 0)
			bounds := qrCode.Bounds()
			numModules := bounds.Max.X - bounds.Min.X
			moduleSize := qrSize / float64(numModules)

			for mx := 0; mx < numModules; mx++ {
				for my := 0; my < numModules; my++ {
					r, _, _, _ := qrCode.At(mx, my).RGBA()
					if r == 0 { // Black module
						pdf.Rect(
							qrX+float64(mx)*moduleSize,
							qrY+float64(my)*moduleSize,
							moduleSize+0.05, // tiny overlap to prevent hairline rendering gaps
							moduleSize+0.05,
							"F",
						)
					}
				}
			}
		}

		// 2. Draw Metadata & Serial details on the right side of the label
		textX := overlayX + overlayH + 2.0*paddingScale
		textWidth := overlayW - overlayH - 4.0*paddingScale

		// Label title / Serial ID
		pdf.SetFont(fontFamily, "B", 6.0*paddingScale)
		pdf.SetTextColor(120, 120, 120)
		pdf.Text(textX, overlayY+6.0*paddingScale, fmt.Sprintf("SERIAL: %s", token))

		// Instruction message (wrapped text)
		pdf.SetFont(fontFamily, "", 4.5*paddingScale)
		pdf.SetTextColor(60, 60, 60)
		pdf.SetXY(textX, overlayY+8.5*paddingScale)
		pdf.MultiCell(textWidth, 2.2*paddingScale, config.Message, "", "", false)

		// 3. Draw Site Logo and Name ("AntiFakeNG") in the empty space
		logoY := overlayY + 20.0*paddingScale
		logoX := textX + 2.0*paddingScale
		logoSize := 8.0 * paddingScale

		if foundLogo != "" {
			centerY := logoY + (logoSize / 2.0)
			pdf.Image(foundLogo, logoX, logoY, logoSize, logoSize, false, "PNG", 0, "")

			// Draw Site Name "AntiFakeNG" next to the logo
			pdf.SetFont(fontFamily, "B", 9.0*paddingScale)
			pdf.SetTextColor(18, 33, 59) // #12213B (Navy)
			pdf.Text(logoX+logoSize+2.0*paddingScale, centerY+1.5*paddingScale, "AntiFakeNG")
		} else {
			// Fallback: Draw green circular seal vector if logo file not found
			logoRadius := 4.0 * paddingScale
			centerYVector := logoY + logoRadius
			pdf.SetFillColor(47, 228, 141) // #2FE48D
			pdf.Circle(logoX+logoRadius, centerYVector, logoRadius, "F")

			// Draw white checkmark inside the seal
			pdf.SetLineWidth(0.6 * paddingScale)
			pdf.SetDrawColor(255, 255, 255)
			pdf.Line(logoX+logoRadius-1.6*paddingScale, centerYVector, logoX+logoRadius-0.4*paddingScale, centerYVector+1.2*paddingScale)
			pdf.Line(logoX+logoRadius-0.4*paddingScale, centerYVector+1.2*paddingScale, logoX+logoRadius+1.8*paddingScale, centerYVector-1.2*paddingScale)

			// Draw Site Name "AntiFakeNG" next to the seal
			pdf.SetFont(fontFamily, "B", 9.0*paddingScale)
			pdf.SetTextColor(18, 33, 59) // #12213B
			pdf.Text(logoX+logoRadius*2.0+2.0*paddingScale, centerYVector+1.5*paddingScale, "AntiFakeNG")
		}

		// Verification endpoint footer
		footerY := overlayY + overlayH - 3.0*paddingScale
		pdf.SetFont(fontFamily, "B", 4.5*paddingScale)
		pdf.SetTextColor(0, 137, 193) // brand blue
		pdf.Text(textX, footerY, "SECURE VERIFICATION PORTAL")

		// Advance to next row when column resets
		if colIndex == columns-1 {
			currentRowInPage++
		}
	}

	err = pdf.Output(pdfWriter)
	if err != nil {
		return err
	}

	if outputFormat == "png" || outputFormat == "tiff" {
		tempPdfFile.Close()

		tempImgFile, err := os.CreateTemp("", "print-*." + outputFormat)
		if err != nil {
			return fmt.Errorf("failed to create temp image file: %v", err)
		}
		tempImgFile.Close()
		defer os.Remove(tempImgFile.Name())

		cmd := exec.Command("sips", "-s", "format", outputFormat, tempPdfFile.Name(), "--out", tempImgFile.Name())
		if outputErr := cmd.Run(); outputErr != nil {
			log.Printf("sips conversion failed: %v, falling back to writing PDF", outputErr)
			pdfBytes, readErr := os.ReadFile(tempPdfFile.Name())
			if readErr != nil {
				return readErr
			}
			_, writeErr := w.Write(pdfBytes)
			return writeErr
		}

		imgBytes, readErr := os.ReadFile(tempImgFile.Name())
		if readErr != nil {
			return readErr
		}
		_, writeErr := w.Write(imgBytes)
		return writeErr
	}

	return nil
}
