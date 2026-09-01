import "server-only";

import { loadConfig } from "@conf/config";
import { mailConfigured, sendTextEmail } from "./mail";

/** Best effort only; the database write is the authoritative receipt. */
export async function notifyApplication({
  kind,
  applicantEmail,
  applicantName,
  entityName,
}: {
  kind: "farmer" | "organic store";
  applicantEmail: string;
  applicantName: string;
  entityName: string;
}): Promise<void> {
  if (!mailConfigured()) return;

  const admin = loadConfig().app.contact_email;
  await Promise.allSettled([
    sendTextEmail({
      to: applicantEmail,
      subject: `Organics received your ${kind} application`,
      text: [
        `Hello ${applicantName},`,
        "",
        `We received the application for ${entityName}. Nothing goes public until an Organics admin checks it. We will contact you using the details you submitted.`,
        "",
        "Organics",
      ].join("\n"),
    }),
    ...(admin
      ? [
          sendTextEmail({
            to: admin,
            subject: `New ${kind} application on Organics`,
            text: `${entityName}\nApplicant: ${applicantName}\nEmail: ${applicantEmail}\n\nReview it in /tj.`,
          }),
        ]
      : []),
  ]);
}

export async function notifyContactMessage({
  name,
  email,
  role,
  message,
}: {
  name: string;
  email: string;
  role: string;
  message: string;
}): Promise<void> {
  if (!mailConfigured()) return;
  const admin = loadConfig().app.contact_email;
  if (!admin) return;

  await Promise.allSettled([
    sendTextEmail({
      to: email,
      subject: "Organics received your message",
      text: `Hello ${name},\n\nWe received your message and will reply after it is reviewed.\n\nOrganics`,
    }),
    sendTextEmail({
      to: admin,
      subject: "New contact message on Organics",
      text: `From: ${name} <${email}>\nRole: ${role}\n\n${message}\n\nReview it in /tj/messages.`,
    }),
  ]);
}
