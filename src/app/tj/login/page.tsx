import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/app/tj/login/login-form";
import { isSignedIn } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isSignedIn()) redirect("/tj");
  return <AdminLoginForm />;
}
