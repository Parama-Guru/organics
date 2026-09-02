import { redirect } from "next/navigation";

import { StoreSignInForm } from "@/app/kadai/forms";
import { STORE_PORTAL, getStore } from "@/lib/store-auth";

export const dynamic = "force-dynamic";

export default async function StoreSignInPage() {
  if (await getStore()) redirect(STORE_PORTAL);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl text-bark-900">கடை நிர்வாகம்</h1>
      <p className="mt-2 leading-relaxed text-ink">
        உங்கள் கடை விவரங்களையும் வாங்குபவர் விசாரணைகளையும் இங்கே பார்க்கலாம்.
      </p>
      <StoreSignInForm />
      <div className="mt-6 space-y-2 border-t border-bark-200 pt-4 text-sm leading-relaxed text-bark-600">
        <p>
          இன்னும் அணுகல் இல்லையா? உங்கள் கடையைச் சரிபார்த்த பிறகு Organics ஒரு அழைப்பு இணைப்பை
          அனுப்பும்.
        </p>
        <p>
          கடவுச்சொல் மறந்துவிட்டதா? நிர்வாகியிடம் புதிய இணைப்பு கேளுங்கள். அந்த இணைப்பைப்
          பயன்படுத்தியதும் பழைய கடவுச்சொல் வேலை செய்யாது.
        </p>
      </div>
    </div>
  );
}
