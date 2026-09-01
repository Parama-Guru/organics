import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { loadConfig } from "@conf/config";
import { prisma } from "./prisma";
import { getRedis, redisKey } from "./redis";
import {
  dropSession,
  dropSessionStrict,
  newSessionId,
  putSession,
  readSession,
} from "./session-store";

export const FARMER_COOKIE = "organics_farmer";
export const FARMER_PORTAL = "/pannai";

const SESSION_TTL_SECONDS = 12 * 3600;
const INVITE_TTL_SECONDS = 7 * 86_400;

function secret(): string {
  // Reuses the admin signing secret: both are staff-side credentials and the
  // portal is meaningless without an admin to grant access in the first place.
  return loadConfig().admin.session_secret;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function unsign(raw: string | undefined): string | null {
  if (!raw) return null;
  const index = raw.lastIndexOf(".");
  if (index <= 0) return null;

  const id = raw.slice(0, index);
  const provided = Buffer.from(raw.slice(index + 1));
  const expected = Buffer.from(sign(id));
  if (provided.length !== expected.length) return null;
  return timingSafeEqual(provided, expected) ? id : null;
}

/** False when nothing is configured, so the portal stays shut by default. */
export function farmerPortalEnabled(): boolean {
  return secret().length >= 32;
}

export type SignedInFarmer = {
  id: string;
  slug: string;
  farmName: string;
  contactName: string;
  email: string;
};

export async function startFarmerSession(
  farmerId: string,
  portalSessionVersion: number,
): Promise<void> {
  const { app } = loadConfig();
  const id = newSessionId();
  await putSession(
    id,
    { customerId: farmerId, createdAt: Date.now(), sessionVersion: portalSessionVersion },
    SESSION_TTL_SECONDS,
  );

  const jar = await cookies();
  jar.set(FARMER_COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: new URL(app.site_url).protocol === "https:",
    // Scoped to the portal, so the cookie is never sent with a public page request.
    path: FARMER_PORTAL,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endFarmerSession(): Promise<void> {
  const jar = await cookies();
  const id = unsign(jar.get(FARMER_COOKIE)?.value);
  if (id) await dropSessionStrict(id);
  jar.delete({ name: FARMER_COOKIE, path: FARMER_PORTAL });
}

/**
 * The signed-in farm, or null.
 *
 * Read through to the database every request and re-check status and portal
 * access: a suspended farm or a revoked login has to take effect at once, not
 * whenever the session happens to expire.
 */
export async function getFarmer(): Promise<SignedInFarmer | null> {
  if (!farmerPortalEnabled()) return null;

  const jar = await cookies();
  const id = unsign(jar.get(FARMER_COOKIE)?.value);
  if (!id) return null;

  const record = await readSession(id);
  if (!record) return null;

  const farmer = await prisma.farmer.findFirst({
    where: {
      id: record.customerId,
      status: "VERIFIED",
      portalEnabledAt: { not: null },
      passwordHash: { not: null },
    },
    select: {
      id: true,
      slug: true,
      farmName: true,
      contactName: true,
      email: true,
      portalSessionVersion: true,
    },
  });

  if (!farmer || record.sessionVersion !== farmer.portalSessionVersion) {
    await dropSession(id);
    return null;
  }
  const { portalSessionVersion, ...safe } = farmer;
  void portalSessionVersion;
  return safe;
}

// ---- one-time invite, so a password is never chosen by anyone but the farmer --

/**
 * Keyed by farm, not by token.
 *
 * Keying by token hash meant every link ever issued stayed live for seven days
 * at once, with nothing on screen to say one was outstanding and no way to
 * cancel it. Storing the current token's digest under the farm's own key means
 * issuing a new invite silently retires the previous one, and cancelling is a
 * single delete.
 */
function inviteKey(farmerId: string): string {
  return redisKey("farmer-invite", farmerId);
}

function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const inviteMemory = new Map<string, { tokenHash: string; expiresAt: number }>();

export async function issueFarmerInvite(farmerId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const redis = getRedis();

  if (redis) {
    await redis.set(inviteKey(farmerId), digest(token), "EX", INVITE_TTL_SECONDS);
  } else {
    inviteMemory.set(inviteKey(farmerId), {
      tokenHash: digest(token),
      expiresAt: Date.now() + INVITE_TTL_SECONDS * 1000,
    });
  }

  return token;
}

export async function cancelFarmerInvite(farmerId: string): Promise<void> {
  const redis = getRedis();
  if (redis) await redis.del(inviteKey(farmerId));
  else inviteMemory.delete(inviteKey(farmerId));
}

/** Whether a link is still live, without consuming it. */
export async function inviteIsOutstanding(farmerId: string): Promise<boolean> {
  const key = inviteKey(farmerId);
  const redis = getRedis();

  if (redis) return (await redis.exists(key).catch(() => 0)) === 1;

  const entry = inviteMemory.get(key);
  return Boolean(entry && entry.expiresAt > Date.now());
}

/** Validate the exact token without consuming it; used before showing the form. */
export async function farmerInviteMatches(
  farmerId: string,
  token: string,
): Promise<boolean> {
  const key = inviteKey(farmerId);
  const redis = getRedis();
  let stored: string | null | undefined;
  if (redis) {
    stored = await redis.get(key);
  } else {
    const entry = inviteMemory.get(key);
    stored = entry && entry.expiresAt > Date.now() ? entry.tokenHash : null;
  }
  if (!stored) return false;
  const provided = Buffer.from(digest(token));
  const expected = Buffer.from(stored);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/** The same question for a page full of farms, in one round trip. */
export async function inviteStates(farmerIds: string[]): Promise<Set<string>> {
  const live = new Set<string>();
  if (farmerIds.length === 0) return live;

  const redis = getRedis();
  if (redis) {
    const found = await redis
      .mget(farmerIds.map(inviteKey))
      .catch(() => farmerIds.map(() => null));
    farmerIds.forEach((id, index) => {
      if (found[index]) live.add(id);
    });
    return live;
  }

  const now = Date.now();
  for (const id of farmerIds) {
    const entry = inviteMemory.get(inviteKey(id));
    if (entry && entry.expiresAt > now) live.add(id);
  }
  return live;
}

/** Single use: atomically consumes only the exact matching token. */
export async function consumeFarmerInvite(
  farmerId: string,
  token: string,
): Promise<boolean> {
  const key = inviteKey(farmerId);
  const redis = getRedis();

  let stored: string | null | undefined;
  if (redis) {
    stored = (await redis.eval(
      "local v=redis.call('GET',KEYS[1]); if v and v==ARGV[1] then redis.call('DEL',KEYS[1]); return v; end; return nil",
      1,
      key,
      digest(token),
    )) as string | null;
  } else {
    const entry = inviteMemory.get(key);
    stored = entry && entry.expiresAt > Date.now() ? entry.tokenHash : null;
    if (stored === digest(token)) inviteMemory.delete(key);
  }

  if (!stored) return false;

  // Compared as digests of equal length, so a wrong token cannot be narrowed
  // down by timing.
  const provided = Buffer.from(digest(token));
  const expected = Buffer.from(stored);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
