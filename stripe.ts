import Stripe from "stripe";
export function stripeServer() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe lama dejin. Ku dar STRIPE_SECRET_KEY.");
  return new Stripe(key);
}