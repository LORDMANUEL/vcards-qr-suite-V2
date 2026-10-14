#!/usr/bin/env bash
set -euo pipefail

# Legacy helper retained for reference. It deliberately requires externally
# supplied secrets and must never be used against production without approval.
: "${VCARD_DB_PASSWORD:?Set VCARD_DB_PASSWORD in the environment}"
: "${NEXTAUTH_SECRET:?Set NEXTAUTH_SECRET in the environment}"
: "${NEXTAUTH_URL:?Set NEXTAUTH_URL in the environment}"
: "${NEXT_PUBLIC_PORTAL_BASE_URL:?Set NEXT_PUBLIC_PORTAL_BASE_URL in the environment}"

echo "This legacy deployment helper is not approved for production automation."
echo "Use a reviewed deployment runbook and an isolated database instead."
exit 1

