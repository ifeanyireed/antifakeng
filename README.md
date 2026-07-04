# AntiFakeNG 🛡️

AntiFakeNG is a modern product verification and anti-counterfeiting platform. It enables manufacturers (producers) to register products and generate unique, verifiable QR codes, and allows consumers/inspectors to verify product authenticity in real-time.

---

## 🏗️ Architecture

The project is structured into two main layers:

1. **Go Backend (Microservices)**:
   - **API Gateway**: Entry point (Port `8080`) that routes requests to individual services.
   - **Auth Service**: Manages user authentication, registration, and sessions (Port `8081`).
   - **Producer Service**: Handles manufacturer onboarding, product management, and batch generation (Port `8082`).
   - **Verification Service**: Processes public QR scan codes and checks item status (Port `8083`).
   - **Analytics Service**: Collects statistics on scans, verification rates, and geo-data (Port `8084`).
   - **Database**: Employs MySQL or PostgreSQL for robust database storage.

2. **Next.js Frontend (Web App)**:
   - Built with Next.js (App Router), TypeScript, and TailwindCSS / Vanilla CSS.
   - Provides dashboards for producers to manage products, request verification tags, and monitor analytics.
   - Public-facing page for scanning and verification lookup.

---

## 🚀 Getting Started

### Prerequisites
- [Go](https://go.dev/) (version 1.22+ recommended)
- [Node.js](https://nodejs.org/) (version 18+ recommended)

---

### 1. Running the Go Backend

Navigate to the `backend` directory and use the control scripts:

```bash
cd backend

# Build and start all microservices + seed test data
./run.sh

# Stop all microservices
./stop.sh
```

- **Gateway Endpoint**: `http://localhost:8080/api`
- **Logs**: Located in `backend/logs/` (e.g., `backend/logs/gateway.log`, `backend/logs/auth-service.log`, etc.)

---

### 2. Running the Web App

Navigate to the `web-app` directory and start the Next.js dev server:

```bash
cd web-app

# Install dependencies
npm install

# Run the development server
npm run dev
```

- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
