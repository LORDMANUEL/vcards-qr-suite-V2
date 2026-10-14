#!/usr/bin/env node
// Script to update AP timeLimit and show sessions

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const action = process.argv[2];

  if (action === 'set-time') {
    const minutes = parseInt(process.argv[3] || '2');
    // Update ALL access points to the given time limit
    const result = await p.accessPoint.updateMany({
      data: { timeLimit: minutes }
    });
    console.log(`Updated ${result.count} access point(s) to ${minutes} minute(s).`);
    
    // Also update PENDING/AUTHORIZED sessions not yet expired
    const sessions = await p.portalSession.updateMany({
      where: { status: 'AUTHORIZED' },
      data: { timeLimit: minutes }
    });
    console.log(`Updated ${sessions.count} active session(s) timeLimit to ${minutes} min.`);

  } else if (action === 'show-aps') {
    const aps = await p.accessPoint.findMany({
      select: { id: true, name: true, identifier: true, timeLimit: true, providerType: true, radiusNasId: true }
    });
    console.log('\n=== ACCESS POINTS ===');
    console.log(JSON.stringify(aps, null, 2));

  } else if (action === 'show-sessions') {
    const sessions = await p.portalSession.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, macAddress: true, status: true, timeLimit: true, authorizedAt: true, expiresAt: true, name: true }
    });
    console.log('\n=== RECENT PORTAL SESSIONS ===');
    console.log(JSON.stringify(sessions, null, 2));

  } else if (action === 'expire-now') {
    const { expirePortalSessions } = require('./lib/captive');
    const count = await expirePortalSessions();
    console.log(`Expired ${count} session(s).`);

  } else {
    console.log('Usage: node portal_admin.js [set-time <minutes>|show-aps|show-sessions|expire-now]');
  }
}

main().catch(console.error).finally(() => p.$disconnect());
