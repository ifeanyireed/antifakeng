# AntiFakeNG Mocks-to-Database Replacement Plan

This document outlines the systematic steps required to transition the AntiFakeNG Next.js front-end application from hardcoded mock values to dynamic database queries backed by the Go services. The schema reference for all database-level operations is found in [schema.sql](file:///Volumes/ReedBreedCC/ahnara/antifake/schema.sql).

---

## ⚙️ Global Architecture & Constants
The Next.js front-end communicates with the Go backend via HTTP request utilities defined in [api.ts](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/lib/api.ts). 
- All requests leverage `apiFetch` which intercepts, appends the authorization header (JWT token), and parses the response.
- **Critical Rule (Subscription Limits):** Subscription plan tiers and limits (e.g. max monthly code generations) are managed centrally in `SubscriptionHelper.ts` and enforced/displayed via `SubscriptionService` and backend middleware. Front-end code should avoid relying on static plans or raw, outdated database limits for billing details.

---

## 🔑 Public & Onboarding Space

### 1. Root Router (`/`)
- **Current State:** Dynamic redirection logic on mount.
- **DB Replacement Tasks:** 
  - Verify token presence in local storage using `getAuthToken()` from [api.ts](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/lib/api.ts).
  - Perform a verification handshake calling `GET /auth/me`. 
  - If valid and role is `admin`, redirect to `/admin/dashboard`. If role is `producer`, redirect to `/producer/dashboard`. Otherwise, redirect to `/login`.
- **Target Files:** [app/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/page.tsx)

### 2. Login Portal (`/login`)
- **Current State:** Hardcoded email/password timeout simulation that returns a static mock token and redirects.
- **DB Replacement Tasks:**
  - Update `handleSubmit` to call `POST /api/auth/login` sending `{ email, password }`.
  - Validate response payload mapping to user details and retrieve the JWT bearer token.
  - Store token using `login(token, user)` inside [AuthContext.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/components/ahnara/AuthContext.tsx) to populate context.
  - Route based on the backend-supplied claims role (`RoleAdmin` vs `RoleProducer` as defined in [models.go](file:///Volumes/ReedBreedCC/ahnara/antifake/backend/pkg/models/models.go)).
- **Target Files:** [app/login/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/login/page.tsx)

### 3. Account Registration (`/register`)
- **Current State:** Client-side quick-login/registration mock that stores a mock token and routes to onboarding.
- **DB Replacement Tasks:**
  - Replace simulation with `POST /api/auth/register` sending `{ name, email, password }`.
  - Backend inserts a new tenant into the `producers` table (defaulting to `active` or `pending` status) and registers the administrator in the `users` table with `producer_id` pointing to the newly generated brand.
  - Returns JWT token; client invokes `login(token, user)` and pushes the router to `/onboarding`.
- **Target Files:** [app/register/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/register/page.tsx)

### 4. Brand Onboarding (`/onboarding`)
- **Current State:** Writes mock brand settings, selected plan tier, and mock API credentials to local storage (`producer_brand_data`).
- **DB Replacement Tasks:**
  - Replace `localStorage` mutations with `POST /api/producer/onboard` or `PUT /api/producer/profile`.
  - Send `{ brandName, industry, website, hqAddress, planTier }` payload.
  - Backend updates the `producers` table (`name`, `contact_email`, `plan_tier`) and issues secure credentials stored or managed by the server.
- **Target Files:** [app/onboarding/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/onboarding/page.tsx)

---

## 🔍 Consumer Verification Space

### 5. Dynamic QR Verification (`/verify/[token]`)
- **Current State:** Partially integrated. Fetches details from `/api/verify/token/${token}` and reports verify check via `/api/verify/token/${token}/check`.
- **DB Replacement Tasks:**
  - Replace mock feedback submit `handleReportSubmit` with `POST /api/verify/token/${token}/report`.
  - Sends `{ retailerName, retailerLocation, description, photoUrl }`.
  - Backend queries `qr_codes` for token mapping, fetches consumer ID from verified OTP session, and writes a pending row to the `reports` table.
- **Target Files:** [app/verify/[token]/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/verify/%5Btoken%5D/page.tsx)

### 6. Standalone Consumer Lookup (`/consumer`)
- **Current State:** Full client-side mock. Runs state validation loops checking static code `"123456"`. Contains Dev Verdict simulator buttons.
- **DB Replacement Tasks:**
  - Implement full parity with `/verify/[token]` workflows.
  - Replace `handleTokenSubmit` to call `GET /api/verify/token/${token}` where `token` is bound to the input state.
  - Connect OTP verification (`handlePhoneSubmit`, `handleOtpSubmit`) to call `/api/auth/otp/request` and `/api/auth/otp/verify` endpoints.
  - Connect report submission `handleReportSubmit` to `POST /api/verify/token/${token}/report`.
  - Disable or remove the Dev controls in production code.
- **Target Files:** [app/consumer/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/consumer/page.tsx)

---

## 🏭 Producer Dashboard Space

### 7. Producer Dashboard Main (`/producer/dashboard`)
- **Current State:** Statically renders lists and stats for "AURA Skincare" using mock variables (`stats`, `recentScans`, `activeAlerts`, `chartData`).
- **DB Replacement Tasks:**
  - Replace `stats` with a call to `GET /api/producer/dashboard/stats` yielding:
    - **Total Serial Scans:** `SELECT COUNT(*) FROM verification_sessions vs JOIN qr_codes q ON vs.qr_code_id = q.id JOIN batches b ON q.batch_id = b.id JOIN products p ON b.product_id = p.id WHERE p.producer_id = ?`
    - **Genuine Confirmations:** Sum of above where `vs.result = 'genuine'`
    - **Counterfeit Alerts:** `SELECT COUNT(*) FROM fraud_events fe JOIN verification_sessions vs ON fe.verification_session_id = vs.id JOIN qr_codes q ON vs.qr_code_id = q.id JOIN batches b ON q.batch_id = b.id JOIN products p ON b.product_id = p.id WHERE p.producer_id = ? AND fe.resolved_at IS NULL`
    - **Products in Catalog:** `SELECT COUNT(*) FROM products WHERE producer_id = ?`
  - Replace `recentScans` with `GET /api/producer/dashboard/recent-scans` (joining `verification_sessions`, `qr_codes`, and `products`).
  - Replace `activeAlerts` with `GET /api/producer/dashboard/active-alerts` (joining unresolved `fraud_events`, `verification_sessions`, and `products`).
  - Replace `chartData` with `GET /api/producer/dashboard/charts?timeframe={24h|7d|30d}` grouping scan records by hour or day.
- **Target Files:** [app/producer/dashboard/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/dashboard/page.tsx)

### 8. Product Catalog (`/producer/products`)
- **Current State:** Statically initialized `products` array state and local client append.
- **DB Replacement Tasks:**
  - Fetch catalog on mount using `GET /api/producer/products`.
  - Rewrite `handleAddProduct` to send `POST /api/producer/products` with `{ name, sku, category, description, image_url }`.
  - Calculate `scans` by performing an aggregate count of verification sessions per SKU.
- **Target Files:** [app/producer/products/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/products/page.tsx)

### 9. Batch Management (`/producer/batches`)
- **Current State:** Local array state for batches. Fallback print layout generator outputs a mock text file descriptor when no DB seeded batch matches.
- **DB Replacement Tasks:**
  - Call `GET /api/producer/batches` on mount.
  - Bind `handleCreateBatch` to `POST /api/producer/batches` sending `{ product_id, quantity, expiry_date }`. Backend will generate batch metadata and pre-allocate cryptographically secure serial tokens inside `qr_codes`.
  - Call `PUT /api/producer/batches/${id}/recall` to update `batches.status = 'recalled'` and trigger consumer warning overrides on corresponding serial scans.
  - Connect Print PDF generation `handleStartGeneration` to target the real Go endpoint `/api/producer/batches/${id}/print`.
- **Target Files:** [app/producer/batches/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/batches/page.tsx)

### 10. Alerts & Security Center (`/producer/alerts`)
- **Current State:** Static `alerts` list. Actions simulate updates to status.
- **DB Replacement Tasks:**
  - Call `GET /api/producer/alerts` to query unresolved `fraud_events` joined with product metadata.
  - Rewrite actions to update state via backend endpoints:
    - **Resolve:** `PUT /api/producer/alerts/${id}/resolve` (updates `resolved_by` and `resolved_at` in the DB).
    - **Investigate:** `PUT /api/producer/alerts/${id}/status` (updates status label on the event).
- **Target Files:** [app/producer/alerts/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/alerts/page.tsx)

### 11. Consumer Scan History (`/producer/history`)
- **Current State:** Static array table.
- **DB Replacement Tasks:**
  - Call `GET /api/producer/history` (supporting search text and page pagination queries).
  - Backend queries `verification_sessions` mapped to the tenant's products.
- **Target Files:** [app/producer/history/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/history/page.tsx)

### 12. Feedback Reports (`/producer/reports`)
- **Current State:** Mock array of reports detailing consumer complaints.
- **DB Replacement Tasks:**
  - Call `GET /api/producer/reports` to retrieve entries from `reports` table associated with the brand's QR codes.
  - Implement resolve feedback action by calling `PUT /api/producer/reports/${id}/resolve`.
- **Target Files:** [app/producer/reports/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/reports/page.tsx)

### 13. System Notifications (`/producer/notifications`)
- **Current State:** Client-only notification array feed.
- **DB Replacement Tasks:**
  - Implement a dynamic notifications service calling `GET /api/producer/notifications` aggregating batch approvals, new consumer reports, subscription updates, and fraud warnings.
- **Target Files:** [app/producer/notifications/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/notifications/page.tsx)

### 14. Brand Settings & Profile (`/producer/profile`)
- **Current State:** Mock company profile and static usage limits displaying "24,812 / 250,000 codes".
- **DB Replacement Tasks:**
  - Call `GET /api/producer/profile` to populate company inputs from the `producers` table.
  - Call `PUT /api/producer/profile` to update contact email and logo URL.
  - Call `POST /api/producer/profile/security` to update the user’s hashed password credentials.
  - **Usage Limits Integration:** Fetch current active usage counts and limits by leveraging `SubscriptionService` in the backend, reflecting the rule parameters in `SubscriptionHelper.ts`.
- **Target Files:** [app/producer/profile/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/profile/page.tsx)

---

## 🛡️ SaaS Global Admin Space

### 15. Admin Dashboard (`/admin/dashboard`)
- **Current State:** Hardcoded metrics, incidents, and node status bars.
- **DB Replacement Tasks:**
  - Call `GET /api/admin/dashboard/stats` to aggregate global counts across all tenants:
    - **Active Producers:** `SELECT COUNT(*) FROM producers WHERE status = 'active'`
    - **Total Serial Inventory:** `SELECT COUNT(*) FROM qr_codes`
    - **Global Threat Incidents:** `SELECT COUNT(*) FROM fraud_events`
  - Replace incident feed with `GET /api/admin/dashboard/incidents` querying unresolved global threat events.
- **Target Files:** [app/admin/dashboard/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/dashboard/page.tsx)

### 16. Producer & Tenant Manager (`/admin/producers`)
- **Current State:** Static table list of brands.
- **DB Replacement Tasks:**
  - Call `GET /api/admin/producers` to fetch all tenants. Retrieve aggregate brand statistics (codes issued vs plan limits) calculated dynamically by the server.
  - Hook up the edit plan modal to issue `PUT /api/admin/producers/${id}/plan` or `PUT /api/admin/producers/${id}/status`.
- **Target Files:** [app/admin/producers/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/producers/page.tsx)

### 17. Global Fraud Tracker (`/admin/fraud`)
- **Current State:** Hardcoded lists of cross-tenant anomalies and static clusters map indicator.
- **DB Replacement Tasks:**
  - Query `GET /api/admin/fraud/incidents` to list all critical warnings.
  - Fetch aggregated map coordinates or cluster names (e.g. Lagos, Abuja) based on `verification_sessions.ip_country`.
  - Connect incident actions to `PUT /api/admin/fraud/incidents/${id}/resolve`.
- **Target Files:** [app/admin/fraud/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/fraud/page.tsx)

### 18. System Audit Trail (`/admin/logs`)
- **Current State:** Static log records.
- **DB Replacement Tasks:**
  - Fetch logging stream via `GET /api/admin/logs`.
  - Backend reads from the `audit_logs` table (ordered by `created_at` DESC) joined with operator details from `users`.
- **Target Files:** [app/admin/logs/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/logs/page.tsx)

### 19. Global Sync Notifications (`/admin/notifications`)
- **Current State:** Hardcoded SaaS administrative notifications feed.
- **DB Replacement Tasks:**
  - Call `GET /api/admin/notifications` yielding system replication statuses, new brand onboarding logs, and critical threshold breaches.
- **Target Files:** [app/admin/notifications/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/notifications/page.tsx)

---

## 🌱 Database Seeding Tasks

To ensure that the dashboards, charts, maps, and tables do not render as blank lists during development, additional mock verification activity must be seeded. The current `schema.sql` lacks test data for sessions, devices, and threats.

We must define the following insert tasks in [schema.sql](file:///Volumes/ReedBreedCC/ahnara/antifake/schema.sql) or a secondary developer seed runner:

### 1. Consumer Records (`consumers`)
Seed active verifiers to link to scan histories and complaint records:
```sql
INSERT INTO consumers (id, phone_number_hash, verification_count) VALUES
(1, 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 14), -- +234 803 291 0422
(2, 'd5d6c8b988310fcae96f1b3e8e19cde47bc9dfa16641e7fcae8c18cbbe8a2911', 6),  -- +234 809 112 8831
(3, 'f0b240090219cde47bc9dfa16641e7fcae8c18cbbe8a29d5d6c8b988310fcae2', 25); -- +234 812 400 9021
```

### 2. Device Fingerprints (`devices`)
Establish unique devices to evaluate fingerprint repetition checks:
```sql
INSERT INTO devices (id, fingerprint_hash) VALUES
(1, 'dev_fp_ios_safari_wuse_abuja'),
(2, 'dev_fp_android_chrome_garki_abuja'),
(3, 'dev_fp_ios_safari_oshodi_lagos'),
(4, 'dev_fp_android_chrome_kano_market'),
(5, 'dev_fp_windows_edge_ikeja_mall');
```

### 3. Verification Sessions (`verification_sessions`)
Generate historic data spanning the last week for the producer volume chart and recent scan streams:
```sql
INSERT INTO verification_sessions (id, qr_code_id, consumer_id, device_id, ip_country, result, risk_score, created_at) VALUES
-- Genuine scans
(1, 1, 1, 'dev_fp_ios_safari_wuse_abuja', 'Nigeria, Abuja, Wuse', 'genuine', 0.05, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(2, 1, 1, 'dev_fp_ios_safari_oshodi_lagos', 'Nigeria, Lagos, Oshodi', 'genuine', 0.05, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3, 2, 2, 'dev_fp_windows_edge_ikeja_mall', 'Nigeria, Lagos, Ikeja', 'genuine', 0.10, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
-- Re-scans / Warnings
(4, 1, 1, 'dev_fp_android_chrome_garki_abuja', 'Nigeria, Abuja, Garki', 'previously_verified', 0.45, DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
(5, 1, 3, 'dev_fp_android_chrome_garki_abuja', 'Nigeria, Abuja, Garki', 'previously_verified', 0.60, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
-- High Risk / Threat scans
(6, 2, 2, 'dev_fp_android_chrome_kano_market', 'Nigeria, Kano City', 'suspicious', 0.75, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(7, 2, 2, 'dev_fp_android_chrome_kano_market', 'Nigeria, Kano City', 'high_risk', 0.92, DATE_SUB(NOW(), INTERVAL 2 DAY));
```

### 4. Consumer Fraud Reports (`reports`)
Seed complaints linked to products and consumers to populate report feeds:
```sql
INSERT INTO reports (id, qr_code_id, consumer_id, description, retailer_name, retailer_location, status, created_at) VALUES
(1, 1, 1, 'The packaging seal looks completely different from the one I bought last month. The serum color is also yellow instead of clear.', 'VeeCare Pharmacy', 'Wuse II, Abuja', 'pending', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 2, 2, 'The QR code was printed on a generic sticker pasted over the packaging box. The merchant insisted it was original.', 'Market Stall 4', 'Kano Main Market', 'pending', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 1, 3, 'Bought it from an Instagram page. Smells like baby oil and the verification page threw a warning.', 'Online IG Vendor', 'Lagos (Instagram)', 'investigating', DATE_SUB(NOW(), INTERVAL 2 DAY));
```

### 5. Threat Events (`fraud_events`)
Establish fraud signals parsed by the risk engine to populate alerts lists:
```sql
INSERT INTO fraud_events (id, verification_session_id, signal_type, severity, resolved_by, resolved_at, created_at) VALUES
(1, 4, 'impossible_travel', 'high', NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(2, 5, 'tampered_token', 'critical', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 6, 'impossible_travel', 'high', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 7, 'device_mismatch', 'medium', 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 DAY));
```

### 6. Audit Trail Logs (`audit_logs`)
Seed operations logs to test the platform audit trails page:
```sql
INSERT INTO audit_logs (id, actor_user_id, action, target_entity, target_id, created_at) VALUES
(1, 2, 'Plan Upgrade', 'producers', 2, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 2, 'Tenant Suspended', 'producers', 3, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(3, 1, 'Batch Created', 'batches', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 2, 'Feature Flag Update', 'settings', 99, DATE_SUB(NOW(), INTERVAL 2 DAY));
```
