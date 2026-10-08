import Stripe from "stripe";
import { config } from "../config";

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2026-03-25.acacia" as any,
  typescript: true,
});
