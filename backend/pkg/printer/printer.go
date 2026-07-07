package printer

import (
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
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
	localImage := config.LabelImage
	isTempFile := false
	if config.LabelImage != "" && (strings.HasPrefix(config.LabelImage, "http://") || strings.HasPrefix(config.LabelImage, "https://")) {
		resp, err := http.Get(config.LabelImage)
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

	rollWidth := config.WidthVal
	if rollWidth <= 0 {
		rollWidth = ParseWidth(config.WidthOption)
	}

	columns := config.Columns
	if columns <= 0 {
		columns = 12
	}

	// Calculate label sizing and spacing dynamically based on columns and roll width
	// For standard layouts: each label will be roughly 80mm wide by 40mm high
	labelWidth := 80.0
	labelHeight := 40.0
	padding := 5.0
	
	// Check if roll width can accommodate requested columns with spacing
	minRequiredWidth := float64(columns) * (labelWidth + padding) + padding
	if rollWidth < minRequiredWidth {
		// scale down label size to fit the roll width
		availableWidthPerCol := (rollWidth - padding) / float64(columns)
		labelWidth = availableWidthPerCol - padding
		labelHeight = labelWidth * 0.5 // maintain 2:1 aspect ratio
	} else {
		// Center the grid on the roll
		totalGridWidth := float64(columns)*(labelWidth+padding) - padding
		_ = (rollWidth - totalGridWidth) / 2.0 // side margins
	}

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
			pdf.Image(localImage, x, y, labelWidth, labelHeight, false, "", 0, "")
			pdf.TransformEnd()
		}

		// 1. Generate QR Code Matrix for the token
		// Verification URL: https://antifake.ng/verify?token=XXXX-XXXX
		verificationURL := fmt.Sprintf("https://antifake.ng/verify?token=%s", token)
		qrCode, err := qr.Encode(verificationURL, qr.M, qr.Auto)
		if err == nil {
			var qrSize float64
			var qrX, qrY float64

			if config.LabelImage != "" {
				qrSize = 12.0 // standard overlay size
				paddingQR := 2.0
				switch strings.ToLower(config.QRPosition) {
				case "top-left":
					qrX = x + paddingQR
					qrY = y + paddingQR
				case "top-right":
					qrX = x + labelWidth - qrSize - paddingQR
					qrY = y + paddingQR
				case "bottom-left":
					qrX = x + paddingQR
					qrY = y + labelHeight - qrSize - paddingQR
				case "bottom-right", "":
					qrX = x + labelWidth - qrSize - paddingQR
					qrY = y + labelHeight - qrSize - paddingQR
				default:
					qrX = x + labelWidth - qrSize - paddingQR
					qrY = y + labelHeight - qrSize - paddingQR
				}
			} else {
				qrSize = labelHeight * 0.85
				qrX = x + (labelHeight-qrSize)/2.0
				qrY = y + (labelHeight-qrSize)/2.0
			}

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

			// If custom label background, draw tiny serial text overlay
			if config.LabelImage != "" {
				textY := qrY + qrSize + 1.2
				pdf.SetFillColor(255, 255, 255)
				pdf.Rect(qrX, textY-1.2, qrSize, 2.0, "F")
				
				pdf.SetFont(fontFamily, "B", 4)
				pdf.SetTextColor(0, 0, 0)
				pdf.Text(qrX+0.5, textY, token)
			}
		}

		// Only render default metadata if no background image is uploaded
		if config.LabelImage == "" {
			// 2. Draw Metadata & Serial details on the right side of the label
			textX := x + labelHeight + 2.0
			textWidth := labelWidth - labelHeight - 4.0

			// Label title / Brand name (e.g. Serial details)
			pdf.SetFont(fontFamily, "B", 6)
			pdf.SetTextColor(120, 120, 120)
			pdf.Text(textX, y+6.0, fmt.Sprintf("SERIAL: %s", token))

			// Instruction message (wrapped text)
			pdf.SetFont(fontFamily, "", 4.5)
			pdf.SetTextColor(60, 60, 60)
			pdf.SetXY(textX, y+8.5)
			pdf.MultiCell(textWidth, 2.2, config.Message, "", "", false)

			// 3. Draw Site Logo and Name ("AntiFakeNG") in the empty space
			logoY := y + 20.0
			logoX := textX + 2.0

			if foundLogo != "" {
				logoSize := 8.0 // 8mm
				centerY := logoY + (logoSize / 2.0)
				pdf.Image(foundLogo, logoX, logoY, logoSize, logoSize, false, "PNG", 0, "")

				// Draw Site Name "AntiFakeNG" next to the logo
				pdf.SetFont(fontFamily, "B", 9.0)
				pdf.SetTextColor(18, 33, 59) // #12213B (Navy)
				pdf.Text(logoX+logoSize+2.0, centerY+1.5, "AntiFakeNG")
			} else {
				// Fallback: Draw green circular seal vector if logo file not found
				logoRadius := 4.0
				centerYVector := logoY + logoRadius
				pdf.SetFillColor(47, 228, 141) // #2FE48D
				pdf.Circle(logoX+logoRadius, centerYVector, logoRadius, "F")

				// Draw white checkmark inside the seal
				pdf.SetLineWidth(0.6)
				pdf.SetDrawColor(255, 255, 255)
				pdf.Line(logoX+logoRadius-1.6, centerYVector, logoX+logoRadius-0.4, centerYVector+1.2)
				pdf.Line(logoX+logoRadius-0.4, centerYVector+1.2, logoX+logoRadius+1.8, centerYVector-1.2)

				// Draw Site Name "AntiFakeNG" next to the seal
				pdf.SetFont(fontFamily, "B", 9.0)
				pdf.SetTextColor(18, 33, 59) // #12213B
				pdf.Text(logoX+logoRadius*2.0+2.0, centerYVector+1.5, "AntiFakeNG")
			}

			// Verification endpoint footer
			pdf.SetFont(fontFamily, "B", 4.5)
			pdf.SetTextColor(0, 137, 193) // brand blue
			pdf.Text(textX, y+labelHeight-3.0, "SECURE VERIFICATION PORTAL")
		}

		// Advance to next row when column resets
		if colIndex == columns-1 {
			currentRowInPage++
		}
	}

	return pdf.Output(w)
}
