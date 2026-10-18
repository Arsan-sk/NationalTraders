import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCatalog } from '../store.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

export default function Layout() {
  const { shop, categories, wa } = useCatalog();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <header className="head">
        <div className="wrap bar">
          <Link to="/" className="logo">National<b>Trader</b></Link>
          <nav>
            {[['/', 'Home'], ['/products', 'Products'], ['/wholesale', 'Wholesale'], ['/contact', 'Contact']].map(([t, l]) => (
              <NavLink key={t} to={t} end={t === '/'}>{l}</NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main key={pathname} className="page">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Redesigned Award-Winning Modern Dark Footer */}
      <footer className="modern-footer">
        <div className="wrap">
          <div className="foot-grid">
            {/* Column 1: Brand & Founder Story */}
            <div className="foot-brand">
              <h3>National<b>Trader</b></h3>
              <p>
                Founded and managed by <strong>Jafar Bhai</strong> in Bhiwandi. Your direct destination for stainless steel cookware, ₹20 bazaar plastic items, dinner sets, and appliances at authentic wholesale & retail rates.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#1e293b', padding: '.3rem .7rem', borderRadius: '6px', fontSize: '.8rem', color: 'var(--tag)', marginBottom: '1.2rem' }}>
                <span>✓ Verified Merchant</span> · <span>Bhiwandi Hub</span>
              </div>
              <div className="foot-socials">
                <a href={shop.instagram} target="_blank" rel="noreferrer" className="foot-social-pill">
                  📷 Instagram
                </a>
                <a href={shop.wholesaleIg} target="_blank" rel="noreferrer" className="foot-social-pill">
                  📦 Wholesale IG
                </a>
                <a href={shop.youtube} target="_blank" rel="noreferrer" className="foot-social-pill">
                  ▶️ YouTube Reviews
                </a>
              </div>
            </div>

            {/* Column 2: Quick Shop Categories */}
            <div className="foot-col">
              <h4>Shop Categories</h4>
              <ul className="foot-links">
                {categories.slice(0, 6).map(c => (
                  <li key={c.id}>
                    <Link to={`/products?cat=${c.id}`}>
                      {c.e} {c.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/products" style={{ fontWeight: 700, color: 'var(--tag)' }}>
                    → Browse All Products
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Trust & Wholesale Guarantees */}
            <div className="foot-col">
              <h4>Service & Guarantees</h4>
              <ul className="foot-links" style={{ color: '#94a3b8' }}>
                <li>🚚 <strong>All-India Delivery:</strong> Transport & courier parcel service</li>
                <li>🏷️ <strong>Bazaar Rates:</strong> Starting from ₹20 plastic basics</li>
                <li>📦 <strong>Wholesale Discounts:</strong> Full carton trade rates for dukaans</li>
                <li>📹 <strong>Video Proof:</strong> Real unboxing on YouTube before purchase</li>
                <li>💳 <strong>Safe Payments:</strong> UPI, Bank Transfer & Shop Cash</li>
              </ul>
            </div>

            {/* Column 4: Physical Branches in Bhiwandi */}
            <div className="foot-col">
              <h4>Visit Us in Bhiwandi</h4>
              {shop.branches.map((b, i) => (
                <div key={b.phone || i} className="foot-contact-item">
                  <strong>📍 {b.name}</strong>
                  <span style={{ color: '#94a3b8', fontSize: '.82rem' }}>Open Daily 10:00 AM - 10:00 PM</span>
                  <a href={`tel:+91${b.phone}`} style={{ color: 'var(--tag)', fontWeight: 600 }}>
                    📞 +91 {b.phone}
                  </a>
                </div>
              ))}
              <div style={{ marginTop: '.8rem' }}>
                <a
                  className="btn wa"
                  style={{ fontSize: '.85rem', padding: '.45rem .9rem', width: '100%', textAlign: 'center', display: 'block' }}
                  href={wa('Hi Jafar Bhai, I want to visit National Trader in Bhiwandi.')}
                  target="_blank"
                  rel="noreferrer"
                >
                  💬 Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar with Credits and Hidden Admin Entry Point */}
          <div className="foot-bottom">
            <div>
              © 2026 National Trader. All rights reserved. Bhiwandi, Maharashtra.
            </div>
            <div>
              Designed & Built by{' '}
              <a href="http://arsansk.vercel.app/" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                Sheikh Mohd Arsan
              </a>{' '}
              &{' '}
              <a href="https://chrysaaa.vercel.app/" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                Chrysa
              </a>
              <span
                className="admin-footer-trigger"
                onDoubleClick={() => navigate('/admin')}
                onKeyDown={e => { if (e.key === 'Enter') navigate('/admin'); }}
                tabIndex={0}
                role="button"
                aria-label="Staff portal entrance"
                title="Double-click to open Staff Admin portal"
              >
                {' '}🔒
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Action Button */}
      <a className="fab" href={wa('Hi National Trader, I have an enquiry about your products.')} target="_blank" rel="noreferrer">
        💬 WhatsApp Us
      </a>
    </>
  );
}
