import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/app/admin/login/login-form";
import { isSignedIn } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isSignedIn()) redirect("/admin");
  return <AdminLoginForm />;
}
