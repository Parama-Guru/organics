import { redirect } from "next/navigation";

import { StoreProfileForm } from "@/app/kadai/forms";
import { STORE_PORTAL, getStore } from "@/lib/store-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StoreProfilePage({ searchParams }: PageProps<"/kadai/profile">) {
  const store = await getStore();
  if (!store) redirect(`${STORE_PORTAL}/sign-in`);

  const [params, details] = await Promise.all([
    searchParams,
    prisma.organicStore.findUnique({
      where: { id: store.id },
      select: {
        storeName: true,
        contactName: true,
        email: true,
        region: { select: { name: true, nameTa: true } },
        phone: true,
        addressLine: true,
        about: true,
        aboutTa: true,
      },
    }),
  ]);
  if (!details) redirect(`${STORE_PORTAL}/sign-in`);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-bark-900">கடை விவரங்கள்</h1>
      <p className="mt-2 leading-relaxed text-bark-600">
        சேமித்தவுடன் முகவரியும் விளக்கமும் பொதுப் பக்கத்தில் புதுப்பிக்கும். கடையின் சட்டப் பெயர்,
        மின்னஞ்சல், மாவட்டம் அல்லது உரிமத்தை மாற்ற நிர்வாகியைத் தொடர்பு கொள்ளுங்கள்.
      </p>

      <dl className="mt-6 grid gap-3 rounded-2xl border border-bark-200 bg-canvas p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-bark-600">கடை</dt><dd>{details.storeName}</dd></div>
        <div><dt className="text-bark-600">தொடர்பு நபர்</dt><dd>{details.contactName}</dd></div>
        <div><dt className="text-bark-600">மின்னஞ்சல்</dt><dd className="break-all">{details.email}</dd></div>
        <div><dt className="text-bark-600">மாவட்டம்</dt><dd>{details.region.nameTa ?? details.region.name}</dd></div>
      </dl>

      {params.saved === "1" ? (
        <p role="status" className="mt-5 rounded-xl bg-leaf-50 p-3 text-leaf-800 ring-1 ring-leaf-200">
          மாற்றங்கள் சேமிக்கப்பட்டன.
        </p>
      ) : null}

      <StoreProfileForm
        initial={{
          phone: details.phone,
          addressLine: details.addressLine,
          about: details.about ?? "",
          aboutTa: details.aboutTa ?? "",
        }}
      />
    </div>
  );
}
