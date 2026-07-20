#!/usr/bin/env bash
set -e

echo "=== 1. Checking Dependencies for Cross-Platform Desktop Builds ==="
if command -v x86_64-w64-mingw32-gcc >/dev/null 2>&1 || command -v i686-w64-mingw32-gcc >/dev/null 2>&1; then
    echo "✓ mingw-w64 cross-compiler tools are available."
else
    if command -v brew >/dev/null 2>&1; then
        echo "Installing mingw-w64 for Windows cross-compilation..."
        brew install mingw-w64 || true
        ln -s /usr/local/Cellar/mingw-w64/*/toolchain-*/bin/* /usr/local/bin/ 2>/dev/null || true
    fi
fi

if command -v create-dmg >/dev/null 2>&1; then
    echo "✓ create-dmg is installed."
else
    if command -v brew >/dev/null 2>&1; then
        echo "Installing create-dmg for macOS DMG creation..."
        brew install create-dmg || true
    fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BIN_DIR="$SCRIPT_DIR/build/bin"
mkdir -p "$BIN_DIR"

echo ""
echo "=== 2. Building macOS Production Package & DMG Installer ==="
wails build -clean -platform darwin/amd64

echo "Packaging macOS DMG..."
if command -v create-dmg >/dev/null 2>&1; then
    rm -f "$BIN_DIR/antifake-desktop.dmg"
    create-dmg \
        --volname "Antifake Desktop" \
        --window-pos 200 120 \
        --window-size 800 400 \
        --icon-size 100 \
        --app-drop-link 600 185 \
        "$BIN_DIR/antifake-desktop.dmg" \
        "$BIN_DIR/desktop-app.app" || true
else
    echo "Falling back to hdiutil..."
    rm -f "$BIN_DIR/antifake-desktop.dmg"
    hdiutil create -volname "Antifake Desktop" -srcfolder "$BIN_DIR/desktop-app.app" -ov -format UDZO "$BIN_DIR/antifake-desktop.dmg"
fi

echo ""
echo "=== 3. Building Windows Production Binary & Installer (.exe) ==="
if command -v x86_64-w64-mingw32-gcc >/dev/null 2>&1; then
    wails build -platform windows/amd64 -nsis
    echo "✓ Windows (amd64) build complete!"
elif command -v i686-w64-mingw32-gcc >/dev/null 2>&1; then
    wails build -platform windows/386 -nsis
    echo "✓ Windows (386) build complete!"
else
    echo "⚠ Warning: mingw-w64 compiler not found. Skipping Windows compilation."
    echo "To build for Windows, install mingw-w64 ('brew install mingw-w64') or run 'wails build -platform windows/amd64' on Windows/CI."
fi

echo ""
echo "=== Build Complete! Outputs in build/bin/ ==="
ls -la "$BIN_DIR"
