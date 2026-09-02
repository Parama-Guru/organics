import { redirect } from "next/navigation";

import { setFarmerEnquiryReadAction } from "@/app/pannai/actions";
import { SellerEnquiryList } from "@/components/seller-enquiry-list";
import { FARMER_PORTAL, getFarmer } from "@/lib/farmer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FarmerEnquiriesPage() {
  const farmer = await getFarmer();
  if (!farmer) redirect(`${FARMER_PORTAL}/sign-in`);

  const rows = await prisma.privateEnquiry.findMany({
    where: { farmerId: farmer.id },
    orderBy: [{ sellerReadAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      subject: true,
      message: true,
      senderEmail: true,
      shareEmail: true,
      createdAt: true,
      sellerReadAt: true,
      deliveryStatus: true,
      customer: { select: { name: true } },
    },
  });
  const enquiries = rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    message: row.message,
    senderName: row.customer.name,
    senderEmail: row.shareEmail ? row.senderEmail : null,
    createdAt: row.createdAt,
    sellerReadAt: row.sellerReadAt,
    deliveryStatus: row.deliveryStatus,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl text-bark-900">வாங்குபவர் விசாரணைகள்</h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-bark-600">
        வாங்குபவர் அனுமதித்தால் மட்டும் அவருடைய மின்னஞ்சல் தெரியும். இல்லையெனில் குறிப்பெண்ணுடன்
        Organics நிர்வாகி வழியாகப் பதில் சொல்லுங்கள்.
      </p>
      <SellerEnquiryList
        enquiries={enquiries}
        setReadAction={setFarmerEnquiryReadAction}
        empty="உங்கள் பண்ணைக்கு இன்னும் விசாரணை வரவில்லை."
      />
    </div>
  );
}