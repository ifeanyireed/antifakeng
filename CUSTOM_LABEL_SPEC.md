# Custom Label Layout & Scale Specification

This document defines the mathematical models, CSS structures, and backend Go PDF printer rules that govern custom label resizing, layout aspect ratios, and responsive QR code overlays. 

> [!IMPORTANT]
> To prevent visual alignment shifts between the interactive layout editors, PDF previews, and printed outputs, these configurations must remain locked.

---

## 1. Core Principles

1. **Unconstrained Aspect Ratio:**
   - Previews are displayed in their natural dimensions (`inline-block` container) wrapping the custom background label graphic exactly.
   - The Go PDF printer decodes the actual background image dimensions and sets the printed label height dynamically to match the image's original proportions.

2. **Percentage-based Overlay Positioning:**
   - Positioning coordinates ($X\%$ and $Y\%$) are mapped as absolute percentages (`left: x%`, `top: y%` with `translate(-x%, -y%)`) relative to the natural bounds of the background image.

3. **Percentage & Container Query-based Scaling:**
   - The QR overlay card width scales relative to the background width: `width: 90 * scale %` (where `scale` is `qrScale / 100`).
   - The QR card's internal layout uses CSS percentages (e.g. `w-[41.67%]` for the QR code and percentage margins) and container query typography (`cqw` units) to ensure identical layouts at any size.

---

## 2. Frontend React Specs (`batches/page.tsx`)

The overlay QR card is defined as a responsive HTML container:

```tsx
<div 
  style={{
    width: `${90 * (qrScale / 100)}%`,
    position: "absolute",
    left: `${qrX}%`,
    top: `${qrY}%`,
    transform: `translate(-${qrX}%, -${qrY}%)`
  }}
  className="bg-white/95 border border-slate-200/50 rounded-none shadow-md flex items-center select-none aspect-[72/34] @container"
>
  {/* Left: QR Code Icon (30mm out of 72mm width = 41.67%) */}
  <div className="w-[41.67%] aspect-square flex items-center justify-center bg-slate-50 border border-slate-100 rounded-md shrink-0 ml-[2.77%]" />
  
  {/* Right: Text Metadata & Logo */}
  <div className="flex-1 h-full flex flex-col justify-between text-left min-w-0 pl-[4.16%] py-[2.77%] pr-[2.77%]">
    <div className="font-black text-slate-500 tracking-wider uppercase leading-none text-[3.17cqw]">
      SERIAL: <span className="font-mono text-slate-800 font-extrabold">B-XXXX</span>
    </div>
    <p className="text-slate-600 font-medium line-clamp-3 leading-tight mt-[1%]" style={{ fontSize: '3.57cqw' }}>
      Scan QR code or visit...
    </p>
    {/* ... */}
  </div>
</div>
```

---

## 3. Backend Go PDF Specs (`printer/printer.go`)

### Aspect Ratio Decoding
To ensure the PDF height matches the web layout exactly, the printer decodes the custom graphic configurations:

```go
// Adjust labelHeight to preserve the original aspect ratio of the custom label graphic without restrictions
if localImage != "" && fileExists(localImage) {
    if file, err := os.Open(localImage); err == nil {
        if imgConfig, _, err := image.DecodeConfig(file); err == nil {
            if imgConfig.Width > 0 && imgConfig.Height > 0 {
                aspectRatio := float64(imgConfig.Width) / float64(imgConfig.Height)
                labelHeight = labelWidth / aspectRatio
            }
        }
        file.Close()
    }
}
```

### Proportional Stretching Math
To ensure the QR card and its inner text/images scale correctly relative to the label width when stretched/shrunk in manual columns mode:

$$
\text{stretch} = \frac{\text{labelWidth}}{\text{baseWidth}}
$$

Where:
- $\text{labelWidth}$ is the actual print column width determined by the columns selection.
- $\text{baseWidth}$ is the design-time physical width of the image graphic (defaults to $80.0\text{ mm}$ if metadata is missing).

The overlay container dimensions scale relative to the stretch:

$$
\text{overlayW} = (\text{baseWidth} \times 0.90) \times \left( \frac{\text{qrScale}}{100.0} \right) \times \text{stretch} = 0.90 \times \left( \frac{\text{qrScale}}{100.0} \right) \times \text{labelWidth}
$$

$$
\text{overlayH} = (\text{baseWidth} \times 0.425) \times \left( \frac{\text{qrScale}}{100.0} \right) \times \text{stretch} = 0.425 \times \left( \frac{\text{qrScale}}{100.0} \right) \times \text{labelWidth}
$$

And the inner overlay contents (fonts, margins, logo size, circle radii) scale using the density scale factor:

$$
\text{contentScale} = \left( \frac{\text{qrScale}}{100.0} \right) \times \text{stretch} \times \frac{\text{baseWidth}}{80.0} = \left( \frac{\text{qrScale}}{100.0} \right) \times \frac{\text{labelWidth}}{80.0}
$$

### Drawing Coordinates
The absolute draw coordinates lock the position in percentage space:

$$
X_{\text{draw}} = X_{\text{base}} + \frac{x\%}{100} \times (\text{labelWidth} - \text{overlayW})
$$

$$
Y_{\text{draw}} = Y_{\text{base}} + \frac{y\%}{100} \times (\text{labelHeight} - \text{overlayH})
$$

---

## 4. Key Verification Checks
- **2:1 Labels:** Will print at standard $80\text{mm} \times 40\text{mm}$.
- **Square Labels:** Will dynamically expand height to print at $80\text{mm} \times 80\text{mm}$.
- **Scaling:** If the QR zoom slider is at $100\%$, the QR overlay card occupies exactly $90\%$ of the label's width in both the UI preview and the printed PDF output, regardless of the column layout or the original physical image size.

---

## 5. PNG & TIFF Image Conversion Pipeline

To support high-fidelity downloads in image formats, the backend implements a PDF-to-image conversion flow:

### Dependency Detection
To run reliably in both macOS local development environments and Linux production containers (e.g. Render), the backend checks for available binary utilities dynamically:
1. **`pdftoppm` (Lossless Linux Standard):** First-priority check (part of `poppler-utils`). Processes page conversion using native Linux packages.
2. **`sips` (macOS Standard):** Second-priority fallback for local Mac developers.

If neither tool is found in the system `PATH`, the generator returns a structured error to the caller, preventing silent fallback file corruption.

### TIFF Size Optimization
Uncompressed TIFF formats generate massive file sizes (up to 10 MB per row). When converting via `sips`, the backend forces **LZW lossless compression** using:
```bash
sips -s format tiff -s formatOptions lzw <pdf-file> --out <tiff-file>
```
This reduces TIFF file sizes **by over 35x** (down to ~270 KB per row), ensuring fast network transfers and preventing browser/memory crashes.

### Buffered HTTP Handler Pattern
To prevent corrupted downloads, the HTTP handler in `producer-service/main.go` writes the generated bytes to an in-memory `bytes.Buffer` before serving the HTTP response.
- **On Success:** Sends the headers (`Content-Type: image/png` or `image/tiff` and `Content-Disposition`) and writes the buffer bytes.
- **On Failure:** Suppresses the binary download headers and returns a proper **HTTP 500 Internal Server Error** status code with a JSON error body:
```json
{
  "error": "Failed to generate print layout: no PDF image conversion utility (pdftoppm/sips) found in system path"
}
```
This ensures the client frontend can intercept the error and show a user-friendly alert instead of letting the user download a corrupted/broken image file.
