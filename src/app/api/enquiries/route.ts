import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCustomerAccess } from "@/lib/customer-access";
import { getCustomer } from "@/lib/customer-auth";
import { deliverPrivateEnquiry, safeDeliveryError } from "@/lib/enquiry-delivery";
import { privateEnquirySchema } from "@/lib/enquiry-schema";
import { mailConfigured } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { readBoundedJson } from "@/lib/request-body";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/same-origin";
import { consumeRateLimit } from "@/lib/session-store";
import { publicStoreWhere } from "@/lib/stores";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ code: "forbidden_origin" }, { status: 403 });
  }

  const customer = await getCustomer();
  if (!customer || !customer.profileCompletedAt) {
    return NextResponse.json({ code: "not_signed_in" }, { status: 401 });
  }
  const access = await getCustomerAccess(customer.id);
  if (!access.allowed) {
    return NextResponse.json({ code: "access_expired" }, { status: 403 });
  }

  const body = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!body.ok) {
    return NextResponse.json(
      { code: body.tooLarge ? "body_too_large" : "invalid_json" },
      { status: body.tooLarge ? 413 : 400 },
    );
  }

  const parsed = privateEnquirySchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "invalid_fields", fields: Object.keys(z.flattenError(parsed.error).fieldErrors) },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const clientKey = clientKeyFromHeaders(request.headers);
  const recipientBucket = `${input.recipientType.toLowerCase()}:${input.recipientId}`;
  const [byCustomer, byRecipient, byIp] = await Promise.all([
    consumeRateLimit(`enquiry-customer:${customer.id}`, 10, 3_600),
    consumeRateLimit(`enquiry-recipient:${recipientBucket}`, 20, 86_400),
    consumeRateLimit(`enquiry-ip:${clientKey}`, 30, 3_600),
  ]);
  const local = rateLimit(`enquiry:${clientKey}`, 30, 3_600_000);
  if (!byCustomer.allowed || !byRecipient.allowed || !byIp.allowed || !local.allowed) {
    return NextResponse.json(
      { code: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(
              byCustomer.retryAfterSeconds,
              byRecipient.retryAfterSeconds,
              byIp.retryAfterSeconds,
              local.retryAfterSeconds,
              60,
            ),
          ),
        },
      },
    );
  }

  const recipient =
    input.recipientType === "FARMER"
      ? await prisma.farmer.findFirst({
          where: {
            id: input.recipientId,
            status: "VERIFIED",
            certifiedUntil: { gte: new Date() },
          },
          select: { id: true, email: true, farmName: true },
        })
      : await prisma.organicStore.findFirst({
          where: { id: input.recipientId, ...publicStoreWhere() },
          select: { id: true, email: true, storeName: true },
        });

  if (!recipient) return NextResponse.json({ code: "not_found" }, { status: 404 });
  const recipientName = "farmName" in recipient ? recipient.farmName : recipient.storeName;
  const replyTo = input.shareEmail && customer.emailVerifiedAt ? customer.email : undefined;

  const duplicate = await prisma.privateEnquiry.findFirst({
    where: {
      customerId: customer.id,
      ...(input.recipientType === "FARMER"
        ? { farmerId: recipient.id }
        : { storeId: recipient.id }),
      subject: input.subject,
      message: input.message,
      createdAt: { gte: new Date(Date.now() - 3_600_000) },
    },
    include: { customer: { select: { name: true } } },
  });
  if (duplicate) {
    return NextResponse.json({ code: "duplicate_enquiry" }, { status: 409 });
  }

  const enquiry = await prisma.privateEnquiry.create({
    data: {
      customerId: customer.id,
      ...(input.recipientType === "FARMER"
        ? { farmerId: recipient.id }
        : { storeId: recipient.id }),
      senderEmail: customer.email,
      recipientName,
      recipientEmail: recipient.email,
      subject: input.subject,
      message: input.message,
      shareEmail: Boolean(replyTo),
    },
    include: { customer: { select: { name: true } } },
  });

  if (!mailConfigured()) {
    return NextResponse.json({ received: true, delivery: "stored" }, { status: 201 });
  }

  try {
    await deliverPrivateEnquiry(enquiry);
    await prisma.privateEnquiry.update({
      where: { id: enquiry.id },
      data: { deliveryStatus: "SENT", deliveryAttempts: 1, sentAt: new Date() },
    });
    return NextResponse.json({ received: true, delivery: "sent" }, { status: 201 });
  } catch (error) {
    await prisma.privateEnquiry.update({
      where: { id: enquiry.id },
      data: {
        deliveryStatus: "FAILED",
        deliveryAttempts: 1,
        lastDeliveryError: safeDeliveryError(error),
      },
    });
    return NextResponse.json({ received: true, delivery: "stored" }, { status: 201 });
  }
}
