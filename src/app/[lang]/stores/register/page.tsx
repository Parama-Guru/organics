import { permanentRedirect } from "next/navigation";

import { localePath } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

export default async function StoreRegisterPage() {
  permanentRedirect(localePath(await getLocale(), "/sell?type=store"));
}
