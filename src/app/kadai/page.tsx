import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { STORE_PORTAL, getStore } from "@/lib/store-auth";
import { prisma } from "@/lib/prisma";
import { storeEvidenceAllowsPublication } from "@/lib/stores";

export const dynamic = "force-dynamic";

export default async function StoreHomePage({ searchParams }: PageProps<"/kadai">) {
  const store = await getStore();
  if (!store) redirect(`${STORE_PORTAL}/sign-in`);

  const [params, details, totalEnquiries, unreadEnquiries] = await Promise.all([
    searchParams,
    prisma.organicStore.findUnique({
      where: { id: store.id },
      select: {
        storeName: true,
        contactName: true,
        phone: true,
        email: true,
        addressLine: true,
        aboutTa: true,
        about: true,
        photoUrl: true,
        fssaiNumber: true,
        certifier: true,
        certificateNo: true,
        certifiedUntil: true,
        verifiedAt: true,
        region: { select: { name: true, nameTa: true } },
      },
    }),
    prisma.privateEnquiry.count({ where: { storeId: store.id } }),
    prisma.privateEnquiry.count({ where: { storeId: store.id, sellerReadAt: null } }),
  ]);
  if (!details) redirect(`${STORE_PORTAL}/sign-in`);
  const publicEligible = storeEvidenceAllowsPublication(details);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="section-kicker">சரிபார்த்த Organics கடை</p>
          <h1 className="mt-5 font-display text-5xl font-medium leading-none break-words text-bark-900 sm:text-6xl">
            {details.storeName}
          </h1>
          <p className="mt-2 text-bark-600">
            {details.region.nameTa ?? details.region.name} · FSSAI {details.fssaiNumber ?? "—"}
          </p>
        </div>
        {details.photoUrl ? (
          <div className="relative aspect-[8/5] overflow-hidden rounded-2xl bg-leaf-50">
            <Image src={details.photoUrl} alt="" fill sizes="288px" className="object-cover" />
          </div>
        ) : null}
      </div>

      {params.saved === "1" ? (
        <p role="status" className="mt-5 rounded-xl bg-leaf-50 p-3 text-leaf-800 ring-1 ring-leaf-200">
          மாற்றங்கள் சேமிக்கப்பட்டன.
        </p>
      ) : null}

      {!publicEligible ? (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-700">
          உங்கள் கடை சரிபார்க்கப்பட்டிருந்தாலும் FSSAI அல்லது சான்றிதழ் பதிவு முழுமையாக இல்லை,
          அல்லது காலாவதியாகியுள்ளது. அதனால் பொதுப் பட்டியல் இப்போது மறைக்கப்பட்டுள்ளது. Organics
          நிர்வாகியைத் தொடர்பு கொண்டு ஆதாரத்தைப் புதுப்பிக்கவும்.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href={`${STORE_PORTAL}/enquiries`}
          className="editorial-panel rounded-[1.5rem] p-6 transition-colors hover:border-bark-400"
        >
          <p className="text-sm text-bark-600">வாங்குபவர் விசாரணைகள்</p>
          <p className="mt-1 font-display text-3xl text-bark-900">{unreadEnquiries}</p>
          <p className="mt-1 text-sm text-bark-600">படிக்காதவை · மொத்தம் {totalEnquiries}</p>
        </Link>
        <Link
          href={`${STORE_PORTAL}/profile`}
          className="editorial-panel rounded-[1.5rem] p-6 transition-colors hover:border-bark-400"
        >
          <p className="font-display text-xl text-bark-900">கடை விவரங்கள்</p>
          <p className="mt-2 text-sm leading-relaxed text-bark-600">
            தொலைபேசி, முகவரி, தமிழ் மற்றும் English விளக்கத்தைப் புதுப்பிக்கலாம்.
          </p>
        </Link>
      </div>

      <section className="editorial-panel mt-8 rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-xl text-bark-900">இப்போது பொதுப் பக்கத்தில்</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-bark-600">தொடர்பு நபர்</dt><dd>{details.contactName}</dd></div>
          <div><dt className="text-bark-600">மின்னஞ்சல்</dt><dd className="break-all">{details.email}</dd></div>
          <div><dt className="text-bark-600">தொலைபேசி</dt><dd>{details.phone}</dd></div>
          <div><dt className="text-bark-600">முகவரி</dt><dd>{details.addressLine}</dd></div>
        </dl>
        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-bark-600">
          {details.aboutTa || details.about}
        </p>
        <a
          href={`/ta/stores/${store.slug}`}
          className="mt-4 inline-flex min-h-11 items-center font-medium text-brand underline underline-offset-4"
        >
          பொதுப் பக்கத்தைப் பார்க்க
        </a>
      </section>

      <section className="mt-8 rounded-[1.75rem] border border-leaf-200 bg-leaf-50 p-6 sm:p-8">
        <h2 className="font-display text-xl text-bark-900">சரிபார்ப்பு பதிவு</h2>
        <p className="mt-2 text-sm text-bark-600">
          FSSAI, உரிமையாளர் அடையாளம், சான்றிதழ் போன்றவற்றை மாற்ற Organics நிர்வாகியைத் தொடர்பு
          கொள்ளுங்கள். பாதுகாப்புக்காக அவை கடை பக்கத்தில் நேரடியாகத் திருத்த முடியாது.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-bark-600">FSSAI</dt><dd>{details.fssaiNumber ?? "—"}</dd></div>
          <div><dt className="text-bark-600">சான்று வழங்கியவர்</dt><dd>{details.certifier ?? "—"}</dd></div>
          <div><dt className="text-bark-600">சான்றிதழ் எண்</dt><dd>{details.certificateNo ?? "—"}</dd></div>
          <div>
            <dt className="text-bark-600">செல்லுபடி தேதி</dt>
            <dd>{details.certifiedUntil?.toISOString().slice(0, 10) ?? "—"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
