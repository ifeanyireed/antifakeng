#!/bin/bash

# AntiFakeNG Microservices Control Script
# Compiles, launches, and seeds the Go backend.

set -e

# Base directories
BIN_DIR="./bin"
LOG_DIR="./logs"
mkdir -p "$BIN_DIR"
mkdir -p "$LOG_DIR"

# Load environment variables from .env if present
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  export $(grep -v '^#' .env | xargs)
fi

echo "=== 1. Building Microservices ==="
echo "Building Gateway..."
go build -o "$BIN_DIR/gateway" cmd/gateway/main.go
echo "Building Auth Service..."
go build -o "$BIN_DIR/auth-service" cmd/auth-service/main.go
echo "Building Producer Service..."
go build -o "$BIN_DIR/producer-service" cmd/producer-service/main.go
echo "Building Verification Service..."
go build -o "$BIN_DIR/verification-service" cmd/verification-service/main.go
echo "Building Analytics Service..."
go build -o "$BIN_DIR/analytics-service" cmd/analytics-service/main.go
echo "All services built successfully!"

echo ""
echo "=== 2. Stopping Existing Instances (Ports 8080-8084) ==="
for port in 8080 8081 8082 8083 8084; do
  pid=$(lsof -t -i:$port || true)
  if [ -n "$pid" ]; then
    echo "Stopping process running on port $port (PID: $pid)..."
    kill -9 $pid || true
  fi
done

echo ""
echo "=== 3. Starting Microservices in Background ==="
echo "Starting Auth Service on :8081..."
"$BIN_DIR/auth-service" > "$LOG_DIR/auth-service.log" 2>&1 &
AUTH_PID=$!

echo "Starting Producer Service on :8082..."
"$BIN_DIR/producer-service" > "$LOG_DIR/producer-service.log" 2>&1 &
PROD_PID=$!

echo "Starting Verification Service on :8083..."
"$BIN_DIR/verification-service" > "$LOG_DIR/verification-service.log" 2>&1 &
VERIFY_PID=$!

echo "Starting Analytics Service on :8084..."
"$BIN_DIR/analytics-service" > "$LOG_DIR/analytics-service.log" 2>&1 &
ANALYTICS_PID=$!

# Let services start before gateway proxies to them
sleep 1

echo "Starting API Gateway on :8080..."
"$BIN_DIR/gateway" > "$LOG_DIR/gateway.log" 2>&1 &
GATEWAY_PID=$!

echo "All services started!"
echo "PIDs:"
echo "  Gateway: $GATEWAY_PID"
echo "  Auth:    $AUTH_PID"
echo "  Producer:$PROD_PID"
echo "  Verify:  $VERIFY_PID"
echo "  Analyt:  $ANALYTICS_PID"

echo ""
echo "=== 4. Bootstrapping Database & Test Seed ==="
sleep 1
echo "Sending seed request to bootstrap test database..."
SEED_RESP=$(curl -s -X POST http://localhost:8080/api/auth/seed || echo "failed")
echo "Seed Response:"
echo "$SEED_RESP"

echo ""
echo "=== 5. Verification Check ==="
echo "Testing public QR metadata endpoint (Token: 9F3C-71AE)..."
QR_RESP=$(curl -s http://localhost:8080/api/verify/token/9F3C-71AE || echo "failed")
echo "Metadata Response:"
echo "$QR_RESP"

echo ""
echo "============================================================"
echo " AntiFakeNG microservices are running!"
echo " Gateway Entry Point: http://localhost:8080/api"
echo " Logs directory:      $LOG_DIR/"
echo " To stop all services, run: ./run.sh stop"
echo "============================================================"

# Write a quick stop runner
cat << 'EOF' > stop.sh
#!/bin/bash
echo "Stopping all AntiFakeNG microservices..."
for port in 8080 8081 8082 8083 8084; do
  pid=$(lsof -t -i:$port || true)
  if [ -n "$pid" ]; then
    kill -9 $pid || true
  fi
done
echo "Stopped!"
EOF
chmod +x stop.sh
