import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySignedVCard } from '@/lib/vcard-signing';
import { safeSignatureAudit } from '@/lib/security-audit-redaction';

const MAX_SCANS_PER_MINUTE = Number(process.env.VCARD_MAX_SCANS_PER_MINUTE || 15);
const WINDOW_MS = 60 * 1000;
const REQUIRE_VCARD_SIGNATURE = process.env.REQUIRE_VCARD_SIGNATURE === 'true';

export function verifyVCardSignature(vcardId: string, signature?: string | null) {
    if (!signature) return !REQUIRE_VCARD_SIGNATURE;
    return verifySignedVCard(vcardId, signature);
}

function extractIp(req: Request) {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown-ip';
}

async function isRateLimitedByRecentScans(ip: string) {
    const recentWindow = new Date(Date.now() - WINDOW_MS);
    const recentCount = await prisma.scan.count({
        where: {
            ipAddress: ip,
            scannedAt: { gte: recentWindow },
            // Exclude click events so QR visit protection remains meaningful.
            NOT: { scanMethod: { startsWith: 'click_' } },
        },
    });

    return recentCount >= MAX_SCANS_PER_MINUTE;
}

export async function securityCheck(req: Request, vcardId?: string) {
    // 1. IP extraction
    const ip = extractIp(req);

    // 2. Rate Limiting (Anti-Scraping / Anti-DoS mass cloning) based on recent persisted scans
    try {
        const rateLimited = await isRateLimitedByRecentScans(ip);
        if (rateLimited) {
            console.warn('[SECURITY] Public profile rate limit exceeded');
            return {
                allowed: false,
                response: NextResponse.json({
                    error: 'Demasiadas solicitudes detectadas desde su red. Por seguridad táctica anti-clonación, acceso temporalmente bloqueado.'
                }, { status: 429 }),
                ip
            };
        }
    } catch (err) {
        // If rate limiting check fails, continue with signature checks to avoid hard outages.
        console.error('[SECURITY] Rate limiting check failed:', err);
    }

    // 3. HMAC Verification (Anti-Clonación Criptográfica Básica)
    // If the URL has a '?sig=' parameter, we verify it against our NEXTAUTH_SECRET.
    const { searchParams } = new URL(req.url);
    const signature = searchParams.get('sig');

    // Exigir firma en Producción/Fase 6:
    // Si vcardId existe significa que el usuario armó la VCard URL. Verificamos si la falsificó.
    if (vcardId && !signature && REQUIRE_VCARD_SIGNATURE) {
        await prisma.auditLog.create({
            data: {
                userId: 'SYSTEM',
                action: 'SECURITY_ALERT',
                entityName: 'VCard',
                entityId: vcardId,
                details: JSON.stringify(safeSignatureAudit('SIGNATURE_REQUIRED')),
                ipAddress: ip,
            }
        }).catch(console.error);

        return {
            allowed: false,
            response: NextResponse.json({
                error: 'Firma de seguridad requerida para esta vCard.'
            }, { status: 403 }),
            ip
        };
    }

    if (vcardId && signature) {
        const secret = process.env.VCARD_SIGNING_SECRET || process.env.NEXTAUTH_SECRET || process.env.VCARD_LEGACY_SIGNING_SECRET;
        if (!secret) {
            console.error('[SECURITY] NEXTAUTH_SECRET is not configured.');
            return {
                allowed: false,
                response: NextResponse.json({ error: 'Server security configuration error.' }, { status: 500 }),
                ip
            };
        }
        if (!verifyVCardSignature(vcardId, signature)) {
            console.warn('[SECURITY] Invalid QR signature rejected');

            await prisma.auditLog.create({
                data: {
                    userId: 'SYSTEM',
                    action: 'SECURITY_ALERT',
                    entityName: 'VCard',
                    entityId: vcardId,
                    details: JSON.stringify(safeSignatureAudit('HMAC_MISMATCH')),
                    ipAddress: ip
                }
            }).catch(console.error);

            return {
                allowed: false,
                response: NextResponse.json({
                    error: 'Firma de Seguridad QR Inválida. Posible Tarjeta Clonada o Manipulada.'
                }, { status: 403 }),
                ip
            };
        }
    }

    return { allowed: true, ip };
}
