import { NextResponse, type NextRequest } from "next/server";

import { consumeEmailVerification } from "@/lib/email-verification";
import { DEFAULT_LOCALE, isEnabledLocale, localePath } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawLocale = request.nextUrl.searchParams.get("locale");
  const locale = isEnabledLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const customerId = token ? await consumeEmailVerification(token).catch(() => null) : null;

  if (!customerId) {
    return NextResponse.redirect(
      new URL(`${localePath(locale, "/account")}?verified=expired`, request.url),
    );
  }

  await prisma.customer.updateMany({
    where: { id: customerId, status: "ACTIVE" },
    data: { emailVerifiedAt: new Date() },
  });
  return NextResponse.redirect(
    new URL(`${localePath(locale, "/account")}?verified=1`, request.url),
  );
}
