import { FarmerApplicationForm } from "@/components/farmer-application-form";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Sell with us",
  description:
    "Apply to list your certified organic produce on Organics. Every farm is verified before its listings go live.",
};

const steps = [
  {
    title: "Apply",
    body: "Tell us about the farm, what you grow and how it is certified.",
  },
  {
    title: "We verify",
    body: "We check your details and call you. Nothing is listed until this passes.",
  },
  {
    title: "List and sell",
    body: "Your produce appears in the shop, and buyers can call or book you directly.",
  },
];

export default function SellPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Badge tone="marigold">For farmers</Badge>
      <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
        Sell what you grow, <span className="text-marigold-600">without a middleman</span>.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-bark-600">
        We list certified organic farms only. Buyers see your farm name, your region and your
        phone number, and can book straight from the product page.
      </p>

      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            style={{ animationDelay: `${index * 80}ms` }}
            className="glass animate-rise rounded-2xl p-5"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-bark-900 font-display text-sm text-marigold-50"
            >
              {index + 1}
            </span>
            <h2 className="mt-3 font-display text-lg">{step.title}</h2>
            <p className="mt-1 text-sm text-bark-600">{step.body}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-14 font-display text-2xl">
        Apply to list
        <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-marigold-500" />
      </h2>
      <FarmerApplicationForm />
    </div>
  );
}
