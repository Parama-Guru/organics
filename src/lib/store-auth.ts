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

export const STORE_COOKIE = "organics_store";
export const STORE_PORTAL = "/kadai";

const SESSION_TTL_SECONDS = 12 * 3600;
const INVITE_TTL_SECONDS = 7 * 86_400;

function secret(): string {
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

/** False when no staff signing secret exists, so the portal stays shut by default. */
export function storePortalEnabled(): boolean {
  return secret().length >= 32;
}

export type SignedInStore = {
  id: string;
  slug: string;
  storeName: string;
  contactName: string;
  email: string;
};

export async function startStoreSession(
  storeId: string,
  portalSessionVersion: number,
): Promise<void> {
  const { app } = loadConfig();
  const id = newSessionId();
  await putSession(
    id,
    { customerId: storeId, createdAt: Date.now(), sessionVersion: portalSessionVersion },
    SESSION_TTL_SECONDS,
  );

  const jar = await cookies();
  jar.set(STORE_COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: new URL(app.site_url).protocol === "https:",
    path: STORE_PORTAL,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endStoreSession(): Promise<void> {
  const jar = await cookies();
  const id = unsign(jar.get(STORE_COOKIE)?.value);
  if (id) await dropSessionStrict(id);
  jar.delete({ name: STORE_COOKIE, path: STORE_PORTAL });
}

/**
 * Re-read status, credentials and version on every request. Suspending a store
 * or removing its login therefore invalidates an already-open portal at once.
 */
export async function getStore(): Promise<SignedInStore | null> {
  if (!storePortalEnabled()) return null;

  const jar = await cookies();
  const id = unsign(jar.get(STORE_COOKIE)?.value);
  if (!id) return null;

  const record = await readSession(id);
  if (!record) return null;

  const store = await prisma.organicStore.findFirst({
    where: {
      id: record.customerId,
      status: "VERIFIED",
      portalEnabledAt: { not: null },
      passwordHash: { not: null },
    },
    select: {
      id: true,
      slug: true,
      storeName: true,
      contactName: true,
      email: true,
      portalSessionVersion: true,
    },
  });

  if (!store || record.sessionVersion !== store.portalSessionVersion) {
    await dropSession(id);
    return null;
  }

  const { portalSessionVersion, ...safe } = store;
  void portalSessionVersion;
  return safe;
}

function inviteKey(storeId: string): string {
  return redisKey("store-invite", storeId);
}

function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const inviteMemory = new Map<string, { tokenHash: string; expiresAt: number }>();

export async function issueStoreInvite(storeId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const redis = getRedis();

  if (redis) {
    await redis.set(inviteKey(storeId), digest(token), "EX", INVITE_TTL_SECONDS);
  } else {
    inviteMemory.set(inviteKey(storeId), {
      tokenHash: digest(token),
      expiresAt: Date.now() + INVITE_TTL_SECONDS * 1000,
    });
  }

  return token;
}

export async function cancelStoreInvite(storeId: string): Promise<void> {
  const redis = getRedis();
  if (redis) await redis.del(inviteKey(storeId));
  else inviteMemory.delete(inviteKey(storeId));
}

export async function storeInviteIsOutstanding(storeId: string): Promise<boolean> {
  const key = inviteKey(storeId);
  const redis = getRedis();
  if (redis) return (await redis.exists(key).catch(() => 0)) === 1;

  const entry = inviteMemory.get(key);
  return Boolean(entry && entry.expiresAt > Date.now());
}

export async function storeInviteStates(storeIds: string[]): Promise<Set<string>> {
  const live = new Set<string>();
  if (storeIds.length === 0) return live;

  const redis = getRedis();
  if (redis) {
    const found = await redis
      .mget(storeIds.map(inviteKey))
      .catch(() => storeIds.map(() => null));
    storeIds.forEach((id, index) => {
      if (found[index]) live.add(id);
    });
    return live;
  }

  const now = Date.now();
  for (const id of storeIds) {
    const entry = inviteMemory.get(inviteKey(id));
    if (entry && entry.expiresAt > now) live.add(id);
  }
  return live;
}

export async function storeInviteMatches(storeId: string, token: string): Promise<boolean> {
  const key = inviteKey(storeId);
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

/** Single use: atomically remove only an exact token match. */
export async function consumeStoreInvite(storeId: string, token: string): Promise<boolean> {
  const key = inviteKey(storeId);
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
  const provided = Buffer.from(digest(token));
  const expected = Buffer.from(stored);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
