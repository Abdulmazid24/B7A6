import prisma from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { config } from "../../config";
import { AppError } from "../../utils/app-error";
import { AuditService } from "../audit/audit.service";
import { IPaginationOptions, calculatePagination } from "../../utils/pagination";
import { appCache } from "../../utils/cache";

const createCheckoutSession = async (studentId: string, tuitionFeeId: string) => {
  const tuitionFee = await prisma.tuitionFee.findUnique({
    where: { id: tuitionFeeId },
    include: {
      semester: true,
      student: {
        include: { profile: true },
      },
    },
  });

  if (!tuitionFee || tuitionFee.isDeleted) {
    throw new AppError(404, "Tuition fee invoice not found");
  }

  if (tuitionFee.studentId !== studentId) {
    throw new AppError(403, "You can only pay for your own tuition fee invoices");
  }

  if (tuitionFee.dueAmount <= 0 || tuitionFee.status === "PAID") {
    throw new AppError(400, "This tuition fee is already fully paid");
  }

  const pendingPayment = await prisma.payment.create({
    data: {
      studentId,
      tuitionFeeId,
      amount: tuitionFee.dueAmount,
      currency: "usd",
      status: "PENDING",
      paymentMethod: "STRIPE",
    },
  });

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: tuitionFee.student.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `University Tuition - ${tuitionFee.semester.name}`,
            description: `Tuition fee payment for Student ${
              tuitionFee.student.profile?.studentId || tuitionFee.student.email
            }`,
          },
          unit_amount: Math.round(tuitionFee.dueAmount * 100), // Stripe expects cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      tuitionFeeId: tuitionFee.id,
      studentId,
      paymentId: pendingPayment.id,
    },
    success_url: `${config.clientUrl}/api/v1/payments/verify?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.clientUrl}/api/v1/payments/cancelled`,
  });

  // Update payment with Stripe Session ID
  await prisma.payment.update({
    where: { id: pendingPayment.id },
    data: { stripeSessionId: session.id },
  });

  await AuditService.createAuditLog({
    userId: studentId,
    action: "STRIPE_CHECKOUT_SESSION_CREATED",
    resource: "Payment",
    details: {
      paymentId: pendingPayment.id,
      sessionId: session.id,
      amount: tuitionFee.dueAmount,
    },
  });

  return {
    paymentId: pendingPayment.id,
    sessionId: session.id,
    checkoutUrl: session.url,
  };
};

const handleWebhook = async (rawBody: Buffer, signature: string) => {
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe.webhookSecret
    );
  } catch (err: any) {
    throw new AppError(400, `Stripe Webhook Signature Verification Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata;

    if (metadata && metadata.paymentId) {
      await processSuccessfulPayment(session);
    }
  }

  return { received: true };
};

const verifyPaymentSession = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    throw new AppError(404, "Stripe session not found");
  }

  if (session.payment_status === "paid") {
    await processSuccessfulPayment(session);
  }

  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      tuitionFee: {
        include: { semester: true },
      },
    },
  });

  return payment;
};

const processSuccessfulPayment = async (session: any) => {
  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (!payment) {
    return;
  }

  if (payment.status === "COMPLETED") {
    return; // Already processed
  }

  await prisma.$transaction(async (tx) => {
    // 1. Mark Payment as completed
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        transactionId: session.id,
        paidAt: new Date(),
      },
    });

    // 2. Update Tuition Fee status
    const fee = await tx.tuitionFee.findUnique({
      where: { id: payment.tuitionFeeId },
    });

    if (fee) {
      const newPaid = fee.paidAmount + payment.amount;
      const newDue = Math.max(0, fee.totalAmount - newPaid);
      const newStatus = newDue === 0 ? "PAID" : "PARTIALLY_PAID";

      await tx.tuitionFee.update({
        where: { id: fee.id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
        },
      });
    }
  });

  await AuditService.createAuditLog({
    userId: payment.studentId,
    action: "TUITION_PAYMENT_COMPLETED",
    resource: "Payment",
    details: {
      paymentId: payment.id,
      amount: payment.amount,
      sessionId: session.id,
    },
  });

  appCache.del("ADMIN_DASHBOARD_STATS");
};

const getMyInvoices = async (studentId: string) => {
  const [tuitionFees, payments] = await Promise.all([
    prisma.tuitionFee.findMany({
      where: { studentId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: {
        semester: true,
      },
    }),
    prisma.payment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        tuitionFee: {
          include: { semester: true },
        },
      },
    }),
  ]);

  return {
    tuitionFees,
    payments,
  };
};

const getAllPayments = async (
  options: IPaginationOptions,
  filters: { status?: string; studentId?: string }
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.studentId) where.studentId = filters.studentId;

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
        tuitionFee: {
          include: {
            semester: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

export const PaymentService = {
  createCheckoutSession,
  handleWebhook,
  verifyPaymentSession,
  getMyInvoices,
  getAllPayments,
};
