import { redirect } from "next/navigation";

import { FarmerSignInForm } from "@/app/pannai/forms";
import { FARMER_PORTAL, getFarmer } from "@/lib/farmer-auth";

export const dynamic = "force-dynamic";

export default async function FarmerSignInPage() {
  if (await getFarmer()) redirect(FARMER_PORTAL);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl text-bark-900">பண்ணை நிர்வாகம்</h1>
      <p className="mt-2 leading-relaxed text-ink">
        உங்கள் பொருட்களைச் சேர்க்கவும் திருத்தவும் நீக்கவும் இங்கே உள்ளே செல்லுங்கள்.
      </p>
      <FarmerSignInForm />
      {/* Active phrasing, and it answers the two questions a farmer standing at
          this screen actually has: I have no login, and I forgot my password.
          There is no self-serve reset because outbound email is optional here,
          so saying who to ring is the honest answer rather than a dead link. */}
      <div className="mt-6 space-y-2 border-t border-bark-200 pt-4 text-sm leading-relaxed text-bark-600">
        <p>
          இன்னும் அணுகல் இல்லையா? உங்கள் பண்ணையை நாங்கள் சரிபார்த்த பிறகு ஒரு அழைப்பு
          இணைப்பை அனுப்புவோம்.
        </p>
        <p>
          கடவுச்சொல் மறந்துவிட்டதா? எங்களை அழையுங்கள் — புதிய இணைப்பு அனுப்புகிறோம். பழைய
          கடவுச்சொல் அப்போது வேலை செய்யாது.
        </p>
      </div>
    </div>
  );
}
