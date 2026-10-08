import { z } from "zod";

const createCheckoutSessionValidationSchema = z.object({
  body: z.object({
    tuitionFeeId: z.string().uuid("Valid tuition fee ID is required"),
  }),
});

export const PaymentValidation = {
  createCheckoutSessionValidationSchema,
};
