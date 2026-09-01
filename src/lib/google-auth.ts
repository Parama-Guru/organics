import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type * as oauth from "oauth4webapi";

import { loadConfig } from "@conf/config";

export const GOOGLE_AS: oauth.AuthorizationServer = {
  issuer: "https://accounts.google.com",
  authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  token_endpoint: "https://oauth2.googleapis.com/token",
  jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
};

type DownloadedGoogleCredential = {
  web?: {
    client_id?: unknown;
    client_secret?: unknown;
  };
};

export type GoogleCredentials = {
  clientId: string;
  clientSecret: string;
};

let cached: GoogleCredentials | null | undefined;

/** Load env credentials in production or an ignored downloaded JSON in local dev. */
export function getGoogleCredentials(): GoogleCredentials | null {
  if (cached !== undefined) return cached;

  const { client_id, client_secret, client_secret_file } = loadConfig().auth.google;
  if (client_id && client_secret) {
    cached = { clientId: client_id, clientSecret: client_secret };
    return cached;
  }

  if (!client_secret_file) {
    cached = null;
    return cached;
  }

  const confDir = path.resolve(process.cwd(), "conf");
  const file = path.resolve(confDir, client_secret_file);
  if (!file.startsWith(`${confDir}${path.sep}`) || !existsSync(file)) {
    console.error("[auth] Google client_secret_file is missing or outside conf/; Google sign-in is disabled.");
    cached = null;
    return cached;
  }

  try {
    const downloaded = JSON.parse(readFileSync(file, "utf8")) as DownloadedGoogleCredential;
    const fileId = downloaded.web?.client_id;
    const fileSecret = downloaded.web?.client_secret;
    if (typeof fileId !== "string" || typeof fileSecret !== "string" || !fileSecret) {
      throw new Error("not a Google Web application credential");
    }
    if (client_id && client_id !== fileId) {
      throw new Error("client id does not match auth.google.client_id");
    }
    cached = { clientId: fileId, clientSecret: fileSecret };
    return cached;
  } catch (error) {
    console.error(`[auth] Google credential file is invalid; Google sign-in is disabled: ${(error as Error).message}`);
    cached = null;
    return cached;
  }
}

export function googleOAuthEnabled(): boolean {
  return getGoogleCredentials() !== null;
}

export function googleClient(credentials: GoogleCredentials): oauth.Client {
  return {
    client_id: credentials.clientId,
    token_endpoint_auth_method: "client_secret_post",
    id_token_signed_response_alg: "RS256",
  };
}

export function googleRedirectUri(): string {
  return `${loadConfig().app.site_url.replace(/\/$/, "")}/api/auth/google/callback`;
}
