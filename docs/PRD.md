# PRD – National Trader Marketing Website
**One-liner:** A fast, mobile-first showcase site for National Trader (Bhiwandi), a retail + wholesale home & kitchen store, that turns Instagram/YouTube viewers into WhatsApp orders.
**Type:** Web app (React + Vite SPA) · **Goal:** Freelance build for a friend · **Phase:** Build (v1)

## 1. Problem
The shop reaches thousands via Reels/Shorts (₹20–₹100 deals, unboxing and comparison videos) but has no single link showing all products, prices, branches and wholesale terms.
## 2. Evidence (from shared channel screenshots)
Steel cookware/plates, pressure cookers (Prince, Shuddhi, Doctor's Choice), mixer grinders (Orient ₹2,700, Sumeet ₹1,800), dinner sets (₹550/650/750), glass tea cups (₹20), Cello glassware, 3-tier plastic rack (₹99), thermos bottles (₹100), water bottles (wholesale ₹18), mop sets, baskets, raincoats/umbrellas, RO purifiers, gas stoves, study tables. Branches: Bhiwandi Branch 1 & 2, Shanti Nagar, Koter Gate. "Delivery all India", retail + wholesale.
## 3. Audience
Middle/low-income households (value, trust, visible prices), small shopkeepers (wholesale), gift/wedding/Eid buyers. Mostly phones, arriving from social links.
## 4. Flow
Hero (headline, price stickers, WhatsApp CTA) → Shop by need (6 categories) → Popular priced items → Why us (4 facts) → Branches → Wholesale CTA. Pages: Home, Products (category filter), Wholesale (form → WhatsApp), Contact.
## 5. MVP features
| Feature | Priority |
|---|---|
| Product grid, category filter via URL | Must |
| WhatsApp order button per product + floating button | Must |
| Wholesale enquiry form (prefilled WhatsApp message) | Must |
| Branches with tap-to-call | Must |
| Single-file catalog (src/data.js) for easy edits | Must |
| Real product photos, search, cart | Later |
## 6. Design
Bazaar price-tag look: red, tag-yellow, steel grey on white; Baloo 2 headings + Noto Sans body; dashed yellow price stickers are the one memorable element; high contrast, large tap targets, Hinglish headline, nothing premium.
## 7. Tech
React 18, React Router 6, Vite 5, plain CSS. Host on Vercel/Netlify (rewrite files included). No backend in v1.
## 8. Non-functional
Mobile-first, visible keyboard focus, reduced motion respected, SEO meta, light bundle.
## 9. Risks / open items
Prices and phone numbers come from video screenshots, so confirm with the owner. No product photos yet. "Popular" = items with prices.
## 10. Success
Fast on mobile, WhatsApp clicks per visit, owner can update the catalog without a developer.

---
## v2 changes
- **Navigation fix:** added an error boundary per page, disabled browser auto-translate (likely cause of blank pages with the Hinglish text), safe storage access.
- **Images:** product image = admin link/upload, else free auto-lookup (Wikimedia Commons) cached in the browser, else the original emoji.
- **Landing page:** category carousels (flagged "show on home") with View all, ₹20 range, cups, steel, dinner sets, plastic, appliances; shop-by-budget; price belt; fuller footer with credit line.
- **Admin (/admin):** hidden route, login admin/admin (client-side only, not real security). Edit products, categories, shop info; export/import catalog.json.
- **Data model:** `src/catalog.json` = {shop, categories[{id,label,e,blurb,home}], products[{id,name,cat,price,note,e,q,img}]}. Admin edits live in the browser's localStorage until exported into this file.
- **Next (needs backend):** Supabase so admin edits reach all visitors and real auth.
