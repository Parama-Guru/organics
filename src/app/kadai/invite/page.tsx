import { redirect } from "next/navigation";

import { AcceptStoreInviteForm } from "@/app/kadai/forms";
import { PORTAL_COPY } from "@/lib/i18n/portal-copy";
import {
  STORE_PORTAL,
  getStore,
  storeInviteMatches,
} from "@/lib/store-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AcceptStoreInvitePage({
  searchParams,
}: PageProps<"/kadai/invite">) {
  if (await getStore()) redirect(STORE_PORTAL);

  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const storeId = typeof params.store === "string" ? params.store : "";
  const store =
    token && storeId && (await storeInviteMatches(storeId, token))
      ? await prisma.organicStore.findFirst({
          where: { id: storeId, status: "VERIFIED" },
          select: { storeName: true, passwordHash: true },
        })
      : null;

  if (!store) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl text-bark-900">இந்த இணைப்பு வேலை செய்யவில்லை</h1>
        <p className="mt-2 leading-relaxed text-ink">
          இணைப்பு பயன்படுத்தப்பட்டிருக்கலாம் அல்லது காலம் முடிந்திருக்கலாம். உங்கள் கடையைச்
          சரிபார்த்த நிர்வாகியிடம் புதிய இணைப்பு கேளுங்கள்.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl text-bark-900">
        {store.passwordHash ? "புதிய கடவுச்சொல்" : "கடவுச்சொல்லை அமைக்க"}
      </h1>
      <p className="mt-2 leading-relaxed text-ink">
        இது <strong className="font-semibold break-words">{store.storeName}</strong> கடைக்கான
        இணைப்பு. இது உங்கள் கடை இல்லையென்றால் இங்கேயே நிறுத்துங்கள்.
      </p>
      <p className="mt-2 leading-relaxed text-ink">
        இந்த இணைப்பு ஒரே முறை மட்டும் வேலை செய்யும். புதிய கடவுச்சொல் அமைத்ததும் பழையது இருந்தால்
        அது நிறுத்தப்படும்.
      </p>
      <AcceptStoreInviteForm storeId={storeId} token={token} copy={PORTAL_COPY.ta} />
    </div>
  );
}
