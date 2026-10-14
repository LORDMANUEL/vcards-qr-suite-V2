# vCard Functional Documentation

Date: 2026-03-17
Scope: vCard public area only

## 1. Purpose

The vCard module exposes a public contact page backed by QR code access and tracks interaction events for operational analytics.

This document defines the functional behavior currently implemented and validated for:
- Public vCard page rendering
- vCard `.vcf` download
- Scan tracking
- Action click tracking
- Theme resolution and fallback behavior

## 2. Active Runtime Components

Primary runtime paths:
- `app/vcard/[id]/page.tsx`
- `app/vcard/[id]/client-page.tsx`
- `app/components/vcard-theme-runtime.tsx`

Primary APIs:
- `GET /api/vcard/[id]`
- `GET /api/vcard/[id]/download`
- `POST /api/vcards/scans`
- `POST /api/vcards/click`

Supporting libraries:
- `lib/security.ts`
- `lib/geolocation.ts`
- `lib/qr-generator.ts`

## 3. Public Flow

Entry flow:
1. User opens `/vcard/{qrCodeData}` with optional `?sig=` signature.
2. Server component requests `GET /api/vcard/{qrCodeData}` with forwarded request context.
3. API validates security controls and returns `{ vcard, activeGlobalTheme }`.
4. Client renders theme layout and interaction controls.
5. Client records a scan with `POST /api/vcards/scans`.

Interaction flow:
- Call button: triggers `click_tel` tracking and opens `tel:` URI.
- Email button: triggers `click_email` tracking and opens `mailto:` URI.
- WhatsApp button: triggers `click_wa` tracking and opens `https://wa.me/...`.
- Share button: uses native share API or clipboard fallback.
- Download button: calls `GET /api/vcard/{id}/download` and stores `.vcf` file.

## 4. Data Contracts

### 4.1 `GET /api/vcard/[id]`

Success response:
- `vcard.id`
- `vcard.user.{name,position,email,phone,photoUrl,website}`
- `vcard.branch.{companyName,name,address,logoUrl,primaryColor,secondaryColor,theme,vcardTheme,seasonalVcardTheme,company}`
- `vcard.downloadCount`
- `vcard.updatedAt`
- `activeGlobalTheme`

Error responses:
- `404`: `vCard no encontrada`
- `403`: signature/security errors
- `429`: rate limit exceeded
- `500`: internal error

### 4.2 `GET /api/vcard/[id]/download`

Behavior:
- Finds vCard by `qrCodeData`
- Increments `downloadCount` by 1
- Returns `text/vcard` payload

Output headers:
- `Content-Type: text/vcard`
- `Content-Disposition: attachment; filename="{name}.vcf"`

### 4.3 `POST /api/vcards/scans`

Input body:
- `vcardId: string`
- `scanMethod?: 'QR' | 'MANUAL' | 'DIRECT'`

Behavior:
- Validates vCard existence
- Applies persisted anti-duplicate / anti-spam checks by IP and time window
- Resolves `deviceType` and geolocation data
- Creates `Scan` record

Output:
- `200 { success: true, scan }`
- `200 { success: true, rateLimited: true }` when duplicate/rate-limited
- `400` invalid payload
- `404` vCard missing

### 4.4 `POST /api/vcards/click`

Input body:
- `vcardId: string`
- `actionType: 'tel' | 'email' | 'wa' | 'download' | 'share' | 'sms' | 'web' | 'link' | 'location'`

Behavior:
- Validates vCard existence
- Validates action type against allow-list
- Creates `Scan` event with `scanMethod = click_{actionType}`

Output:
- `200 { success: true }`
- `400` invalid payload/action
- `404` vCard missing

## 5. Theme Resolution Rules

Theme precedence in runtime:
1. `branch.seasonalVcardTheme` (if active and in date window)
2. `branch.vcardTheme`
3. `branch.company.seasonalVcardTheme` (if active and in date window)
4. `branch.company.defaultVcardTheme`
5. `activeGlobalTheme`
6. `branch.theme` (legacy fallback)

Color fallback:
- `theme.colors.primary` -> `branch.primaryColor` -> `#003478`
- `theme.colors.secondary` -> `branch.secondaryColor` -> `#FFFFFF`
- `theme.colors.accent` -> `#10B981`

## 6. Security and Quality Controls Applied

Current controls:
- Optional HMAC signature verification in `securityCheck`
- Configurable signature requirement via `REQUIRE_VCARD_SIGNATURE=true`
- Persisted anti-spam/rate checks in scans endpoint
- Rate checks in security layer using recent persisted scan activity
- Input allow-list for click action types
- `.vcf` sanitization to prevent malformed export values
- Build validation passing locally and in production after deployment

## 7. Known Residual Items

Non-blocking residual items for vCard area:
- Distributed global rate limiting still depends on database checks, not Redis quotas.
- Signature requirement is configurable and may still be permissive if env is unset.
- Geolocation depends on third-party provider availability.
- Full local smoke automation requires running PostgreSQL in the local workstation.

## 8. Validation Evidence (Latest)

Local:
- `npm run build` succeeded after vCard stabilization.

Production (`/home/yc/vcard-system`, port `9301`):
- Build succeeded.
- Service process running and listening on `9301`.
- Functional temporary validation:
  - public page response `200`
  - download response `200`
  - download payload includes `BEGIN:VCARD` and `END:VCARD`
  - `downloadCount` increments on download
  - scan tracking and click tracking recorded separately

## 9. Handover Status

vCard public area is operational and documented enough to move focus to the Portales area, keeping only residual hardening tasks as a short maintenance backlog.
