#!/bin/bash

# AntiFakeNG Microservices Start Script
# Runs background services and runs the API Gateway in the foreground.

BIN_DIR="./bin"

echo "=== Starting Backend Services ==="

# Start backend services in the background
# Output goes directly to stdout/stderr so Render can collect all service logs
"$BIN_DIR/auth-service" &
"$BIN_DIR/producer-service" &
"$BIN_DIR/verification-service" &
"$BIN_DIR/analytics-service" &

# Give background services a moment to start up and bind to their ports
sleep 2

echo "=== Launching API Gateway (Foreground) ==="
# Run the gateway as the foreground process to keep the Render container running
exec "$BIN_DIR/gateway"
