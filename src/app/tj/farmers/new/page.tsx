import Link from "next/link";
import { redirect } from "next/navigation";

import { NewFarmerForm } from "@/app/tj/farmers/new/new-farmer-form";
import { isSignedIn } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewFarmerPage() {
  if (!(await isSignedIn())) redirect("/tj/login");

  return (
    <>
      <Link
        href="/tj"
        className="text-sm font-medium text-bark-600 hover:text-bark-900"
      >
        <span aria-hidden>&larr;</span> Applications
      </Link>
      <h1 className="mt-4 font-display text-2xl text-bark-900">Add a farm</h1>
      <p className="mt-1 max-w-xl text-sm text-bark-600">
        Use this for a farm you have already checked yourself. It is published straight away,
        skipping the review queue, so only add farms you have verified.
      </p>
      <NewFarmerForm />
    </>
  );
}
