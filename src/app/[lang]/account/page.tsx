import Image from "next/image";
import Link from "next/link";

import { AccessCard } from "@/components/access-card";
import { GlassPanel } from "@/components/glass-panel";
import { DeleteAccountForm, EmailVerificationButton, GoogleDeleteForm, GoogleUnlinkButton, PasswordForm } from "@/components/account-security";
import { GoogleSignIn } from "@/components/google-sign-in";
import { ProductCard } from "@/components/product-card";
import { ProfileForm } from "@/components/profile-form";
import { SaveButton } from "@/components/save-button";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { BasketIcon, LeafMark, MapPinIcon, PhoneIcon, UserIcon } from "@/components/ui/icons";
import { dialNumber, showFarmerPhone } from "@/components/farmer-contact";
import { getCustomerAccess } from "@/lib/customer-access";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { emailVerificationAvailable } from "@/lib/email-verification";
import { googleOAuthEnabled } from "@/lib/google-auth";
import { format, localePath } from "@/lib/i18n/config";
import { regionLabel } from "@/lib/i18n/content";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getSavedFarmers, getSavedProducts } from "@/lib/saved";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.account.title, robots: { index: false, follow: false } };
}

export default async function AccountPage({ searchParams }: PageProps<"/[lang]/account">) {
  if (!accountsEnabled()) notFound();

  const [locale, t, customer, params] = await Promise.all([
    getLocale(),
    getDictionary(),
    getCustomer(),
    searchParams,
  ]);
  if (!customer) redirect(localePath(locale, "/account/sign-in"));
  if (!customer.profileCompletedAt) redirect(localePath(locale, "/account/onboarding"));

  const problem =
    params.problem === "confirm" ||
    params.problem === "password" ||
    params.problem === "billing"
      ? params.problem
      : null;
  const verification = params.verified === "1" || params.verified === "expired"
    ? params.verified
    : null;
  const oauthMessages = {
    invalid: t.account.oauthInvalid,
    unverified: t.account.oauthUnverified,
    alreadyLinked: t.account.oauthLinkedElsewhere,
    emailInUse: t.account.oauthEmailInUse,
    wrongGoogle: t.account.oauthWrongGoogle,
    unavailable: t.account.oauthUnavailable,
    rateLimited: t.account.errorRateLimited,
    lastSignInMethod: t.account.unlinkNeedsPassword,
    badCurrentPassword: t.account.errorCurrentPassword,
    billing: t.account.deleteBillingFailed,
  } as const;
  const oauthCode = typeof params.oauth === "string" ? params.oauth : "";
  const oauthMessage = oauthMessages[oauthCode as keyof typeof oauthMessages] ?? null;
  const invalidNewPassword = params.password === "invalid";

  const [products, farmers, access] = await Promise.all([
    getSavedProducts(customer.id),
    getSavedFarmers(customer.id),
    getCustomerAccess(customer.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <GlassPanel as="section" className="rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-leaf-100 text-2xl text-leaf-800"
            >
              <UserIcon />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-3xl break-words sm:text-4xl">
                {format(t.account.greeting, { name: customer.name })}
              </h1>
              {/* An email address is one long token; without break-all it pushes
                  the whole page sideways on a 320px screen. */}
              <p className="mt-1 break-all text-bark-600">{customer.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-bark-200/60 pt-5">
          <div>
            <dt className="text-sm text-bark-600">{t.account.savedProduce}</dt>
            <dd className="font-display text-3xl text-brand">{products.length}</dd>
          </div>
          <div>
            <dt className="text-sm text-bark-600">{t.account.savedFarms}</dt>
            <dd className="font-display text-3xl text-brand">{farmers.length}</dd>
          </div>
        </dl>
      </GlassPanel>

      <div className="mt-6">
        <AccessCard access={access} locale={locale} t={t} compact />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl sm:text-3xl">
          {t.account.savedProduce}
          <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-leaf-500" />
        </h2>

        {products.length === 0 ? (
          <GlassPanel className="mt-5 rounded-3xl p-10 text-center">
            <BasketIcon className="mx-auto text-5xl text-bark-200" />
            <p className="mt-4 text-ink">{t.account.noSavedProduce}</p>
            <Button as={Link} href={localePath(locale, "/products")} className="mt-5">
              {t.account.browseProduce}
            </Button>
          </GlassPanel>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-2">
                <ProductCard product={product} />
                <SaveButton kind="product" id={product.id} initialSaved size="sm" full removeLabel />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl sm:text-3xl">
          {t.account.savedFarms}
          <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-marigold-500" />
        </h2>

        {farmers.length === 0 ? (
          <GlassPanel className="mt-5 rounded-3xl p-10 text-center">
            <LeafMark className="mx-auto text-5xl text-bark-200" />
            <p className="mt-4 text-ink">{t.account.noSavedFarms}</p>
            <Button as={Link} href={localePath(locale, "/farmers")} className="mt-5">
              {t.account.browseFarms}
            </Button>
          </GlassPanel>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {farmers.map((farmer) => (
              <li key={farmer.id}>
                <GlassPanel
                  as="article"
                  className="flex h-full flex-col overflow-hidden rounded-3xl"
                >
                  <div className="relative aspect-[16/6] bg-leaf-50">
                    {farmer.photoUrl ? (
                      <Image
                        src={farmer.photoUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-xl break-words">
                      <Link
                        href={localePath(locale, `/farmers/${farmer.slug}`)}
                        className="decoration-marigold-500 decoration-2 underline-offset-4 hover:underline"
                      >
                        {farmer.farmName}
                      </Link>
                    </h3>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-bark-600">
                      <MapPinIcon /> {regionLabel(locale, farmer.region)}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                      {showFarmerPhone() && access.allowed ? (
                        <Button as="a" href={`tel:${dialNumber(farmer.phone)}`} size="sm">
                          <PhoneIcon /> {farmer.phone}
                        </Button>
                      ) : null}
                      <SaveButton kind="farmer" id={farmer.id} initialSaved size="sm" removeLabel />
                    </div>
                  </div>
                </GlassPanel>
              </li>
            ))}
          </ul>
        )}
      </section>

      <GlassPanel as="section" className="mt-12 rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-2xl sm:text-3xl">{t.account.profile}</h2>
        <p className="mt-2 text-ink">{t.account.profileIntro}</p>
        <div className="mt-5 rounded-2xl border border-bark-200 bg-white/70 p-4">
          <p className={customer.emailVerifiedAt ? "font-medium text-leaf-700" : "font-medium text-bark-900"}>
            {customer.emailVerifiedAt ? t.account.emailVerified : t.account.emailUnverified}
          </p>
          {!customer.emailVerifiedAt ? (
            <>
              <p className="mt-1 text-sm text-bark-600">{t.account.emailVerifyWhy}</p>
              {emailVerificationAvailable() ? <EmailVerificationButton /> : null}
            </>
          ) : null}
          {verification === "1" ? <p className="mt-2 text-sm text-leaf-700">{t.account.emailVerified}</p> : null}
          {verification === "expired" ? <p className="mt-2 text-sm text-red-700">{t.account.emailVerifyExpired}</p> : null}
        </div>
        <ProfileForm
          name={customer.name}
          phone={customer.phone ?? ""}
          region={customer.region?.name ?? ""}
          profileLocale={customer.locale}
        />
        <p className="mt-6 border-t border-bark-200/60 pt-4 text-sm leading-relaxed text-bark-600">
          {t.account.privacyNote}
        </p>
      </GlassPanel>

      <GlassPanel as="section" className="mt-8 rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-2xl sm:text-3xl">{t.account.security}</h2>
        {params.passwordAdded === "1" ? (
          <p role="status" className="mt-3 text-sm font-medium text-leaf-700">
            {t.account.savedChanges}
          </p>
        ) : null}
        <PasswordForm
          hasPassword={customer.hasPassword}
          googleLinked={customer.googleLinked}
          invalidNewPassword={invalidNewPassword}
        />
      </GlassPanel>

      <GlassPanel as="section" className="mt-8 rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-2xl sm:text-3xl">{t.account.googleSecurity}</h2>
        {oauthMessage ? (
          <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {oauthMessage}
          </p>
        ) : null}
        {customer.googleLinked ? (
          <>
            <p className="mt-3 font-medium text-leaf-700">{t.account.googleLinked}</p>
            <GoogleUnlinkButton canUnlink={customer.hasPassword} />
          </>
        ) : googleOAuthEnabled() ? (
          <div className="mt-5 max-w-sm">
            <GoogleSignIn
              locale={locale}
              next={localePath(locale, "/account")}
              label={t.account.linkGoogle}
              passwordLabel={t.account.currentPassword}
              intent="link"
            />
          </div>
        ) : (
          <p className="mt-3 text-bark-600">{t.account.googleNotLinked}</p>
        )}
      </GlassPanel>

      <section className="mt-8 rounded-3xl border border-red-200 bg-red-50/60 p-6 sm:p-8">
        <h2 className="font-display text-2xl text-red-900 sm:text-3xl">{t.account.dangerTitle}</h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-red-900">{t.account.dangerBody}</p>
        {customer.hasPassword ? (
          <DeleteAccountForm problem={problem} />
        ) : customer.googleLinked ? (
          <GoogleDeleteForm invalid={problem === "confirm"} />
        ) : (
          <p className="mt-4 text-sm font-medium text-red-900">{t.account.deleteNeedsPassword}</p>
        )}
      </section>
    </div>
  );
}
