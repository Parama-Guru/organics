export const en = {
  meta: {
    title: "Certified organic produce, straight from the farm",
    description:
      "Browse certified organic produce and contact the farm directly. Every farmer is verified before their produce is listed.",
    shopTitle: "Shop",
    shopDescription:
      "Browse the full range of certified organic produce, dairy and pantry staples.",
    farmersTitle: "Our farmers",
    farmersDescription:
      "The verified organic farms behind the shop, listed with their region and what they grow.",
    sellTitle: "Sell with us",
    sellDescription:
      "Apply to list your certified organic produce. Every farm is verified before its listings go live.",
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
    badge: "Certified organic",
    titleLead: "Real food, grown the ",
    titleAccent: "slow way",
    titleTail: ".",
    intro:
      "Every farm here is verified before its produce is listed. Find what you want, then call the farmer directly and arrange it yourself. No middleman, no markup.",
    browse: "Browse produce",
    meetFarmers: "Meet the farmers",
    shopByCategory: "Shop by category",
    weeklyPick: "This week's pick",
    viewAll: "View all",
    emptyBefore: "The catalog is empty. Run ",
    emptyAfter: " to load sample produce.",
  },

  products: {
    allProduce: "All produce",
    fromRegion: "from {region}",
    everythingNow: "Everything we are harvesting and stocking right now.",
    searchPlaceholder: "Search produce or region",
    searchLabel: "Search produce or region",
    search: "Search",
    category: "Category",
    region: "Region",
    all: "All",
    noMatch: "Nothing matches those filters",
    clearFilters: "Clear all filters",
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
    contactFarm: "Contact {farm}",
    contactUs: "Contact us to order",
  },

  farmers: {
    everyFarmVerified: "Every farm verified",
    title: "Our farmers",
    intro:
      "We check each farm's details before a single listing goes live. Call them directly, or book from any product page.",
    none: "No farms listed yet",
    applyToList: "Apply to list your farm",
    listingCount: "{count} listing",
    listingCountPlural: "{count} listings",
    growOrganic: "Grow organic produce?",
    applyHere: "Apply to list your farm here.",
    backToAll: "All farmers",
    verified: "Verified farmer",
    fromThisFarm: "From this farm",
    nothingListed: "Nothing listed from this farm right now.",
  },

  booking: {
    heading: "Buy direct from {seller}",
    stockedBy: "Stocked and listed by Organics.",
    open: "Book without paying now",
    close: "Close booking form",
    received: "Booking received.",
    referenceBefore: "Your reference is ",
    referenceAfter: ". {seller} will call you to confirm quantity and timing.",
    yourName: "Your name",
    phone: "Phone",
    phonePlaceholder: "+91 98765 43210",
    quantity: "Quantity ({unit})",
    quantityLabel: "Quantity in {unit}",
    preferredDate: "Preferred date",
    optional: "optional",
    note: "Note",
    notePlaceholder: "Anything {seller} should know about this request",
    submit: "Request {product}",
    submitting: "Sending…",
  },

  sell: {
    badge: "For farmers",
    titleLead: "Sell what you grow, ",
    titleAccent: "without a middleman",
    titleTail: ".",
    intro:
      "We list certified organic farms only. Buyers see your farm name, your region and your phone number, and can book straight from the product page.",
    step1Title: "Apply",
    step1Body: "Tell us about the farm, what you grow and how it is certified.",
    step2Title: "We verify",
    step2Body: "We check your details and call you. Nothing is listed until this passes.",
    step3Title: "List and sell",
    step3Body:
      "Your produce appears in the shop, and buyers can call or book you directly.",
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
    govtIdHint: "for verification",
    certificate: "Organic certificate link",
    optional: "optional",
    about: "About the farm",
    aboutHint: "at least 20 characters",
    aboutPlaceholder:
      "What you grow, how long you have farmed it, and how it is certified.",
    aadhaarNote:
      "We only ask for the last four digits of your Aadhaar. Never share the full number.",
    submit: "Send application",
    submitting: "Sending…",
    doneTitle: "Application received",
    doneBody:
      "We check every farm before its listings go live, so nothing appears in the shop yet. Expect a call on the number you gave us within a few working days.",
    checkFields: "Check: {fields}.",
  },

  footer: {
    copyright: "© {year} Organics. Certified organic, straight from the farm.",
    buyDirect: "Buy direct from the farm",
    farmerCta: "Are you a farmer? Sell with us",
  },

  // Keyed by the `code` the API returns, so the wording is never sent over the wire.
  errors: {
    forbidden_origin: "That request was blocked. Please reload the page and try again.",
    rate_limited: "Too many attempts from this device. Please try again later.",
    body_too_large: "That is too long. Please shorten it and try again.",
    invalid_json: "Something went wrong sending that. Please try again.",
    invalid_fields: "Please check the highlighted details.",
    product_unavailable: "That listing is no longer available.",
    insufficient_stock: "Only {available} left. Please reduce the quantity.",
    unknown: "Something went wrong. Please try again.",
    network: "Network error. Please try again.",
  },
} as const;

export type Dictionary = {
  readonly [K in keyof typeof en]: { readonly [P in keyof (typeof en)[K]]: string };
};
