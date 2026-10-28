# XirfadCRM — SaaS CRM Starter (Af-Soomaali)

Mashruuc Next.js + Supabase + Stripe ah oo leh:
- Login / isdiiwaangelin (Supabase Auth)
- Macaamiil: ku dar, arag, tirtir
- Heshiisyo iib: ku dar, arag
- Hawlo: ku dar, dhammaystir
- Dashboard iyo tirokoob
- Qorshayaal lacag-bixin oo Stripe Checkout ku xiran
- PostgreSQL database iyo Row Level Security (RLS)

## Waxa muhiimka ah
Kani waa mashruuc bilow ah oo koodhkiisu diyaar yahay, mana aha adeeg internet-ka lagu daabacay ama payment production ah oo hore loo xaqiijiyey. Si dhab ah u shaqeeyo waa inaad abuurtaa oo ku xidhataa Supabase, Stripe, iyo hosting. Stripe account availability/payout eligibility waxay ku xiran tahay dalka iyo shuruudaha Stripe; xaqiiji in akoonkaaga ganacsi si sharci ah u qalmo ka hor intaadan ku tiirsanaan. Ha isticmaalin cinwaan ama dukumenti been ah.

## 1. Waxa aad u baahan tahay
- Node.js 20+
- Supabase project: https://supabase.com
- Stripe account eligible for your business: https://stripe.com
- Hosting sida Vercel: https://vercel.com

## 2. Samee database-ka
Supabase → SQL Editor → New query → ku dheji oo orod `supabase/schema.sql`.

## 3. Dejinta environment variables
Nuqul ka samee `.env.example` una bixi `.env.local`, kadib buuxi:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `NEXT_PUBLIC_APP_URL` (local: `http://localhost:3000`)

Stripe Dashboard gudaheeda samee recurring monthly prices, kadib ku qor Price IDs-ka `.env.local`. Webhook endpoint-ka marka la daabaco waa `/api/stripe/webhook`; ku dar event `checkout.session.completed` iyo `customer.subscription.deleted`. Local test waxaad isticmaali kartaa Stripe CLI.

## 4. Ku rakib oo socodsii
```bash
npm install
npm run dev
```
Fur `http://localhost:3000`.

## 5. Tijaabinta payments
Isticmaal Stripe test keys iyo test cards oo keliya inta aad tijaabinayso. App-ku wuxuu abuuraa Checkout Session, laakiin webhook-ku wuxuu update-gareeyaa subscription status. Production ka hor ku dar billing portal, dunning, invoice/email flows, logging, and automated tests.

## 6. Soo saar internet-ka
Ku xidh GitHub, deploy garee Vercel, deji environment variables-ka production, kadib ku dar domain-kaaga iyo Supabase Auth redirect URLs. Ku dar Stripe webhook URL-ga production.

## Amniga ka hor iibinta
- Dib u eeg RLS policies iyo tests.
- Ku dar email verification/password reset, rate limiting, abuse protection, backups, monitoring, terms/privacy policy, support process.
- Ha gelin Stripe secret key ama Supabase service role key frontend code-ka.
- Tani waa starter code, mana aha audit amni ama dammaanad production readiness.

## Milkiilaha (Super Admin) iyo paid-only access

1. `SUPER_ADMIN_EMAILS` ku qor email-kaaga saxda ah (haddii ay jiraan dhowr, comma ku kala saar). Email-ka waa server-side env variable; ha ka dhigin `NEXT_PUBLIC_...`.
2. Ku dar `SUPABASE_SERVICE_ROLE_KEY` gudaha `.env.local` iyo hosting environment-ka. Furahan waa sir aad u xasaasi ah, wuxuuna yaallaa server-ka oo keliya.
3. Socodsii `supabase/schema.sql`. Haddii database hore u jiray, SQL-ku wuxuu ku darayaa `access_suspended` wuxuuna beddelayaa policies-ka. Hubi in policies-ka hore la beddelay.
4. Ku qor email-kaaga dhabta ah `SUPER_ADMIN_EMAILS` (tusaale `owner@yourdomain.com`) ka hor intaadan deploy-gareyn. Markaad gasho email-kaas, tab-ka **Maamulka** ayaa kuu muuqanaya. Waxaad ku maamuli kartaa browser-ka telefoonka ama computer-ka. Halkaas waxaad ku arki kartaa tirakoobka iyo liiska akoonnada, waadna xannibi/furi kartaa akoon.
5. Akoon aan lahayn `subscription_status='active'` iyo plan `starter` ama `pro` ma geli karo CRM-ka. RLS-ku wuxuu xaddidaadda ku dabaqaa database-ka, ma aha UI oo keliya.

## Payments — xaqiijin muhiim ah

Stripe integration-ku wuxuu u baahan yahay Stripe account iyo Price IDs sax ah. Stripe ma liis gareeyo Soomaaliya waddamada uu si toos ah uga taageero akoon ganacsi, sidaas darteed ha u qaadan in Stripe checkout-ku Soomaaliya ka shaqayn doono. Xaqiiji gateway-ga iyo payout eligibility-ga ka hor launch. Bogga rasmiga ah ee Stripe: https://stripe.com/global. 2Checkout/Verifone wuxuu ku taxaa Soomaaliya boggiisa dalalka, laakiin codsiga merchant-ka iyo payouts-ka waa in si toos ah loo xaqiijiyaa ka hor inta aan la isku xirin.

## Launch checklist

- Samee Supabase project oo tijaabi in user A aanu arki karin xogta user B.
- Ku tijaabi webhook event-yada `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Ku tijaabi in user aan lacag bixin iyo user la xannibay aysan akhrin/qorin customers, deals ama tasks.
- Ku tijaabi admin endpoint in email aan ku jirin `SUPER_ADMIN_EMAILS` uu helo 403.
- Ku dar password reset, email verification, MFA milkiilaha, backups, privacy/terms, error monitoring, rate limiting, automated RLS tests iyo review amni ka hor iibinta.
