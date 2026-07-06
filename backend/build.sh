#!/bin/bash
set -e

# AntiFakeNG Microservices Build Script
# Creates output directory and compiles all Go backend services.

BIN_DIR="./bin"
mkdir -p "$BIN_DIR"

echo "=== Building Backend Microservices ==="

SERVICES=(
  "gateway"
  "auth-service"
  "producer-service"
  "verification-service"
  "analytics-service"
)

for service in "${SERVICES[@]}"; do
  echo "Building $service..."
  go build -o "$BIN_DIR/$service" cmd/$service/main.go
done

echo "=== All microservices compiled successfully in $BIN_DIR/ ==="
