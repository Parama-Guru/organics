import Image from "next/image";

import { loadConfig } from "@conf/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPinIcon, PhoneIcon, ShieldCheckIcon, WhatsAppIcon } from "@/components/ui/icons";
import { format } from "@/lib/i18n/config";
import { checkedOn } from "@/lib/i18n/dates";
import { localised, regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";

type Farmer = {
  slug: string;
  farmName: string;
  contactName: string;
  phone: string;
  region: { slug: string; name: string; nameTa: string | null };
  about: string | null;
  aboutTa: string | null;
  photoUrl: string | null;
  verifiedAt: Date | null;
  certifier: string | null;
  certificateNo: string | null;
  certifiedUntil: Date | null;
};

// wa.me wants bare digits with the country code and no punctuation.
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export function dialNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/** Config-driven, so the numbers can be published without a code change. */
export function showFarmerPhone(): boolean {
  return loadConfig().app.show_farmer_phone;
}

export async function FarmerContact({ farmer }: { farmer: Farmer }) {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <section
      id="contact"
      className="glass mt-12 scroll-mt-24 overflow-hidden rounded-3xl sm:mt-16"
    >
      <div className="grid gap-0 sm:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="relative h-36 bg-leaf-50 sm:h-full sm:min-h-[15rem]">
          {farmer.photoUrl ? (
            <Image
              src={farmer.photoUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 13rem"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="p-6 sm:p-8">
          <p className="font-medium text-bark-600">{t.contact.eyebrow}</p>
          <h2 className="mt-1 font-display text-2xl leading-snug break-words sm:text-3xl">
            {farmer.farmName}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-bark-600">
            <span>{farmer.contactName}</span>
            <span aria-hidden>&middot;</span>
            <span className="inline-flex items-center gap-1">
              <MapPinIcon /> {regionLabel(locale, farmer.region)}
            </span>
          </p>

          {farmer.verifiedAt ? (
            <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl bg-leaf-50 px-3 py-2 text-sm font-medium text-leaf-800 ring-1 ring-inset ring-leaf-300">
              <ShieldCheckIcon className="text-base" />
              {format(t.contact.checkedOn, { date: checkedOn(farmer.verifiedAt, locale) })}
            </p>
          ) : null}

          {farmer.certifier ? (
            <p className="mt-3 leading-relaxed text-ink">
              <span className="text-bark-600">{t.contact.certifier}:</span>{" "}
              <span className="font-medium">{farmer.certifier}</span>
              {farmer.certificateNo ? (
                <>
                  {" · "}
                  <span className="text-bark-600">{t.contact.certificateNo}:</span>{" "}
                  <span className="font-mono font-medium">{farmer.certificateNo}</span>
                </>
              ) : null}
              {farmer.certifiedUntil ? (
                <>
                  {" · "}
                  <span className="text-bark-600">{t.contact.certifiedUntil}:</span>{" "}
                  <span className="font-medium">{checkedOn(farmer.certifiedUntil, locale)}</span>
                </>
              ) : null}
            </p>
          ) : null}

          {farmer.about ? (
            <p className="mt-4 max-w-2xl leading-relaxed text-ink">
              {localised(locale, farmer.about, farmer.aboutTa)}
            </p>
          ) : null}

          {showFarmerPhone() ? (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {/* Labelled rather than repeating the digits: the number is already
                    the primary button at the top of the page and again in the sticky
                    bar, and three copies of one phone number reads as filler. */}
                <Button as="a" href={`tel:${dialNumber(farmer.phone)}`} size="lg">
                  <PhoneIcon /> {t.contact.callNow}
                </Button>
                <Button
                  as="a"
                  href={`https://wa.me/${whatsappNumber(farmer.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="lg"
                >
                  <WhatsAppIcon /> {t.contact.whatsapp}
                </Button>
                <Badge tone="neutral">{t.contact.callWindow}</Badge>
              </div>

              <p className="mt-4 max-w-2xl leading-relaxed text-bark-600">
                {format(t.contact.note, { seller: farmer.farmName })}
              </p>
            </>
          ) : (
            <div className="mt-6 max-w-2xl rounded-2xl border border-bark-200 bg-canvas-2/70 p-5">
              <p className="font-semibold text-ink">{t.contact.phoneSoon}</p>
              <p className="mt-1 leading-relaxed text-bark-600">{t.contact.phoneSoonNote}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
