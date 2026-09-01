import { showFarmerPhone } from "@/components/farmer-contact";
import { getDictionary } from "@/lib/i18n/server";

/**
 * States, once and plainly, that phone numbers are not open yet.
 *
 * The whole promise of the site is "ring the farm directly". While
 * `app.show_farmer_phone` is off that promise cannot be kept, and a visitor who
 * lands on a listing page from a shared link would otherwise hunt for a call
 * button that is not there and conclude the site is broken. Product and farm
 * detail pages carry their own version of this in place of the call row; this
 * component covers the pages that have no call row to replace.
 *
 * Renders nothing once the numbers go live.
 */
export async function PhoneSoonNotice({ className = "" }: { className?: string }) {
  if (showFarmerPhone()) return null;

  const t = await getDictionary();

  return (
    <p
      className={`rounded-2xl border border-marigold-100 bg-marigold-50 px-4 py-3 leading-relaxed text-ink ${className}`}
    >
      <span className="font-semibold">{t.contact.phoneSoon}.</span> {t.contact.phoneSoonNote}
    </p>
  );
}
