import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../store.jsx';
import { priceText } from '../lib.js';
import Carousel from '../components/Carousel.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Reveal from '../components/Reveal.jsx';

const budgets = [20, 100, 500, 2000];

const trustPillars = [
  {
    icon: '🏷️',
    title: 'Authentic Bazaar Prices',
    desc: 'Bhiwandi wholesale hub rates starting from ₹20 plastic daily essentials, ₹99 racks, and ₹550 32-piece dinner sets.'
  },
  {
    icon: '📦',
    title: 'Retail + Wholesale Freedom',
    desc: 'Buy a single steel tiffin for your kitchen or full carton crates at discounted trade rates for your shop.'
  },
  {
    icon: '🚚',
    title: 'All-India Transport & Courier',
    desc: 'Heavy-duty bubble wrap and wooden crates. We dispatch via reliable transport and courier to every pincode in India.'
  },
  {
    icon: '📹',
    title: 'Video Proof with Jafar Bhai',
    desc: 'Watch real unboxing, steel gauge thickness tests, and honest comparison reviews on YouTube before paying a rupee.'
  }
];

const faqs = [
  {
    q: 'Can I order just 1 or 2 items for home delivery?',
    a: 'Yes! We deliver single pieces and retail orders anywhere in India via parcel courier. Simply tap "Order on WhatsApp" on any product and share your delivery address.'
  },
  {
    q: 'How do wholesale orders work and what is the minimum quantity?',
    a: 'For shopkeepers, caterers, and gift buyers, wholesale carton rates start from just 1 carton or mix-and-match ₹3,000+. Contact Jafar Bhai directly on WhatsApp for full carton transport lists.'
  },
  {
    q: 'Where are your physical branches located in Bhiwandi?',
    a: 'We have two prime locations: Branch 1 & 2 at Koter Gate, and our Shanti Nagar branch in Bhiwandi, Maharashtra. Both branches are open 7 days a week from 10:00 AM to 10:00 PM.'
  },
  {
    q: 'How can I check the steel thickness and product quality before ordering?',
    a: 'Jafar Bhai regularly films detailed unboxing, magnet tests, and gauge thickness measurements on YouTube (@theatlanticwaves) and Instagram reels. You can also request live videos on WhatsApp before dispatch.'
  },
  {
    q: 'What payment modes are accepted?',
    a: 'We accept instant UPI (Google Pay, PhonePe, Paytm, BHIM), direct Bank IMPS/NEFT transfer, and Cash at our physical Bhiwandi branches.'
  }
];

export default function Home() {
  const { categories, products, shop, wa, productFeaturedMap, featuredSections } = useCatalog();

  // Active section for the interactive touch explorer
  const [activeExploreSec, setActiveExploreSec] = useState('hero_deals');

  // Wholesale calculator state
  const [wholesaleTier, setWholesaleTier] = useState(2); // 1 = starter, 2 = shopkeeper, 3 = bulk distributor

  // Branch switcher state
  const [activeBranchIdx, setActiveBranchIdx] = useState(0);

  // Hero sticker products (from hero_deals or under 100)
  const heroProducts = products.filter(p => productFeaturedMap?.[p.id]?.has('hero_deals'));
  const stick = (heroProducts.length > 0 ? heroProducts : categories.map(c => products.find(p => p.cat === c.id && Number(p.price) > 0 && Number(p.price) <= 100)).filter(Boolean)).slice(0, 3);
  const belt = [...categories, ...categories];

  // Products in currently active exploration section
  const exploreProducts = products.filter(p => productFeaturedMap?.[p.id]?.has(activeExploreSec));

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#ffe4e6', color: '#b91c1c', padding: '.35rem .85rem', borderRadius: '999px', fontWeight: 700, fontSize: '.9rem', marginBottom: '.8rem', border: '1px solid #fecdd3' }}>
              <span>★</span> 1,000+ Happy Customers
            </div>
            <h1>Ghar ka saaman, bazaar ke bhaav.</h1>
            <p className="lead">
              Direct from Jafar Bhai's National Trader (National Traders) in Bhiwandi. High-grade stainless steel cookware, ₹20 daily essentials, glassware, bottles, and appliances. Retail or wholesale, delivered all over India.
            </p>
            <div className="cta">
              <Link className="btn red" to="/products">
                See all products
              </Link>
              <a className="btn wa" href={wa('Hi Jafar Bhai, please share your today’s price list.')} target="_blank" rel="noreferrer">
                Get price list on WhatsApp
              </a>
            </div>
          </div>
          <div className="stickers" aria-label="Sample prices">
            {stick.map((p, i) => (
              <span key={p.id} className={`tag big s${i + 1}`}>
                {p.name} {priceText(p)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee Category Belt */}
      <div className="belt" aria-hidden="true">
        <div className="belt-in">
          {belt.map((c, i) => (
            <span key={i}>{c.e} {c.label}</span>
          ))}
        </div>
      </div>

      {/* Shop By What You Need */}
      <Reveal>
        <section className="wrap sec">
          <h2>Shop by what you need</h2>
          <div className="cats">
            {categories.map(c => (
              <Link key={c.id} to={`/products?cat=${c.id}`} className="cat">
                <span>{c.e}</span>
                {c.label}
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Interactive Mobile Touch Explorer for Featured Collections */}
      <Reveal>
        <section className="wrap sec">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '.8rem', marginBottom: '1rem' }}>
            <div>
              <span className="tag" style={{ marginBottom: '.4rem', fontSize: '.9rem' }}>🔥 Interactive Dhamaka Deals</span>
              <h2 style={{ margin: '.3rem 0 0' }}>Explore Handpicked Collections</h2>
              <p className="small">Swipe with your fingers to discover bestselling kitchen and home deals</p>
            </div>
            <Link className="btn red" to="/products">
              View Entire Catalog →
            </Link>
          </div>

          {/* Section Selection Chips */}
          <div className="chips">
            {featuredSections.map(sec => (
              <button
                key={sec.id}
                className={activeExploreSec === sec.id ? 'on' : ''}
                onClick={() => setActiveExploreSec(sec.id)}
              >
                {sec.title} ({products.filter(p => productFeaturedMap?.[p.id]?.has(sec.id)).length})
              </button>
            ))}
          </div>

          {/* Touch-Friendly Product Rail */}
          <div className="rail" style={{ marginTop: '.8rem' }}>
            {(exploreProducts.length > 0 ? exploreProducts : products.slice(0, 6)).map(p => (
              <div key={p.id} className="card" style={{ flex: '0 0 230px' }}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Category Carousels for Home-Flagged Categories */}
      {categories.filter(c => c.home).map(c => {
        const items = products.filter(p => p.cat === c.id);
        return items.length ? (
          <Reveal key={c.id}>
            <Carousel cat={c} items={items} />
          </Reveal>
        ) : null;
      })}

      {/* Shop By Budget */}
      <Reveal>
        <section className="wrap sec">
          <h2>Shop by budget</h2>
          <div className="cats">
            {budgets.map(b => (
              <Link key={b} to={`/products?max=${b}`} className="cat bud">
                Up to ₹{b.toLocaleString('en-IN')}
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {/* REDESIGNED SECTION 1: Why Families & Shopkeepers Pick Us (Interactive Trust Hub) */}
      <Reveal>
        <section className="band" style={{ padding: '3rem 0', background: 'var(--steel)' }}>
          <div className="wrap">
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2rem' }}>
              <span className="tag" style={{ marginBottom: '.5rem' }}>Bhiwandi Ka Vishwas</span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', margin: '.4rem 0' }}>
                Why Families and Shopkeepers Pick Us
              </h2>
              <p className="lead" style={{ margin: '0 auto' }}>
                Over 1,000+ happy customers and local merchants trust Jafar Bhai's National Trader for honest pricing and verified quality.
              </p>
            </div>

            {/* Live Trust Metrics Ticker */}
            <div className="trust-metrics">
              <div className="metric-box">
                <div className="metric-val">1,000+</div>
                <div className="metric-lbl">Happy Customers</div>
              </div>
              <div className="metric-box">
                <div className="metric-val">₹20 Deals</div>
                <div className="metric-lbl">Daily Essentials Guaranteed</div>
              </div>
              <div className="metric-box">
                <div className="metric-val">100% Verified</div>
                <div className="metric-lbl">Heavy Gauge Food Grade Steel</div>
              </div>
              <div className="metric-box">
                <div className="metric-val">2 Branches</div>
                <div className="metric-lbl">In Bhiwandi (Open 7 Days)</div>
              </div>
            </div>

            {/* 4 Interactive Trust Pillar Cards */}
            <div className="trust-grid">
              {trustPillars.map(pillar => (
                <article key={pillar.title} className="trust-card">
                  <div className="trust-card-icon">{pillar.icon}</div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.desc}</p>
                </article>
              ))}
            </div>

            {/* Direct Video Proof Banner */}
            <div className="box" style={{ background: '#fff', textAlign: 'center', marginTop: '2rem', padding: '1.8rem' }}>
              <h3 style={{ margin: '0 0 .4rem' }}>📹 Watch Real Product Testing & Unboxing Videos</h3>
              <p style={{ color: '#555', maxWidth: '580px', margin: '0 auto 1.2rem' }}>
                See product thickness tests, weight measurements, and genuine shop reviews hosted by Jafar Bhai on YouTube before placing your order.
              </p>
              <div className="cta" style={{ justifyContent: 'center' }}>
                <a className="btn red" href={shop.youtube} target="_blank" rel="noreferrer">
                  ▶️ Watch on YouTube (@theatlanticwaves)
                </a>
                <a className="btn" style={{ background: '#e1306c', color: '#fff' }} href={shop.instagram} target="_blank" rel="noreferrer">
                  📷 Watch Instagram Reels
                </a>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* REDESIGNED SECTION 2: Interactive Wholesale Tier Calculator */}
      <Reveal>
        <section className="wrap sec">
          <div className="wholesale-box">
            <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 1.5rem' }}>
              <span className="tag" style={{ marginBottom: '.4rem' }}>For Shopkeepers & Bulk Buyers</span>
              <h2 style={{ margin: '.3rem 0' }}>Interactive Wholesale Rate Estimator</h2>
              <p className="small">Tap your expected order volume to see estimated wholesale profit margins and get instant WhatsApp quotation</p>
            </div>

            <div className="wholesale-tiers">
              <div
                className={`tier-card ${wholesaleTier === 1 ? 'selected' : ''}`}
                onClick={() => setWholesaleTier(1)}
              >
                <h4>Starter Wholesale</h4>
                <div className="tier-discount">15% - 20% OFF</div>
                <p className="small">Order: 1 – 2 Cartons<br />Best for small shops & gift buyers</p>
              </div>

              <div
                className={`tier-card ${wholesaleTier === 2 ? 'selected' : ''}`}
                onClick={() => setWholesaleTier(2)}
              >
                <h4>Shopkeeper Tier</h4>
                <div className="tier-discount">25% - 30% OFF</div>
                <p className="small">Order: 3 – 9 Cartons<br />Best for regular retail stores</p>
              </div>

              <div
                className={`tier-card ${wholesaleTier === 3 ? 'selected' : ''}`}
                onClick={() => setWholesaleTier(3)}
              >
                <h4>Bulk Distributor</h4>
                <div className="tier-discount">Factory Direct Rates</div>
                <p className="small">Order: 10+ Cartons<br />Full transport crate delivery</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
              <a
                className="btn wa"
                style={{ fontSize: '1.1rem', fontWeight: 800, padding: '.75rem 1.8rem' }}
                href={wa(`Hi Jafar Bhai, I want wholesale rates for ${wholesaleTier === 1 ? '1-2 cartons (Starter)' : wholesaleTier === 2 ? '3-9 cartons (Shopkeeper)' : '10+ cartons (Bulk Distributor)'}. Please share catalog.`)}
                target="_blank"
                rel="noreferrer"
              >
                💬 Get Instant Wholesale Quote on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </Reveal>

      {/* REDESIGNED SECTION 3: Interactive Frequently Asked Questions (FAQ Accordion) */}
      <Reveal>
        <section className="wrap sec">
          <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto' }}>
            <span className="tag" style={{ marginBottom: '.4rem' }}>Got Questions?</span>
            <h2 style={{ margin: '.3rem 0' }}>Frequently Asked Questions</h2>
            <p className="small">Everything you need to know about retail orders, wholesale delivery, and quality assurance</p>
          </div>

          <div className="faq-box">
            {faqs.map((faq, i) => (
              <details key={faq.q} className="faq-item" open={i === 0}>
                <summary className="faq-summary">
                  <span>{faq.q}</span>
                  <span className="faq-icon">＋</span>
                </summary>
                <div className="faq-content">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="box" style={{ textAlign: 'center', background: '#fafafa', borderRadius: '10px', padding: '1.2rem' }}>
            <p style={{ margin: '0 0 .6rem', fontWeight: 600 }}>Have a specific question not listed here?</p>
            <a className="btn wa" href={wa('Hi Jafar Bhai, I have a question about National Trader.')} target="_blank" rel="noreferrer">
              💬 Ask Jafar Bhai on WhatsApp
            </a>
          </div>
        </section>
      </Reveal>

      {/* REDESIGNED SECTION 4: Interactive Bhiwandi Branches & Map Hub */}
      <Reveal>
        <section className="wrap sec">
          <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 1.5rem' }}>
            <span className="tag" style={{ marginBottom: '.4rem' }}>Physical Stores</span>
            <h2 style={{ margin: '.3rem 0' }}>Visit Us in Bhiwandi</h2>
            <p className="small">Come inspect our products in person at our wholesale and retail branches</p>
          </div>

          <div className="branch-hub">
            {/* Branch Selector Tabs */}
            <div className="branch-tabs">
              {shop.branches.map((b, i) => (
                <button
                  key={b.phone || i}
                  type="button"
                  className={`branch-tab-btn ${activeBranchIdx === i ? 'active' : ''}`}
                  onClick={() => setActiveBranchIdx(i)}
                >
                  📍 {b.name}
                </button>
              ))}
            </div>

            {/* Active Branch Display */}
            {shop.branches[activeBranchIdx] && (
              <div className="branch-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{shop.branches[activeBranchIdx].name}</h3>
                  <span className="branch-status">
                    🟢 Open Today: 10:00 AM – 10:00 PM
                  </span>
                </div>
                <p style={{ margin: 0, color: '#444', fontSize: '.95rem' }}>
                  Complete range of stainless steel dabbas, plates, dinner sets, ₹20 plastic products, mixer grinders, and daily household utensils available in stock.
                </p>

                <div className="branch-actions">
                  <a className="btn red" href={`tel:+91${shop.branches[activeBranchIdx].phone}`}>
                    📞 Call: +91 {shop.branches[activeBranchIdx].phone}
                  </a>
                  <a
                    className="btn wa"
                    href={wa(`Hi, I am visiting ${shop.branches[activeBranchIdx].name}. Please share exact shop landmark.`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    💬 WhatsApp for Landmark
                  </a>
                  <a
                    className="btn"
                    style={{ background: 'var(--ink)', color: '#fff' }}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`National Trader ${shop.branches[activeBranchIdx].name}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📍 Open Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </Reveal>
    </>
  );
}
