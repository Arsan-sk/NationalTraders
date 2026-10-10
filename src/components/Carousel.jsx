import {useRef} from 'react';import {Link} from 'react-router-dom';import ProductCard from './ProductCard.jsx';
export default function Carousel({cat,items}){const r=useRef(null);const go=d=>r.current&&r.current.scrollBy({left:d*r.current.clientWidth*.8,behavior:'smooth'});
return(<section className="wrap sec"><div className="car-h"><div><h2>{cat.e} {cat.label}</h2><p className="small">{cat.blurb}</p></div>
<div className="car-b"><button aria-label="Previous" onClick={()=>go(-1)}>‹</button><button aria-label="Next" onClick={()=>go(1)}>›</button><Link className="btn red" to={`/products?cat=${cat.id}`}>View all</Link></div></div>
<div className="rail" ref={r}>{items.map(p=><ProductCard key={p.id} p={p}/>)}</div></section>)}
