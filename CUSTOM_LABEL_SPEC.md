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

### Drawing Math
The overlay dimensions and coordinates are drawn with the exact CSS relative offset mapping:

$$
\text{overlayWidth} = 72 \times \text{scale}
$$

$$
\text{overlayHeight} = 34 \times \text{scale}
$$

$$
X_{\text{draw}} = X_{\text{base}} + \frac{x\%}{100} \times (\text{labelWidth} - \text{overlayWidth})
$$

$$
Y_{\text{draw}} = Y_{\text{base}} + \frac{y\%}{100} \times (\text{labelHeight} - \text{overlayHeight})
$$

---

## 4. Key Verification Checks
- **2:1 Labels:** Will print at standard $80\text{mm} \times 40\text{mm}$.
- **Square Labels:** Will dynamically expand height to print at $80\text{mm} \times 80\text{mm}$.
- **Scaling:** If the QR zoom slider is at $100\%$, the QR overlay card occupies exactly $90\%$ of the label's width in both the UI preview and the printed PDF output.
