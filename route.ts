import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { stripeServer } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Fadlan marka hore gal akoonkaaga." }, { status: 401 });
    const { plan } = await req.json();
    const price = plan === "starter" ? process.env.STRIPE_PRICE_STARTER : plan === "pro" ? process.env.STRIPE_PRICE_PRO : null;
    if (!price) return NextResponse.json({ error: "Qorshahan lama dejin. Ku dar Stripe Price ID." }, { status: 400 });
    const stripe = stripeServer();
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription", line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/?payment=success`, cancel_url: `${origin}/?payment=cancelled`,
      client_reference_id: user.id, customer_email: user.email,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } }
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout error." }, { status: 500 });
  }
}