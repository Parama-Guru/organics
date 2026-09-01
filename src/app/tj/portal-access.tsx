"use client";

import { useState, useTransition } from "react";

import { cancelInvite, grantPortalAccess, revokePortalAccess } from "@/app/tj/actions";
import { Button } from "@/components/ui/button";

type Access = {
  invitedAt: Date | null;
  hasPassword: boolean;
  inviteOutstanding: boolean;
  lastSignInAt: Date | null;
};

function describe(access: Access): string {
  if (access.hasPassword) {
    const base = access.lastSignInAt
      ? `Signed in ${access.lastSignInAt.toISOString().slice(0, 10)}`
      : "Password set, not signed in yet";
    return access.inviteOutstanding ? `${base} · a reset link is outstanding` : base;
  }
  if (access.inviteOutstanding) {
    return access.invitedAt
      ? `Invited ${access.invitedAt.toISOString().slice(0, 10)}, waiting for a password`
      : "Invited, waiting for a password";
  }
  if (access.invitedAt) return "Invite used up or expired — no password set";
  return "No login";
}

/**
 * Grant, reset, cancel or revoke a farm's portal login.
 *
 * The link is rendered into the page rather than mailed, because SMTP is
 * optional on this deployment. It is shown once per click and never stored, so
 * a stale link cannot be read back off a reloaded page. Only one link per farm
 * is live at a time, and the state above the buttons says which.
 */
export function PortalAccess({
  farmerId,
  access,
  disabled,
}: {
  farmerId: string;
  access: Access;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function form(): FormData {
    const data = new FormData();
    data.set("farmerId", farmerId);
    return data;
  }

  function invite() {
    // Named consequence: for a farm that is already signed up this button
    // replaces a working password rather than handing out a first one.
    if (
      access.hasPassword &&
      !window.confirm(
        "Send a password reset link? Their current password stops working as soon as the link is used.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      setError(null);
      setCopied(false);
      const result = await grantPortalAccess(form());
      if (result.ok) setLink(result.url);
      else setError(result.message);
    });
  }

  function cancel() {
    startTransition(async () => {
      setError(null);
      setLink(null);
      const result = await cancelInvite(form());
      if (!result.ok) setError(result.message);
    });
  }

  function revoke() {
    if (
      !window.confirm(
        "Remove this farm's login? Their listings stay up, but they are signed out at once.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      setError(null);
      setLink(null);
      const result = await revokePortalAccess(form());
      if (!result.ok) setError(result.message);
    });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard is blocked outside a secure context; the link is on screen to
      // be selected by hand, so this is not worth an error message.
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-bark-200 bg-bark-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-bark-900">Farmer portal</p>
          <p className="text-sm text-bark-600">{describe(access)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={pending || disabled} onClick={invite}>
            {access.hasPassword
              ? "Send a reset link"
              : access.inviteOutstanding
                ? "New link"
                : "Invite"}
          </Button>
          {access.inviteOutstanding ? (
            <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={cancel}>
              Cancel link
            </Button>
          ) : null}
          {access.hasPassword ? (
            <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={revoke}>
              Remove login
            </Button>
          ) : null}
        </div>
      </div>

      {disabled ? (
        <p className="mt-2 text-sm text-bark-600">Approve this farm first, then invite it.</p>
      ) : null}

      {link ? (
        <div className="mt-3">
          <p className="text-sm text-bark-600">
            Send this to the farm. It works once, expires in 7 days, and replaces any link sent
            before it.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 rounded-lg border border-bark-200 bg-white px-3 py-2 text-xs break-all">
              {link}
            </code>
            <Button type="button" size="sm" variant="secondary" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
