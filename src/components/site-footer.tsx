import Link from "next/link";

import { format, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <footer className="mt-20 border-t border-white/60 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-display text-lg">
            <span aria-hidden>&#127807;</span> Organics
          </p>
          <p className="mt-1 text-sm text-bark-600">
            {format(t.footer.copyright, { year: new Date().getFullYear() })}
          </p>
        </div>
        <p className="inline-flex items-center gap-2 justify-self-start rounded-full bg-leaf-100 px-4 py-2 text-sm font-medium text-leaf-800 sm:justify-self-end">
          <span aria-hidden>&#9742;</span> {t.footer.buyDirect}
        </p>
      </div>
      <div className="mx-auto max-w-6xl border-t border-bark-200/50 px-4 py-4 text-sm sm:px-6">
        <Link
          href={localePath(locale, "/sell")}
          className="font-medium decoration-marigold-500 decoration-2 underline-offset-4 hover:underline"
        >
          {t.footer.farmerCta}
        </Link>
      </div>
    </footer>
  );
}
