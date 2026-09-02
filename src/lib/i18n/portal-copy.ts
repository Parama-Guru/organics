import type { Locale } from "./config";

/**
 * Copy for the seller sign-in screens, which sit outside `/[lang]` and so have
 * no dictionary of their own. Only the pages a seller can reach before they are
 * signed in are translated: the workspace behind the login stays Tamil, because
 * that is the language its users work in.
 */
export type PortalCopy = {
  farmTitle: string;
  farmIntro: string;
  storeTitle: string;
  storeIntro: string;
  email: string;
  password: string;
  submit: string;
  working: string;
  language: string;
  switchTo: string;
  farmNoAccess: string;
  farmForgot: string;
  storeNoAccess: string;
  storeForgot: string;
  errorBadCredentials: string;
  errorRateLimited: string;
  errorUnavailable: string;
  errorInviteExpired: string;
  errorEmailPassword: string;
  errorInvalid: string;
  newPassword: string;
  minCharacters: string;
  setPassword: string;
  adminTitle: string;
  adminIntro: string;
  adminPassphrase: string;
  adminSubmit: string;
  adminChecking: string;
  adminBadPassphrase: string;
  adminBlocked: string;
  adminMissing: string;
  adminNetwork: string;
};

const ta: PortalCopy = {
  farmTitle: "பண்ணை நிர்வாகம்",
  farmIntro: "உங்கள் பொருட்களைச் சேர்க்கவும் திருத்தவும் நீக்கவும் இங்கே உள்ளே செல்லுங்கள்.",
  storeTitle: "கடை நிர்வாகம்",
  storeIntro: "உங்கள் கடை விவரங்களையும் வாங்குபவர் விசாரணைகளையும் இங்கே பார்க்கலாம்.",
  email: "மின்னஞ்சல்",
  password: "கடவுச்சொல்",
  submit: "உள்ளே செல்ல",
  working: "ஒரு நிமிடம்…",
  language: "மொழி",
  switchTo: "{language} மொழிக்கு மாற்று",
  farmNoAccess:
    "இன்னும் அணுகல் இல்லையா? உங்கள் பண்ணையை நாங்கள் சரிபார்த்த பிறகு ஒரு அழைப்பு இணைப்பை அனுப்புவோம்.",
  farmForgot:
    "கடவுச்சொல் மறந்துவிட்டதா? எங்களை அழையுங்கள் — புதிய இணைப்பு அனுப்புகிறோம். பழைய கடவுச்சொல் அப்போது வேலை செய்யாது.",
  storeNoAccess:
    "இன்னும் அணுகல் இல்லையா? உங்கள் கடையைச் சரிபார்த்த பிறகு OSSIL ஒரு அழைப்பு இணைப்பை அனுப்பும்.",
  storeForgot:
    "கடவுச்சொல் மறந்துவிட்டதா? நிர்வாகியிடம் புதிய இணைப்பு கேளுங்கள். அந்த இணைப்பைப் பயன்படுத்தியதும் பழைய கடவுச்சொல் வேலை செய்யாது.",
  errorBadCredentials: "அந்த மின்னஞ்சலும் கடவுச்சொல்லும் பொருந்தவில்லை.",
  errorRateLimited: "மிகப் பல முயற்சிகள். சுமார் 15 நிமிடங்கள் கழித்து முயலுங்கள்.",
  errorUnavailable: "இந்தப் பகுதி இப்போது கிடைக்கவில்லை.",
  errorInviteExpired: "இந்த அழைப்பு காலாவதியாகிவிட்டது. நிர்வாகியிடம் புதிதாகக் கேளுங்கள்.",
  errorEmailPassword: "மின்னஞ்சலில் உள்ள பெயரை கடவுச்சொல்லில் பயன்படுத்த வேண்டாம்.",
  errorInvalid: "குறியிட்ட பகுதியைச் சரிபார்க்கவும்.",
  newPassword: "புதிய கடவுச்சொல்",
  minCharacters: "குறைந்தது 10 எழுத்துகள்",
  setPassword: "கடவுச்சொல்லை அமைக்க",
  adminTitle: "உள்ளே செல்ல",
  adminIntro:
    "இந்தப் பகுதி சரிபார்ப்பு, பட்டியல், விசாரணை, விளம்பரம், வாடிக்கையாளர் ஆதரவை நிர்வகிக்கிறது. பொதுத் தளத்திலிருந்து இணைக்கப்படவில்லை.",
  adminPassphrase: "நிர்வாக கடவுச்சொல்",
  adminSubmit: "உள்ளே செல்ல",
  adminChecking: "சரிபார்க்கிறது…",
  adminBadPassphrase: "அந்தக் கடவுச்சொல் சரியானது அல்ல.",
  adminBlocked: "அந்த கோரிக்கை தடுக்கப்பட்டது. பக்கத்தை மீண்டும் ஏற்றி முயலுங்கள்.",
  adminMissing: "இந்தப் பயன்பாட்டில் நிர்வாகப் பகுதி அமைக்கப்படவில்லை.",
  adminNetwork: "இணைப்புச் சிக்கல். மீண்டும் முயலுங்கள்.",
};

const en: PortalCopy = {
  farmTitle: "Farm workspace",
  farmIntro: "Sign in to add, edit and remove your listings.",
  storeTitle: "Store workspace",
  storeIntro: "Sign in to manage your shop details and read buyer enquiries.",
  email: "Email",
  password: "Password",
  submit: "Sign in",
  working: "One moment…",
  language: "Language",
  switchTo: "Switch to {language}",
  farmNoAccess:
    "No access yet? We send an invite link once your farm has been checked.",
  farmForgot:
    "Forgotten the password? Call us and we will send a fresh link. The old password stops working when you use it.",
  storeNoAccess:
    "No access yet? OSSIL sends an invite link once your shop has been checked.",
  storeForgot:
    "Forgotten the password? Ask staff for a fresh link. The old password stops working as soon as that link is used.",
  errorBadCredentials: "That email and password do not match.",
  errorRateLimited: "Too many attempts. Wait about 15 minutes and try again.",
  errorUnavailable: "This area is unavailable right now.",
  errorInviteExpired: "That invite has expired. Ask staff for a new one.",
  errorEmailPassword: "Do not use the name in your email address as the password.",
  errorInvalid: "Check the highlighted field.",
  newPassword: "New password",
  minCharacters: "at least 10 characters",
  setPassword: "Set password",
  adminTitle: "Sign in",
  adminIntro:
    "This area manages verification, listings, enquiries, sponsorships and buyer support. It is not linked from the public site.",
  adminPassphrase: "Admin passphrase",
  adminSubmit: "Sign in",
  adminChecking: "Checking…",
  adminBadPassphrase: "That passphrase is not right.",
  adminBlocked: "That request was blocked. Reload the page and try again.",
  adminMissing: "The admin area is not configured on this deployment.",
  adminNetwork: "Network error. Please try again.",
};

export const PORTAL_COPY: Record<Locale, PortalCopy> = { ta, en };
