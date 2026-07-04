# AntiFakeNG Mock-to-API Migration Progress Tracker

This document tracks the current migration status of AntiFakeNG's Next.js front-end screens from hardcoded mocks to live database/API fetches.

---

## 📊 Summary
- **Total Screens:** 19
- **Not Started (Pending):** 0
- **In Progress:** 0
- **Completed:** 19

---

## 🚶‍♂️ Progress Status Table

### 🔑 Public & Onboarding Space
| Route | Description | Status | Notes |
|---|---|---|---|
| `/` | Dynamic landing router | 🟢 Completed | Connected to local state auth handshake |
| `/login` | Authentication Portal | 🟢 Completed | Connected to Go auth-service `/api/auth/login` |
| `/register` | Manufacturer Registration | 🟢 Completed | Connected to Go auth-service `/api/auth/register` |
| `/onboarding` | Brand configuration wizard | 🟢 Completed | Connected to Go producer-service `/api/producer/profile` |

### 🔍 Consumer Verification Space
| Route | Description | Status | Notes |
|---|---|---|---|
| `/verify/[token]` | Dynamic QR Scan Page | 🟢 Completed | Fully integrated risk scan check, phone binding, and feedback reports |
| `/consumer` | Standalone Manual Lookup | 🟢 Completed | Fully integrated search metadata, phone binding, risk checks, and reports |

### 🏭 Producer Space
| Route | Description | Status | Notes |
|---|---|---|---|
| `/producer/dashboard` | Main metrics & charts | 🟢 Completed | Retrieve metrics, scan charts, and recent events from gateway |
| `/producer/products` | SKU catalog manager | 🟢 Completed | Connected to Go producer-service `/api/producer/products` |
| `/producer/batches` | Batch/QR PDF exporter | 🟢 Completed | Connected to Go producer-service `/api/producer/batches` |
| `/producer/alerts` | Batch-level fraud center | 🟢 Completed | Connected to Go analytics-service `/api/analytics/alerts` and POST resolve |
| `/producer/history` | Consumer scan logs table | 🟢 Completed | Connected to Go analytics-service `/api/analytics/history` |
| `/producer/reports` | Consumer feedback reports | 🟢 Completed | Connected to Go analytics-service `/api/analytics/reports` and POST resolve |
| `/producer/notifications` | Notifications digests | 🟢 Completed | Connected to Go analytics, reports, and batches feeds |
| `/producer/profile` | settings & billing limits | 🟢 Completed | Connected to Go producer-service `/api/producer/profile` and analytics summary |

### 🛡️ SaaS Global Admin Space
| Route | Description | Status | Notes |
|---|---|---|---|
| `/admin/dashboard` | Platform metrics & node loads | 🟢 Completed | Retrieve global counts and active incidents |
| `/admin/producers` | Tenant profiles manager | 🟢 Completed | Retrieve all brands, toggle plan levels / status |
| `/admin/fraud` | Cross-tenant alerts & maps | 🟢 Completed | Fetch geo clusters maps and unresolved threat lists |
| `/admin/logs` | Immutable audit trails | 🟢 Completed | Connected to Go analytics-service `/api/analytics/audit-logs` |
| `/admin/notifications` | SaaS administration digests | 🟢 Completed | Hook system alerts, tenant signups, and system audit logs |

---

## 🛠️ Action Items Log
- [x] Initialize tracker.
- [x] Connect `/login` form submission to `POST /api/auth/login`.
- [x] Connect `/register` and `/onboarding` wizard to backend auth and onboarding APIs.
- [x] Update `/consumer` standalone checker page to query backend verification endpoints.
- [x] Transition `/producer/products` to `GET/POST /api/producer/products`.
- [x] Transition `/producer/batches` print run and batch creations to DB endpoints.
- [x] Update dashboard statistics and charts to load live telemetry from analytics-service.
- [x] Hook `/producer/alerts` and `/producer/reports` to the analytical resolution flow.
- [x] Implement and integrate missing endpoints (e.g. audit logs and individual verification history) on the backend.
