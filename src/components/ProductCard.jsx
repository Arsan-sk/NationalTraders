import ProductImage from './ProductImage.jsx';import {useCatalog} from '../store.jsx';import {priceText} from '../lib.js';
export default function ProductCard({p}){const {wa}=useCatalog();return(<article className="card"><ProductImage p={p}/><span className="tag">{priceText(p)}</span><h3>{p.name}</h3><p>{p.note}</p>
<a className="btn wa" href={wa(`Hi National Trader, I want to know about: ${p.name}`)} target="_blank" rel="noreferrer">Order on WhatsApp</a></article>)}
