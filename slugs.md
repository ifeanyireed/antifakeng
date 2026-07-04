# AntiFakeNG Site Slugs Map

This document outlines the complete routing table and slugs structure for the AntiFakeNG Next.js web application.

## 🔑 Public & Onboarding Routes

| Slug | Page Description | Source File |
|---|---|---|
| `/` | Root portal (Dynamic redirection to login/verify) | [app/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/page.tsx) |
| `/login` | Authentication portal for Producers & Administrators | [app/login/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/login/page.tsx) |
| `/register` | Manufacturer/Producer onboarding account registration | [app/register/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/register/page.tsx) |
| `/onboarding` | Post-registration wizard for brand detail configuration | [app/onboarding/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/onboarding/page.tsx) |

---

## 🔍 Consumer Verification Space

| Slug | Page Description | Source File |
|---|---|---|
| `/verify/[token]` | Dynamic QR code verification page (e.g. `/verify/9F3C-71AE`) | [app/verify/[token]/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/verify/[token]/page.tsx) |
| `/consumer` | Manual consumer lookup and check page | [app/consumer/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/consumer/page.tsx) |

---

## 🏭 Producer Dashboard Space

All producer routes run under the `ProducerLayout` shell template.

| Slug | Page Description | Source File |
|---|---|---|
| `/producer/dashboard` | Main metrics overview, catalog counts, and charts | [app/producer/dashboard/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/dashboard/page.tsx) |
| `/producer/products` | Registered SKU catalog management and image uploads | [app/producer/products/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/products/page.tsx) |
| `/producer/batches` | Production batches, code counts, and vector PDF layouts | [app/producer/batches/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/batches/page.tsx) |
| `/producer/alerts` | Batch-level fraud events and danger levels | [app/producer/alerts/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/alerts/page.tsx) |
| `/producer/history` | Log of individual consumer authentication scans | [app/producer/history/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/history/page.tsx) |
| `/producer/reports` | Catalog of consumer feedback reports regarding fakes | [app/producer/reports/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/reports/page.tsx) |
| `/producer/notifications` | Alert warnings and system update feeds | [app/producer/notifications/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/notifications/page.tsx) |
| `/producer/profile` | Settings panel for company logo, security, and subscription | [app/producer/profile/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/producer/profile/page.tsx) |

---

## 🛡️ SaaS Global Admin Space

All administrative routes run under the `AdminLayout` console shell.

| Slug | Page Description | Source File |
|---|---|---|
| `/admin/dashboard` | Platform metrics, overall scan counts, and active licenses | [app/admin/dashboard/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/dashboard/page.tsx) |
| `/admin/producers` | Manage registered tenant brand profiles and statuses | [app/admin/producers/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/producers/page.tsx) |
| `/admin/fraud` | Cross-tenant fraud alerts and global security metrics | [app/admin/fraud/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/fraud/page.tsx) |
| `/admin/logs` | Comprehensive system-wide user audit trails | [app/admin/logs/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/logs/page.tsx) |
| `/admin/notifications` | Global SaaS administration alerts and syncing updates | [app/admin/notifications/page.tsx](file:///Volumes/ReedBreedCC/ahnara/antifake/web-app/src/app/admin/notifications/page.tsx) |
