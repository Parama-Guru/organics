import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type Enquiry = {
  id: string;
  subject: string;
  message: string;
  senderName: string;
  senderEmail: string | null;
  createdAt: Date;
  sellerReadAt: Date | null;
  deliveryStatus: "PENDING" | "SENT" | "FAILED";
};

function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat("ta-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function SellerEnquiryList({
  enquiries,
  setReadAction,
  empty,
  footer,
}: {
  enquiries: Enquiry[];
  setReadAction: (enquiryId: string, read: boolean) => Promise<void>;
  empty: string;
  footer?: ReactNode;
}) {
  if (enquiries.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-bark-200 bg-paper p-8 text-center text-bark-600">
        {empty}
      </div>
    );
  }

  return (
    <>
      <ul className="mt-6 grid gap-3">
        {enquiries.map((enquiry) => (
          <li
            key={enquiry.id}
            className={`rounded-2xl border bg-paper p-5 ${
              enquiry.sellerReadAt ? "border-bark-200" : "border-marigold-300"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg break-words text-bark-900">{enquiry.subject}</p>
                <p className="mt-1 text-sm text-bark-600">
                  {enquiry.senderName} · {dateLabel(enquiry.createdAt)}
                </p>
                {enquiry.senderEmail ? (
                  <a
                    href={`mailto:${enquiry.senderEmail}`}
                    className="mt-1 inline-block text-sm font-medium text-brand underline underline-offset-4"
                  >
                    நேரடியாகப் பதில் அனுப்ப: {enquiry.senderEmail}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-bark-600">
                    வாங்குபவர் மின்னஞ்சலைப் பகிரவில்லை. OSSIL நிர்வாகியிடம் இந்தக் குறிப்பைக்
                    கொண்டு பதில் சொல்லுங்கள்: {enquiry.id}
                  </p>
                )}
              </div>
              <form action={setReadAction.bind(null, enquiry.id, !enquiry.sellerReadAt)}>
                <Button type="submit" size="sm" variant={enquiry.sellerReadAt ? "ghost" : "primary"}>
                  {enquiry.sellerReadAt ? "படிக்காதது எனக் குறி" : "படித்ததாகக் குறி"}
                </Button>
              </form>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-bark-900">
              {enquiry.message}
            </p>
            {enquiry.deliveryStatus !== "SENT" ? (
              <p className="mt-3 rounded-xl bg-marigold-50 p-3 text-sm text-bark-700">
                மின்னஞ்சல் சென்றிருக்காமல் இருக்கலாம்; இந்தப் பதிவு பாதுகாப்பாக OSSIL-இல் உள்ளது.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {footer}
    </>
  );
}
