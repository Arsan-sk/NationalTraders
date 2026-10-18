import { useState } from 'react';
import { useCatalog } from '../store.jsx';

export default function Wholesale() {
  const { wa, shop } = useCatalog();
  const [f, setF] = useState({ name: '', city: '', items: '', qty: '' });
  const ch = k => e => setF({ ...f, [k]: e.target.value });

  const go = e => {
    e.preventDefault();
    const msg = `*Wholesale Trade Enquiry*\n👤 Name: ${f.name}\n📍 City: ${f.city}\n📦 Items Needed: ${f.items}\n🔢 Approx Quantity: ${f.qty || 'Carton rates'}\n\nHi Jafar Bhai, please share wholesale pricing and transport options.`;
    window.open(wa(msg), '_blank');
  };

  return (
    <section className="wrap sec narrow">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="tag" style={{ marginBottom: '.4rem' }}>Bhiwandi Mandi Rates</span>
        <h1 style={{ margin: '.3rem 0' }}>Wholesale for Shopkeepers & Bulk Buyers</h1>
        <p className="lead" style={{ margin: '0 auto' }}>
          Direct trade rates on stainless steel utensils, ₹20 plastic items, dinner sets, and appliances from Jafar Bhai's National Trader in Bhiwandi.
        </p>
      </div>

      <div className="box" style={{ background: '#fff', borderRadius: '12px', padding: '1.8rem', border: '2px solid var(--ink)' }}>
        <h2 style={{ fontSize: '1.4rem', marginTop: 0 }}>Send Wholesale Inquiry</h2>
        <form onSubmit={go} className="form" style={{ margin: '1rem 0' }}>
          <label>
            Your Name / Dukaan Name *
            <input required placeholder="e.g. Ramesh Steel Center" value={f.name} onChange={ch('name')} />
          </label>
          <label>
            Your City & State *
            <input required placeholder="e.g. Surat, Gujarat" value={f.city} onChange={ch('city')} />
          </label>
          <label>
            Items You Need *
            <textarea
              required
              rows="3"
              value={f.items}
              onChange={ch('items')}
              placeholder="e.g. 5 cartons ₹20 plastic buckets, 20 pressure cookers, 10 dinner sets"
            />
          </label>
          <label>
            Approximate Quantity
            <input value={f.qty} onChange={ch('qty')} placeholder="e.g. 2 - 5 Cartons" />
          </label>
          <button className="btn wa" type="submit" style={{ fontSize: '1.1rem', fontWeight: 800, padding: '.8rem' }}>
            💬 Send Inquiry Directly to Jafar Bhai on WhatsApp
          </button>
        </form>
      </div>

      <div className="box" style={{ background: 'var(--steel)', borderRadius: '12px', marginTop: '1.5rem', padding: '1.2rem' }}>
        <h3 style={{ margin: '0 0 .4rem' }}>Wholesale Transport & Terms</h3>
        <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>
          • <strong>Minimum order:</strong> 1 full carton or mix-and-match ₹3,000+.<br />
          • <strong>Delivery:</strong> Dispatched via all-India transport & parcel couriers.<br />
          • <strong>Live catalog updates:</strong> Check out our <a href={shop.wholesaleIg} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>Wholesale Instagram Page</a> for daily newly arrived cartons.
        </p>
      </div>
    </section>
  );
}
