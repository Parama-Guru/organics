export const en = {
  meta: {
    title: "Organic produce, straight from the farm",
    description:
      "Browse organic produce and call the farm yourself. Every farm is checked before its listings go live.",
    shopTitle: "Shop",
    shopDescription: "Everything our verified farms have listed right now.",
    farmersTitle: "Our farmers",
    farmersDescription: "The farms behind every listing, with their region and phone number.",
    sellTitle: "Sell with us",
    sellDescription:
      "List your organic produce and take enquiries yourself. We check every farm before its listings go live.",
    productNotFound: "Product not found",
    farmNotFound: "Farm not found",
  },

  nav: {
    skipToContent: "Skip to content",
    home: "Home",
    shop: "Shop",
    farmers: "Farmers",
    sell: "Sell with us",
    language: "Language",
    switchTo: "Switch to {language}",
  },

  home: {
    badge: "Every farm checked",
    titleLead: "Real food, grown the ",
    titleAccent: "slow way",
    titleTail: ".",
    intro:
      "We check every farm before its produce appears here. Find what you want, call the farmer yourself, and settle it between you. No middleman, no markup.",
    browse: "Browse produce",
    meetFarmers: "Meet the farmers",
    shopByCategory: "Shop by category",
    weeklyPick: "This week's pick",
    viewAll: "View all",
    emptyBefore: "The catalogue is empty. Run ",
    emptyAfter: " to load sample produce.",
  },

  products: {
    allProduce: "All produce",
    fromRegion: "from {region}",
    everythingNow: "Everything our verified farms have listed right now.",
    searchPlaceholder: "Search produce or region",
    searchLabel: "Search produce or region",
    search: "Search",
    category: "Category",
    region: "Region",
    all: "All",
    noMatch: "Nothing matches those filters",
    clearFilters: "Clear filters",
    contact: "Contact",
    view: "View",
    listedBy: "Listed by",
    perUnit: "per {unit}",
  },

  product: {
    backToShop: "Back to shop",
    grownIn: "grown in {region}",
    inStock: "{count} in stock",
    unavailable: "Currently unavailable",
    contactFarm: "Call {farm}",
  },

  contact: {
    eyebrow: "Talk to the farm directly",
    verified: "Checked farm",
    whatsapp: "WhatsApp",
    note: "Ask {seller} about price, quantity and how to collect it. We do not take orders and we do not take a cut.",
  },

  gallery: {
    images: "{name} images",
    view: "{name}, view {index}",
    show: "Show image {index} of {total}",
  },

  farmers: {
    everyFarmVerified: "Every farm checked",
    title: "Our farmers",
    intro:
      "We check a farm's details before any of its listings go live. Call them directly from any product page.",
    none: "No farms listed yet",
    applyToList: "List your farm",
    listingCount: "{count} listing",
    listingCountPlural: "{count} listings",
    growOrganic: "Grow organic produce?",
    applyHere: "List your farm here and take enquiries yourself.",
    backToAll: "All farmers",
    verified: "Checked farm",
    fromThisFarm: "From this farm",
    nothingListed: "Nothing listed from this farm right now.",
    callFarm: "Call {farm}",
  },

  sell: {
    badge: "For farmers",
    titleLead: "Sell what you grow, ",
    titleAccent: "without a middleman",
    titleTail: ".",
    intro:
      "We list organic farms only. Buyers see your farm name, your region and your phone number, and call you directly. We never handle the money.",
    step1Title: "Apply",
    step1Body: "Tell us about the farm, what you grow and how it is certified.",
    step2Title: "We check",
    step2Body: "We go through your details and call you. Nothing goes live until that is done.",
    step3Title: "Buyers call you",
    step3Body: "Your produce appears in the shop with your number on it. You take it from there.",
    applyHeading: "Apply to list",
  },

  application: {
    farmName: "Farm name",
    contactName: "Your name",
    email: "Email",
    phone: "Phone",
    phonePlaceholder: "+91 98765 43210",
    region: "Region",
    regionHint: "district or hills",
    regionPlaceholder: "Nilgiris",
    govtId: "Aadhaar last 4 digits",
    govtIdHint: "for the check",
    certificate: "Organic certificate link",
    optional: "optional",
    about: "About the farm",
    aboutHint: "at least 20 characters",
    aboutPlaceholder: "What you grow, how long you have farmed it, and how it is certified.",
    aadhaarNote: "We only ask for the last four digits. Never share the full number.",
    submit: "Send application",
    submitting: "Sending…",
    doneTitle: "Application received",
    doneBody:
      "We check every farm before its listings go live, so nothing appears in the shop yet. Expect a call on the number you gave us within a few working days.",
    checkFields: "Check: {fields}.",
  },

  footer: {
    copyright: "© {year} Organics. Organic produce, straight from the farm.",
    buyDirect: "Call the farm directly",
    farmerCta: "Are you a farmer? Sell with us",
  },

  // Keyed by the `code` the API returns, so wording is never sent over the wire.
  errors: {
    forbidden_origin: "That request was blocked. Please reload the page and try again.",
    rate_limited: "Too many attempts from this device. Please try again later.",
    body_too_large: "That is too long. Please shorten it and try again.",
    invalid_json: "Something went wrong sending that. Please try again.",
    invalid_fields: "Please check the highlighted details.",
    unknown: "Something went wrong. Please try again.",
    network: "Network error. Please try again.",
  },
} as const;

export type Dictionary = {
  readonly [K in keyof typeof en]: { readonly [P in keyof (typeof en)[K]]: string };
};
