import { Button } from "@/components/ui/button";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { dialNumber, whatsappNumber } from "@/components/farmer-contact";
import { getDictionary } from "@/lib/i18n/server";

/**
 * The whole business model is one phone call. On a phone the number otherwise
 * sits ~1100px down the page, so it gets pinned to the bottom of the viewport.
 */
export async function StickyCallBar({ phone }: { phone: string }) {
  const t = await getDictionary();

  return (
    <>
      {/* Reserves the space the fixed bar occupies, so it never sits on the footer. */}
      <div aria-hidden className="h-24 md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
        <div className="flex gap-2">
          <Button as="a" href={`tel:${dialNumber(phone)}`} size="lg" className="flex-1">
            <PhoneIcon /> {t.contact.callShort}
          </Button>
          <Button
            as="a"
            href={`https://wa.me/${whatsappNumber(phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="lg"
            aria-label={t.contact.whatsapp}
          >
            <WhatsAppIcon />
          </Button>
        </div>
      </div>
    </>
  );
}
