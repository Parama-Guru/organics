import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localised, regionLabel } from "@/lib/i18n/content";
import { format } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

type Farmer = {
  farmName: string;
  contactName: string;
  phone: string;
  region: string;
  about: string | null;
  aboutTa: string | null;
  verifiedAt: Date | null;
};

// wa.me wants bare digits with the country code and no punctuation.
function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function FarmerContact({ farmer }: { farmer: Farmer }) {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  const dial = farmer.phone.replace(/[^\d+]/g, "");

  return (
    <section id="contact" className="glass mt-10 scroll-mt-24 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-bark-600">{t.contact.eyebrow}</p>
          <h2 className="mt-1 font-display text-2xl leading-snug">{farmer.farmName}</h2>
          <p className="mt-1 text-bark-600">
            {farmer.contactName} &middot; {regionLabel(locale, farmer.region)}
          </p>
        </div>
        {farmer.verifiedAt ? (
          <Badge tone="leaf" className="shrink-0">
            <span aria-hidden>&#10003;</span> {t.contact.verified}
          </Badge>
        ) : null}
      </div>

      {farmer.about ? (
        <p className="mt-4 max-w-2xl text-bark-600">
          {localised(locale, farmer.about, farmer.aboutTa)}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button as="a" href={`tel:${dial}`} size="lg">
          <span aria-hidden>&#9742;</span> {farmer.phone}
        </Button>
        <Button
          as="a"
          href={`https://wa.me/${whatsappNumber(farmer.phone)}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="lg"
        >
          {t.contact.whatsapp}
        </Button>
      </div>

      <p className="mt-4 max-w-2xl text-sm text-bark-600">
        {format(t.contact.note, { seller: farmer.farmName })}
      </p>
    </section>
  );
}
