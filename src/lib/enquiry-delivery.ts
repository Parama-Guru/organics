import "server-only";

import { loadConfig } from "@conf/config";
import { sendTextEmail } from "./mail";

export type DeliverableEnquiry = {
  id: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  senderEmail: string;
  shareEmail: boolean;
  customer: { name: string };
};

export function safeDeliveryError(error: unknown): string {
  if (!error || typeof error !== "object") return "UnknownError";
  const name = error instanceof Error ? error.name : "Error";
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  return code ? `${name}:${code}`.slice(0, 120) : name.slice(0, 120);
}

/** Stable Message-ID makes an operator retry safe for recipient mailboxes. */
export async function deliverPrivateEnquiry(enquiry: DeliverableEnquiry): Promise<void> {
  const { app } = loadConfig();
  const messageDomain = new URL(app.site_url).hostname;
  const support = app.contact_email
    ? `Quote reference ${enquiry.id} to OSSIL support at ${app.contact_email}; staff can relay your response without exposing the buyer's email.`
    : `Quote reference ${enquiry.id} when contacting OSSIL support; staff can relay your response without exposing the buyer's email.`;

  await sendTextEmail({
    to: enquiry.recipientEmail,
    replyTo: enquiry.shareEmail ? enquiry.senderEmail : undefined,
    messageId: `<enquiry-${enquiry.id}@${messageDomain}>`,
    subject: `[OSSIL] ${enquiry.subject}`,
    text: [
      `New enquiry through OSSIL for ${enquiry.recipientName}`,
      "",
      `From: ${enquiry.customer.name}`,
      enquiry.shareEmail
        ? `Reply email: ${enquiry.senderEmail}`
        : `Reply email: kept private. ${support}`,
      "",
      enquiry.message,
      "",
      `Reference: ${enquiry.id}`,
      "OSSIL does not take payment or guarantee an arrangement. Do not send money before speaking directly.",
    ].join("\n"),
  });
}
