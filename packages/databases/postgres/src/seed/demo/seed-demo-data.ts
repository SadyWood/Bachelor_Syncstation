// packages/databases/src/seed/demo/seed-demo-data.ts
import crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { eq, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { v7 as uuidv7 } from 'uuid';
// Schemas
import { usersSchema } from '../../schema/index.js';
import {
  wsTenants, wsTenantMembers,
  wsRoles, wsUserMemberships,
  contentNodes, contentClosure, mediaKind, mediaAssets,
} from '../../schema/workstation/schema.js';

const { users, invites, platforms, userAccessToPlatform } = usersSchema;

// ──────────────────────────────────────────────────────────────────────────────
// Env / conn helpers
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ADMIN_BASE_ENV = process.env.ADMIN_DATABASE_CONNECTION;
if (!ADMIN_BASE_ENV) {
  throw new Error('Missing ADMIN_DATABASE_CONNECTION in .env');
}
const ADMIN_BASE: string = ADMIN_BASE_ENV;

function adminUrlFor(dbName: 'users' | 'workstation') {
  const u = new URL(ADMIN_BASE);
  u.pathname = `/${dbName}`;
  return u.toString();
}

// ──────────────────────────────────────────────────────────────────────────────
// Demo-konstanter
const STREAMWAVE_CODE = 'streamwave-inc';
const STREAMWAVE_NAME = 'Streamwave Inc';

const DEMO_PLATFORM_ID = 1; // workstation

const INVITEES = [
  { email: 'mathias@hoolsy.com', role: 'Manage' as const },
  { email: 'espen@hoosly.com',   role: 'Viewer' as const },
  { email: 'ew@hoolsy.com',      role: 'Viewer' as const },
];

const ADMIN_USER = {
  email: 'admin@hoolsy.com',
  firstName: 'Francis',
  lastName: 'Knuckles',
  displayName: 'Francis Knuckles',
};

const DEMO_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'demopassword';
const INVITE_EXPIRES_IN_DAYS = Number(process.env.DEMO_INVITE_DAYS || 7);

// ──────────────────────────────────────────────────────────────────────────────
// Utils
async function ensurePlatformRow(db: ReturnType<typeof drizzle>) {
  await db.insert(platforms).values({
    id: 1,
    code: 'workstation',
    title: 'Workstation',
    description: 'Internal productivity platform',
  }).onConflictDoNothing();
}

function randomToken(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

// ──────────────────────────────────────────────────────────────────────────────
// Users + invites
async function ensureUsersAndInvites() {
  const usersPool = new Pool({ connectionString: adminUrlFor('users') });
  const udb = drizzle(usersPool);

  const expiresAt = new Date(Date.now() + (INVITE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000));

  try {
    console.log('→ [users] Ensure platform row …');
    await ensurePlatformRow(udb);

    // Admin (aktiv med passord)
    console.log(`→ [users] Upsert admin user ${ADMIN_USER.email} + set password …`);
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    await udb.insert(users).values({
      id: uuidv7(),
      email: ADMIN_USER.email,
      firstName: ADMIN_USER.firstName,
      lastName: ADMIN_USER.lastName,
      displayName: ADMIN_USER.displayName,
      isActive: true,
      passwordHash,
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        firstName: ADMIN_USER.firstName,
        lastName: ADMIN_USER.lastName,
        displayName: ADMIN_USER.displayName,
        isActive: true,
        passwordHash,
        updatedAt: new Date(),
      },
    });

    const adminRow = await udb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, ADMIN_USER.email))
      .limit(1);
    if (adminRow.length === 0) throw new Error('Admin user not found after upsert');
    const adminUserId = adminRow[0].id;

    await udb.insert(userAccessToPlatform).values({
      userId: adminUserId,
      platformId: DEMO_PLATFORM_ID,
      hasAccess: true,
    }).onConflictDoNothing();

    // Inviterte brukere
    const invited: Array<{ email: string; userId: string; token: string }> = [];

    for (const { email } of INVITEES) {
      console.log(`→ [users] Upsert invited user ${email} …`);
      await udb.insert(users).values({
        id: uuidv7(),
        email,
        isActive: false,
      }).onConflictDoNothing();

      const u = await udb
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (u.length === 0) throw new Error(`Invited user not found: ${email}`);
      const userId = u[0].id;

      const token = randomToken(16);

      await udb.insert(invites).values({
        token,
        email,
        platformId: DEMO_PLATFORM_ID,
        expiresAt,
      }).onConflictDoUpdate({
        target: invites.token,
        set: { email, platformId: DEMO_PLATFORM_ID, expiresAt },
      });

      await udb.insert(userAccessToPlatform).values({
        userId,
        platformId: DEMO_PLATFORM_ID,
        hasAccess: true,
      }).onConflictDoNothing();

      invited.push({ email, userId, token });
    }

    return { adminUserId, invited };
  } finally {
    await usersPool.end();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tenant + memberships
async function ensureTenantAndMemberships(
  adminUserId: string,
  invited: Array<{ email: string; userId: string; token: string }>,
) {
  const wsPool = new Pool({ connectionString: adminUrlFor('workstation') });
  const wdb = drizzle(wsPool);

  try {
    console.log('→ [ws] Ensure tenant Streamwave Inc …');
    const tenantId = uuidv7();
    await wdb.insert(wsTenants).values({
      id: tenantId,
      code: STREAMWAVE_CODE,
      name: STREAMWAVE_NAME,
    }).onConflictDoNothing();

    const tRow = await wdb
      .select({ id: wsTenants.id })
      .from(wsTenants)
      .where(eq(wsTenants.code, STREAMWAVE_CODE))
      .limit(1);
    if (tRow.length === 0) throw new Error('Streamwave tenant not found');
    const resolvedTenantId = tRow[0].id;

    // Hent globale roller (tenantId = null)
    const roles = await wdb
      .select({ roleId: wsRoles.roleId, name: wsRoles.name })
      .from(wsRoles)
      .where(isNull(wsRoles.tenantId));
    const byName = Object.fromEntries(roles.map(r => [r.name, r.roleId] as const));

    const adminRoleId  = byName.Admin;
    const manageRoleId = byName.Manage;
    const viewerRoleId = byName.Viewer;

    if (!adminRoleId || !manageRoleId || !viewerRoleId) {
      throw new Error('Missing one or more global roles (Admin/Manage/Viewer). Run db:seed first.');
    }

    // Admin → active roster + Admin role
    await wdb.insert(wsTenantMembers).values({
      memberId: uuidv7(),
      tenantId: resolvedTenantId,
      userUuid: adminUserId,
      status: 'active',
      addedBy: null,
      inviteToken: null,
      addedAt: new Date(),
      activatedAt: new Date(),
      deactivatedAt: null,
    }).onConflictDoNothing();

    await wdb.insert(wsUserMemberships).values({
      membershipId: uuidv7(),
      userUuid: adminUserId,
      tenantId: resolvedTenantId,
      nodeId: null,
      roleId: adminRoleId,
      customPerms: null,
      createdAt: new Date(),
    }).onConflictDoNothing();

    // Inviterte brukere → pending roster (koblet mot inviteToken) + forhåndstildelt rolle
    for (const { email, userId, token } of invited) {
      const roleName = INVITEES.find(x => x.email === email)?.role || 'Viewer';
      const roleId = roleName === 'Manage' ? manageRoleId : viewerRoleId;

      await wdb.insert(wsTenantMembers).values({
        memberId: uuidv7(),
        tenantId: resolvedTenantId,
        userUuid: userId,
        status: 'pending',
        addedBy: adminUserId,
        inviteToken: token,
        addedAt: new Date(),
        activatedAt: null,
        deactivatedAt: null,
      }).onConflictDoNothing();

      await wdb.insert(wsUserMemberships).values({
        membershipId: uuidv7(),
        userUuid: userId,
        tenantId: resolvedTenantId,
        nodeId: null,
        roleId,
        customPerms: null,
        createdAt: new Date(),
      }).onConflictDoNothing();
    }

    return { tenantId: resolvedTenantId };
  } finally {
    await wsPool.end();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Copy demo video file to uploads directory
function copyDemoVideoFile(tenantId: string, nodeId: string): { storagePath: string; sizeBytes: number } | null {
  try {
    // Source: demo video in timeline package
    const sourceFile = path.resolve(process.cwd(), 'packages/timeline/demo/assets/breaking_bad_pilot_s1e1.mp4');

    if (!fs.existsSync(sourceFile)) {
      console.warn(`⚠️  Demo video not found at: ${sourceFile}`);
      return null;
    }

    // Destination: uploads/media/{tenantId}/{nodeId}/{assetId}-{filename}
    const uploadsDir = path.resolve(process.cwd(), 'apps/api/uploads/media');
    const tenantDir = path.join(uploadsDir, tenantId);
    const nodeDir = path.join(tenantDir, nodeId);

    // Create directories if they don't exist
    fs.mkdirSync(nodeDir, { recursive: true });

    // Generate asset ID and construct filename
    const assetId = uuidv7();
    const filename = 'breaking_bad_pilot_s1e1.mp4';
    const destFilename = `${assetId}-${filename}`;
    const destPath = path.join(nodeDir, destFilename);

    // Copy file
    fs.copyFileSync(sourceFile, destPath);

    // Get file size
    const stats = fs.statSync(destPath);
    const sizeBytes = stats.size;

    // Return relative storage path (from uploads root)
    const relativePath = path.relative(uploadsDir, destPath).replace(/\\/g, '/');

    console.log(`✅ Copied demo video: ${relativePath} (${Math.round(sizeBytes / 1024 / 1024)} MB)`);

    return {
      storagePath: `uploads/media/${relativePath}`,
      sizeBytes,
    };
  } catch (error) {
    console.error('❌ Failed to copy demo video:', error);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Breaking Bad demo content
async function seedBreakingBadProject(tenantId: string) {
  const wsPool = new Pool({ connectionString: adminUrlFor('workstation') });
  const wdb = drizzle(wsPool);

  try {
    console.log('→ [ws] Seeding Breaking Bad project with episodes …');

    // Get media kind IDs
    const mediaKinds = await wdb
      .select({ id: mediaKind.id, kindCode: mediaKind.kindCode })
      .from(mediaKind);
    const kindByCode = Object.fromEntries(mediaKinds.map(k => [k.kindCode, k.id]));

    const episodeKindId = kindByCode.episode_video;
    const trailerKindId = kindByCode.trailer;
    const posterKindId = kindByCode.poster;

    if (!episodeKindId || !trailerKindId || !posterKindId) {
      console.warn('⚠️  Missing media kinds. Skipping Breaking Bad seed.');
      return;
    }

    // Create project root
    const projectId = uuidv7();
    await wdb.insert(contentNodes).values({
      nodeId: projectId,
      tenantId,
      parentId: null,
      nodeType: 'group',
      title: 'Breaking Bad',
      synopsis: 'A chemistry teacher turned methamphetamine manufacturer',
      slug: 'breaking-bad',
      position: 0,
      mediaKindId: null,
      datalakePath: null,
    });

    // Self-closure for project
    await wdb.insert(contentClosure).values({
      ancestorId: projectId,
      descendantId: projectId,
      depth: 0,
    });

    // Season 1
    const season1Id = uuidv7();
    await wdb.insert(contentNodes).values({
      nodeId: season1Id,
      tenantId,
      parentId: projectId,
      nodeType: 'group',
      title: 'SEASON 1',
      position: 0,
    });

    await wdb.insert(contentClosure).values([
      { ancestorId: season1Id, descendantId: season1Id, depth: 0 },
      { ancestorId: projectId, descendantId: season1Id, depth: 1 },
    ]);

    // Season 1 episodes
    const s1Episodes = [
      { title: 'Pilot S1.E1', pos: 0 },
      { title: 'Cat\'s in the Bag... S1.E2', pos: 1 },
      { title: '...And the Bag\'s in the River S1.E3', pos: 2 },
      { title: 'Cancer Man S1.E4', pos: 3 },
      { title: 'Gray Matter S1.E5', pos: 4 },
      { title: 'Crazy Handful of Nothin\' S1.E6', pos: 5 },
      { title: 'A No-Rough-Stuff-Type Deal S1.E7', pos: 6 },
    ];

    let pilotNodeId: string | null = null;

    for (const ep of s1Episodes) {
      const epId = uuidv7();
      await wdb.insert(contentNodes).values({
        nodeId: epId,
        tenantId,
        parentId: season1Id,
        nodeType: 'content',
        title: ep.title,
        position: ep.pos,
        mediaKindId: episodeKindId,
      });

      await wdb.insert(contentClosure).values([
        { ancestorId: epId, descendantId: epId, depth: 0 },
        { ancestorId: season1Id, descendantId: epId, depth: 1 },
        { ancestorId: projectId, descendantId: epId, depth: 2 },
      ]);

      // Save pilot episode ID for media asset creation
      if (ep.pos === 0) {
        pilotNodeId = epId;
      }
    }

    // Copy demo video and create media_asset for Pilot episode
    if (pilotNodeId) {
      console.log('→ [ws] Copying demo video for Pilot episode...');
      const videoFile = copyDemoVideoFile(tenantId, pilotNodeId);

      if (videoFile) {
        await wdb.insert(mediaAssets).values({
          mediaAssetId: uuidv7(),
          tenantId,
          nodeId: pilotNodeId,
          filename: 'breaking_bad_pilot_s1e1.mp4',
          mimeType: 'video/mp4',
          sizeBytes: videoFile.sizeBytes,
          storageProvider: 'local',
          storagePath: videoFile.storagePath,
          status: 'ready',
          hasVideo: true,
          hasAudio: true,
          durationMs: 252000, // 4:12 duration (252 seconds)
          width: 1920,
          height: 1080,
          frameRate: 23.976,
          videoCodec: 'h264',
          audioCodec: 'aac',
          audioChannels: 2,
          audioSampleRate: 48000,
        });
        console.log('✅ Media asset created for Pilot episode');
      }
    }

    // Season 1 Extra
    const s1ExtraId = uuidv7();
    await wdb.insert(contentNodes).values({
      nodeId: s1ExtraId,
      tenantId,
      parentId: season1Id,
      nodeType: 'group',
      title: 'Extra',
      position: 7,
    });

    await wdb.insert(contentClosure).values([
      { ancestorId: s1ExtraId, descendantId: s1ExtraId, depth: 0 },
      { ancestorId: season1Id, descendantId: s1ExtraId, depth: 1 },
      { ancestorId: projectId, descendantId: s1ExtraId, depth: 2 },
    ]);

    const s1Extras = [
      { title: 'Trailer US Version Season 1', kind: trailerKindId, pos: 0 },
      { title: 'Featurette Making of the Pilot', kind: episodeKindId, pos: 1 },
      { title: 'Key Art Poster Season 1', kind: posterKindId, pos: 2 },
      { title: 'Deleted Scenes Collection Season 1', kind: episodeKindId, pos: 3 },
    ];

    for (const extra of s1Extras) {
      const extraId = uuidv7();
      await wdb.insert(contentNodes).values({
        nodeId: extraId,
        tenantId,
        parentId: s1ExtraId,
        nodeType: 'content',
        title: extra.title,
        position: extra.pos,
        mediaKindId: extra.kind,
      });

      await wdb.insert(contentClosure).values([
        { ancestorId: extraId, descendantId: extraId, depth: 0 },
        { ancestorId: s1ExtraId, descendantId: extraId, depth: 1 },
        { ancestorId: season1Id, descendantId: extraId, depth: 2 },
        { ancestorId: projectId, descendantId: extraId, depth: 3 },
      ]);
    }

    // Season 2
    const season2Id = uuidv7();
    await wdb.insert(contentNodes).values({
      nodeId: season2Id,
      tenantId,
      parentId: projectId,
      nodeType: 'group',
      title: 'SEASON 2',
      position: 1,
    });

    await wdb.insert(contentClosure).values([
      { ancestorId: season2Id, descendantId: season2Id, depth: 0 },
      { ancestorId: projectId, descendantId: season2Id, depth: 1 },
    ]);

    // Season 2 episodes
    const s2Episodes = [
      { title: 'Seven Thirty-Seven S2.E1', pos: 0 },
      { title: 'Grilled S2.E2', pos: 1 },
      { title: 'Bit by a Dead Bee S2.E3', pos: 2 },
      { title: 'Down S2.E4', pos: 3 },
      { title: 'Breakage S2.E5', pos: 4 },
      { title: 'Peekaboo S2.E6', pos: 5 },
      { title: 'Negro y Azul S2.E7', pos: 6 },
      { title: 'Better Call Saul S2.E8', pos: 7 },
      { title: '4 Days Out S2.E9', pos: 8 },
      { title: 'Over S2.E10', pos: 9 },
      { title: 'Mandala S2.E11', pos: 10 },
      { title: 'Phoenix S2.E12', pos: 11 },
      { title: 'ABQ S2.E13', pos: 12 },
    ];

    for (const ep of s2Episodes) {
      const epId = uuidv7();
      await wdb.insert(contentNodes).values({
        nodeId: epId,
        tenantId,
        parentId: season2Id,
        nodeType: 'content',
        title: ep.title,
        position: ep.pos,
        mediaKindId: episodeKindId,
      });

      await wdb.insert(contentClosure).values([
        { ancestorId: epId, descendantId: epId, depth: 0 },
        { ancestorId: season2Id, descendantId: epId, depth: 1 },
        { ancestorId: projectId, descendantId: epId, depth: 2 },
      ]);
    }

    // Season 2 Extra
    const s2ExtraId = uuidv7();
    await wdb.insert(contentNodes).values({
      nodeId: s2ExtraId,
      tenantId,
      parentId: season2Id,
      nodeType: 'group',
      title: 'Extra',
      position: 13,
    });

    await wdb.insert(contentClosure).values([
      { ancestorId: s2ExtraId, descendantId: s2ExtraId, depth: 0 },
      { ancestorId: season2Id, descendantId: s2ExtraId, depth: 1 },
      { ancestorId: projectId, descendantId: s2ExtraId, depth: 2 },
    ]);

    const s2Extras = [
      { title: 'Teaser Trailer Season 2', kind: trailerKindId, pos: 0 },
      { title: 'Featurette The Science of Breaking Bad S2', kind: trailerKindId, pos: 1 },
      { title: 'Motion Poster Season 2', kind: posterKindId, pos: 2 },
      { title: 'Gag Reel Season 2', kind: episodeKindId, pos: 3 },
    ];

    for (const extra of s2Extras) {
      const extraId = uuidv7();
      await wdb.insert(contentNodes).values({
        nodeId: extraId,
        tenantId,
        parentId: s2ExtraId,
        nodeType: 'content',
        title: extra.title,
        position: extra.pos,
        mediaKindId: extra.kind,
      });

      await wdb.insert(contentClosure).values([
        { ancestorId: extraId, descendantId: extraId, depth: 0 },
        { ancestorId: s2ExtraId, descendantId: extraId, depth: 1 },
        { ancestorId: season2Id, descendantId: extraId, depth: 2 },
        { ancestorId: projectId, descendantId: extraId, depth: 3 },
      ]);
    }

    console.log('✅ Breaking Bad project seeded successfully');
  } finally {
    await wsPool.end();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Entry
export async function seedDemoAll() {
  if (!/^true$/i.test(process.env.SEED_DEMO_OK || '')) {
    throw new Error('Demo seed blocked. Set SEED_DEMO_OK=true to allow.');
  }

  console.log('────────────────────────────────────────────────────────');
  console.log('Demo seed: Streamwave Inc + users + invites + memberships');
  console.log('────────────────────────────────────────────────────────');

  const { adminUserId, invited } = await ensureUsersAndInvites();
  const { tenantId } = await ensureTenantAndMemberships(adminUserId, invited);

  await seedBreakingBadProject(tenantId);

  console.log('────────────────────────────────────────────────────────');
  console.log('Done.');
  console.log(`Tenant:      ${STREAMWAVE_NAME} (${tenantId})`);
  console.log(`Admin user:  ${ADMIN_USER.email} (${adminUserId}) → role=Admin`);
  for (const i of invited) {
    const roleName = INVITEES.find(x => x.email === i.email)?.role || 'Viewer';
    console.log(`Invited:     ${i.email}  token=${i.token}  role=${roleName}`);
  }
}
