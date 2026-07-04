#!/bin/bash
echo "Stopping all AntiFakeNG microservices..."
for port in 8080 8081 8082 8083 8084; do
  pid=$(lsof -t -i:$port || true)
  if [ -n "$pid" ]; then
    kill -9 $pid || true
  fi
done
echo "Stopped!"
