#!/bin/bash

# Target directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Ping auth service status endpoint
STATUS_JSON=$(curl -s --max-time 5 http://localhost:8081/api/auth/whatsapp/status)

# Check if auth service is online
if [ -z "$STATUS_JSON" ]; then
    echo "$(date): [WhatsApp Status Checker] Auth Service is offline or not responding! Restarting backend..."
    ./run.sh
    exit 1
fi

# Extract status value using grep/sed
STATUS=$(echo "$STATUS_JSON" | grep -o '"status":"[^"]*' | grep -o '[^"]*$')

echo "$(date): [WhatsApp Status Checker] Status is: $STATUS"

if [ "$STATUS" = "connected" ]; then
    echo "$(date): [WhatsApp Status Checker] WhatsApp session is connected and active."
    exit 0
elif [ "$STATUS" = "unpaired" ] || [ "$STATUS" = "disconnected" ]; then
    echo "$(date): [WhatsApp Status Checker] Session status is '$STATUS'. Reconnection/Pairing required!"
    
    # If unpaired, clear the sqlite db to trigger a fresh pair session on restart
    if [ "$STATUS" = "unpaired" ]; then
        echo "$(date): [WhatsApp Status Checker] Clearing unpaired session database..."
        rm -f wameow_session.db
    fi
    
    # Restart the backend. Upon starting, the auth service will notice
    # that the session is inactive, generate a new pairing code,
    # and automatically email it to the administrator.
    echo "$(date): [WhatsApp Status Checker] Restarting services..."
    ./run.sh
    exit 1
else
    echo "$(date): [WhatsApp Status Checker] Unknown status: '$STATUS'. Re-starting services..."
    ./run.sh
    exit 1
fi
