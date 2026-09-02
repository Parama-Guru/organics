import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/app/tj/login/login-form";
import { isSignedIn } from "@/lib/admin-auth";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { PORTAL_COPY } from "@/lib/i18n/portal-copy";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isSignedIn()) redirect("/tj");
  const locale = await getPreferredLocale();
  return <AdminLoginForm locale={locale} copy={PORTAL_COPY[locale]} />;
}
