import "server-only";

import { loadConfig } from "@conf/config";

export function mailConfigured(): boolean {
  const { mail } = loadConfig();
  return Boolean(mail.host && mail.from);
}

export async function sendTextEmail({
  to,
  subject,
  text,
  replyTo,
  messageId,
}: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  messageId?: string;
}): Promise<{ messageId: string }> {
  const { mail } = loadConfig();
  if (!mailConfigured()) throw new Error("mail is not configured");

  const { createTransport } = await import("nodemailer");
  const transport = createTransport({
    host: mail.host,
    port: mail.port,
    secure: mail.port === 465,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: mail.user ? { user: mail.user, pass: mail.password } : undefined,
  });

  const result = await transport.sendMail({
    to,
    from: mail.from,
    subject,
    text,
    ...(replyTo ? { replyTo } : {}),
    ...(messageId ? { messageId } : {}),
  });

  return { messageId: result.messageId };
}
