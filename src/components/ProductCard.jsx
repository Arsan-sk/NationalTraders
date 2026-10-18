import ProductImage from './ProductImage.jsx';
import { useCatalog } from '../store.jsx';
import { priceText } from '../lib.js';

export default function ProductCard({ p }) {
  const { wa } = useCatalog();

  return (
    <article className="card">
      <ProductImage p={p} />
      <span className="tag">{priceText(p)}</span>
      <h3>{p.name}</h3>
      <p>{p.note || 'Available for retail and wholesale delivery all India.'}</p>
      <a
        className="btn wa"
        href={wa(`Hi Jafar Bhai, I want to enquire about: ${p.name} (${priceText(p)}). Is it available for delivery?`)}
        target="_blank"
        rel="noreferrer"
        style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}
      >
        <span>💬 Order on WhatsApp</span>
      </a>
    </article>
  );
}
