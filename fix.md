# Fix Plan: Remove All Hardcodings & Connect to Zoho Catalyst

> Audit of the current CrimeIntel codebase — every hardcoded value, fake metric, mock data source, and missing translation identified. Each item has a concrete fix path using real Zoho Catalyst services (Data Store, Signals, Cache, Mail, Push).

---

## 1. CrimeTrendChart — Hardcoded Stats Panel

**File:** [`CrimeTrendChart.tsx`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/components/charts/CrimeTrendChart.tsx)

### 1a. Accuracy: `94.2%` (hardcoded)
- **Line 174:** `94.2` is baked directly into JSX
- **Line 176:** `w-[94.2%]` CSS class is hardcoded to match
- **Fix:** Compute accuracy from the trend API response. The `/api/analytics/trend` route already calculates `baseline` vs `telemetry` — derive accuracy as `% of months where telemetry was within ±20% of baseline` (or whatever business rule makes sense). Return `accuracy` in the API JSON. Bind both the number and the progress bar width to this value dynamically via inline style.

### 1b. Threat Index: Always shows `CRITICAL` + `Sector 4 Anomaly`
- **Line 186:** Always renders `t('dashboard.critical')` regardless of actual state
- **Line 188:** Always renders `t('chart.sectorAnomaly')` — refers to a non-existent "Sector 4"
- **Fix:** The `/api/analytics/trend` route already marks anomalies. Return a `threatLevel` (`NORMAL` | `ELEVATED` | `CRITICAL`) and `threatDetail` string from the API based on actual anomaly count/severity. Render conditionally.

### 1c. Node Status: Hardcoded `SYS-CORE`, `PREDICTIVE`, `CCTV-LINK`
- **Lines 199–202:** Static array of 3 nodes with hardcoded statuses (`ONLINE`, `SYNCING`)
- **Fix:** Create a `/api/system/health` endpoint that pings actual Catalyst services:
  - **SYS-CORE** → `getCatalystApp()` health check (Catalyst Data Store connectivity)
  - **PREDICTIVE** → Check if prediction APIs (`/api/predictions/hotspot`, `/api/predictions/anomaly`) respond within timeout
  - **CCTV-LINK** → Check Catalyst SmartBrowz or external CCTV integration status
- Return real statuses. Display from API response.

---

## 2. Map API — Hardcoded Stations, Fake Officers & Trends

**File:** [`/api/analytics/map/route.ts`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/app/api/analytics/map/route.ts)

### 2a. Station list is hardcoded (lines 11–17)
```ts
const stations = [
  { id: "DIST_1", name: "Bengaluru Urban", lat: 12.9716, lng: 77.5946 },
  { id: "DIST_2", name: "Mysuru", lat: 12.2958, lng: 76.6394 },
  ...
];
```
- **Fix:** Create a `Districts` or `PoliceStations` table in Catalyst Data Store with columns: `id`, `name`, `name_kn`, `latitude`, `longitude`, `zone`, `division`. Seed with actual Karnataka police station data. Fetch via `DataClient.getDistricts()` at runtime.

### 2b. Officers count is a formula: `Math.round(activeCases * 3.5)` (line 39)
- **Fix:** Add an `officers_deployed` column to the Districts table in Catalyst, populated by the admin data loader or manually. Read from DB.

### 2c. Trend is a simple threshold: `activeCases > 150 ? "up" : "down"` (line 40)
- **Fix:** Compare current month's FIR count against previous month's count for each district. Compute actual percentage change. Return real `trend` and `trendValue`.

### 2d. trendValue is hardcoded: `"+12%"` or `"-4%"` (line 41)
- **Fix:** Same as 2c — compute from real month-over-month delta.

---

## 3. LiveMap — Missing Translations Rendering as Raw Keys

**File:** [`LiveMap.tsx`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/components/dashboard/LiveMap.tsx)

### 3a. `map.spot.DIST_1.name` — renders as raw key (visible in screenshot)
- **Line 178:** `t(\`map.spot.${selectedSpot.id}.name\`)` — these translation keys do NOT exist in `translations.ts`
- **Fix:** Don't use translation keys for dynamic DB data. Use `selectedSpot.name` directly (already available from the API response). For Kannada, add a `name_kn` field to the Districts Catalyst table and return both from the API. Use the language context to pick the right one.

### 3b. `map.spot.DIST_1.alert` — renders as raw key (visible in screenshot)
- **Line 231:** `t(\`map.spot.${selectedSpot.id}.alert\`)` — these keys also don't exist
- **Fix:** Use `selectedSpot.recentAlert` from the API. The API already returns this string (`Active monitoring of X cases.`), but it's not being used because the component tries to translate a non-existent key instead.

### 3c. `location.DIST_1` — renders as `LOCATION.DIST_1` in LiveEventFeed
- **File:** [`LiveEventFeed.tsx`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/components/dashboard/LiveEventFeed.tsx) lines 59, 115
- `t(\`location.${evt.location}\`)` — no `location.*` keys exist in translations
- **Fix:** The event payload already includes `location` as a district name string. Use it directly. For Kannada, enrich the event payload from the API side with `location_kn` using the Districts Catalyst table.

### 3d. ExplainabilityBadge has hardcoded props (lines 222–226)
```ts
confidence: 85,
dataSources: ["Dispatch Logs", "Historical FIRs (Last 30 Days)"],
mechanism: "Predictive spatial modeling..."
```
- **Fix:** Return these from the `/api/analytics/map` route, computed per-district. Confidence can be derived from the risk scoring function. Data sources should reflect what was actually queried.

---

## 4. Live Event Feed — Simulated Events, Not Real

**File:** [`/api/events/route.ts`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/app/api/events/route.ts)

### 4a. Events are randomly generated every 15 seconds from cached data
- **Lines 19–67:** `Math.random()` picks random FIRs/Cases to simulate events
- **Fix:** Replace with **Catalyst Signals** subscription. The `CatalystSignals` wrapper already exists in [`signals.ts`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/lib/catalyst/signals.ts). Instead of randomly generating, subscribe to the `crimeintel_events` topic and stream real events. When a new FIR is actually created (via data loader or upload), publish a real `FIR_CREATED` signal. The SSE endpoint should relay actual signals, not simulations.

### 4b. Module-level `cachedFIRs`/`cachedCases` stale cache (lines 7–8)
- **Fix:** Remove entirely once we switch to real Catalyst Signals. If polling is still needed as fallback, use Catalyst Cache with TTL instead of module-level variables.

---

## 5. Notification Center — Entirely Hardcoded

**File:** [`NotificationCenter.tsx`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/components/layout/NotificationCenter.tsx)

### 5a. All notifications are hardcoded (lines 30–58)
```ts
const initialNotifications: Notification[] = [
  { id: "n1", type: "CRITICAL", title: "notifications.n1.title", ... },
  { id: "n2", type: "WARNING", ... },
  { id: "n3", type: "INFO", ... },
];
```
- **Fix:** Create a `Notifications` table in Catalyst Data Store (`id`, `type`, `title`, `message`, `target_user_id`, `read`, `link`, `created_at`). Create a `/api/notifications` endpoint to fetch notifications for the current user. When anomalies or alerts fire, insert real notifications into this table. Use **Catalyst Push** ([`push.ts`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/lib/catalyst/push.ts)) to deliver them.

### 5b. `link: "/cases/CASE_2025_089"` points to a potentially non-existent case
- **Fix:** Links should be generated dynamically when the notification is created, referencing actual case/FIR IDs from the database.

---

## 6. EarlyWarningSection — Hardcoded English Strings

**File:** [`EarlyWarningSection.tsx`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/components/dashboard/EarlyWarningSection.tsx)

| Line | Hardcoded Text | Fix |
|------|---------------|-----|
| 74 | `View All` | Use `t('dashboard.viewAll')` — key already exists |
| 97 | `Hotspot Escalation: {hotspot.district}` | Use `t('earlyWarning.hotspotEscalation')` with `{district}` placeholder |
| 98 | `MONITOR` badge text | Use `t('earlyWarning.monitor')` |
| 103 | `Risk` label | Use `t('earlyWarning.risk')` |

---

## 7. AlertsDashboard — Hardcoded English Strings

**File:** [`AlertsDashboard.tsx`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/components/alerts/AlertsDashboard.tsx)

| Line | Hardcoded Text | Fix |
|------|---------------|-----|
| 55 | `Critical` badge | Use `t('dashboard.critical')` |
| 56 | `Warning` badge | Use `t('dashboard.warning')` |
| 57 | `Info` badge | Use `t('dashboard.info')` |
| 164 | `No anomalies detected at this time.` | Use `t('earlyWarning.noAnomalies')` |
| 175 | `District Risk Forecast` | Use `t('earlyWarning.districtRiskForecast')` |
| 177 | `Predictive hotspot modeling` | Use `t('earlyWarning.predictiveHotspotModeling')` |
| 186 | `Escalating` badge | Use `t('earlyWarning.escalating')` |
| 191 | `Risk Score` label | Use `t('earlyWarning.riskScore')` |

---

## 8. QuickMLBar — Hardcoded Placeholder

**File:** [`QuickMLBar.tsx`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/components/dashboard/QuickMLBar.tsx)

- **Line 28:** `placeholder="Ask Catalyst QuickML (e.g. 'Show me vehicle thefts in Bengaluru South')"`
- **Fix:** Use `t('dashboard.quickMLPlaceholder')`. Add to both English and Kannada translations.

---

## 9. Catalyst Mail — Hardcoded Email Address

**File:** [`mail.ts`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/lib/catalyst/mail.ts)

- **Line 24:** `from_email: 'alerts@crimeintel.ksp.gov.in'`
- **Fix:** Move to environment variable `CATALYST_ALERT_FROM_EMAIL`. Fallback to a sensible default.

---

## 10. Profiling — Hardcoded Confidence Values

### 10a. [`offender-profiler.ts`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/lib/profiling/offender-profiler.ts) line 284
- `confidence: 85` with comment `// Mock confidence - in production from RCT`
- **Fix:** Compute confidence from actual data completeness (% of fields filled, number of linked FIRs, corroborating evidence count).

### 10b. [`case-manager.ts`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/lib/profiling/case-manager.ts) line 344
- `confidence: 85` hardcoded
- **Fix:** Same approach — derive from data quality metrics.

---

## 11. BehavioralProfile — Hardcoded Labels

**File:** [`BehavioralProfile.tsx`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/components/profiles/BehavioralProfile.tsx)

- **Line 52:** `"Escalating Severity"` — hardcoded English
- **Line 55:** `"De-escalating"` — hardcoded English
- **Fix:** Use translation keys.

---

## 12. ClientProfileHeader — Hardcoded Label

**File:** [`ClientProfileHeader.tsx`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/components/profiles/ClientProfileHeader.tsx)

- **Line 76:** `Risk Score` — hardcoded English
- **Fix:** Use `t('profile.riskScore')`.

---

## Summary: New Catalyst Data Store Tables Needed

| Table | Purpose |
|-------|---------|
| `Districts` | Station/district master data (name, lat, lng, officers_deployed, name_kn) |
| `Notifications` | Real user notifications (replaces hardcoded array) |
| `SystemHealth` *(optional)* | Track service health status for the Node Status panel |

## Summary: New/Modified API Endpoints

| Endpoint | Change |
|----------|--------|
| `GET /api/analytics/trend` | Add `accuracy`, `threatLevel`, `threatDetail` to response |
| `GET /api/analytics/map` | Fetch districts from Catalyst DB; compute real trend/officers |
| `GET /api/events` | Switch from random simulation → Catalyst Signals subscription |
| `GET /api/notifications` | **NEW** — fetch real notifications from Catalyst Data Store |
| `GET /api/system/health` | **NEW** — return real service health statuses |

## Summary: Translation Keys to Add

All hardcoded English strings identified in §6, §7, §8, §11, §12 need corresponding keys in both English and Kannada sections of [`translations.ts`](file:///d:/coding_files/Projects/CrimeIntel/crimeintel/lib/translations.ts).

## Summary: Environment Variables to Add

| Variable | Purpose |
|----------|---------|
| `CATALYST_ALERT_FROM_EMAIL` | Sender email for Catalyst Mail alerts |
