import { useCatalog } from '../store.jsx';
import SEO from '../components/SEO.jsx';

export default function Contact() {
  const { shop, wa } = useCatalog();

  return (
    <section className="wrap sec narrow">
      <SEO
        title="Contact & Branch Locations | National Traders Bhiwandi – Jafar Bhai"
        description="Visit National Traders (National Trader) branches in Bhiwandi at Koter Gate and Shanti Nagar. Call Jafar Bhai at +91 9156924664 / +91 7498774773 or chat on WhatsApp."
        keywords="National Traders contact, National Trader Bhiwandi phone number, Jafar Bhai phone number, Koter Gate Bhiwandi, Shanti Nagar Bhiwandi, National Trader address"
        canonicalPath="/contact"
      />
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="tag" style={{ marginBottom: '.4rem' }}>Direct from Bhiwandi</span>
        <h1 style={{ margin: '.3rem 0' }}>Contact & Branch Locations</h1>
        <p className="lead" style={{ margin: '0 auto' }}>
          Visit Jafar Bhai's National Trader in Bhiwandi or reach out for retail and wholesale deliveries across India.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1.2rem', marginBottom: '2rem' }}>
        {shop.branches.map((b, i) => (
          <div key={b.phone || i} className="box" style={{ background: '#fff', borderRadius: '12px', border: '2px solid var(--ink)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>📍 {b.name}</h3>
              <span style={{ color: '#2e7d32', fontWeight: 700, fontSize: '.85rem' }}>
                🟢 Open Daily: 10:00 AM – 10:00 PM
              </span>
            </div>
            <p style={{ margin: '.4rem 0 .8rem', color: '#555', fontSize: '.92rem' }}>
              Bhiwandi, Maharashtra. Retail shopping and wholesale carton pickups available.
            </p>
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
              <a className="btn red" href={`tel:+91${b.phone}`} style={{ fontSize: '.9rem', padding: '.45rem .9rem' }}>
                📞 Call +91 {b.phone}
              </a>
              <a
                className="btn wa"
                href={wa(`Hi Jafar Bhai, I am looking for the address of ${b.name}.`)}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '.9rem', padding: '.45rem .9rem' }}
              >
                💬 WhatsApp Branch
              </a>
              <a
                className="btn"
                style={{ background: 'var(--ink)', color: '#fff', fontSize: '.9rem', padding: '.45rem .9rem' }}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`National Trader ${b.name}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                🗺️ Open in Google Maps
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="box" style={{ background: '#fafafa', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 .5rem' }}>Follow & Watch Jafar Bhai Online</h3>
        <p className="small" style={{ margin: '0 0 1rem' }}>Daily product unboxings, reviews, and newly arrived wholesale stock</p>
        <div className="cta" style={{ justifyContent: 'center' }}>
          <a className="btn wa" href={wa('Hi Jafar Bhai, I have an enquiry.')} target="_blank" rel="noreferrer">
            💬 Chat on WhatsApp
          </a>
          <a className="btn" style={{ background: '#e1306c', color: '#fff' }} href={shop.instagram} target="_blank" rel="noreferrer">
            📷 Retail Instagram
          </a>
          <a className="btn" style={{ background: '#0284c7', color: '#fff' }} href={shop.wholesaleIg} target="_blank" rel="noreferrer">
            📦 Wholesale Instagram
          </a>
          <a className="btn red" href={shop.youtube} target="_blank" rel="noreferrer">
            ▶️ YouTube Channel
          </a>
        </div>
      </div>
    </section>
  );
}
