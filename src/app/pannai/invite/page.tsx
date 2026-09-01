import { redirect } from "next/navigation";

import { AcceptInviteForm } from "@/app/pannai/forms";
import { FARMER_PORTAL, getFarmer, inviteIsOutstanding } from "@/lib/farmer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  searchParams,
}: PageProps<"/pannai/invite">) {
  // Already signed in as some farm: drawing a password form here let a
  // mis-sent link quietly replace the wrong farm's credentials.
  if (await getFarmer()) redirect(FARMER_PORTAL);

  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const farmId = typeof params.farm === "string" ? params.farm : "";

  // Checked before the form is drawn rather than after a password is typed, so
  // nobody chooses a password only to be told the link was already dead.
  const farm =
    token && farmId && (await inviteIsOutstanding(farmId))
      ? await prisma.farmer.findFirst({
          where: { id: farmId, status: "VERIFIED" },
          select: { farmName: true, passwordHash: true },
        })
      : null;

  if (!farm) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl text-bark-900">இந்த இணைப்பு வேலை செய்யவில்லை</h1>
        <p className="mt-2 leading-relaxed text-ink">
          இணைப்பு ஏற்கெனவே பயன்படுத்தப்பட்டிருக்கலாம், அல்லது காலம் முடிந்திருக்கலாம். உங்கள்
          பண்ணையை இணைத்தவரிடம் புதிய இணைப்பு கேளுங்கள்.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl text-bark-900">
        {farm.passwordHash ? "புதிய கடவுச்சொல்" : "கடவுச்சொல்லை அமைக்க"}
      </h1>
      {/* Naming the farm is how a wrongly forwarded link gets caught. */}
      <p className="mt-2 leading-relaxed text-ink">
        இது <strong className="font-semibold break-words">{farm.farmName}</strong> பண்ணைக்கான
        இணைப்பு. இது உங்கள் பண்ணை இல்லையென்றால் இங்கேயே நிறுத்துங்கள்.
      </p>
      <p className="mt-2 leading-relaxed text-ink">
        {farm.passwordHash
          ? "நீங்கள் இப்போது அமைக்கும் கடவுச்சொல் பழையதற்குப் பதிலாக வரும். இந்த இணைப்பு ஒரே முறை மட்டும் வேலை செய்யும்."
          : "ஒரு கடவுச்சொல்லைத் தேர்ந்தெடுத்தால் உள்ளே செல்லலாம். இந்த இணைப்பு ஒரே முறை மட்டும் வேலை செய்யும்."}
      </p>
      <AcceptInviteForm farmId={farmId} token={token} />
    </div>
  );
}
