import {Link} from 'react-router-dom';import {useCatalog} from '../store.jsx';import {priceText} from '../lib.js';import Carousel from '../components/Carousel.jsx';import Reveal from '../components/Reveal.jsx';
const facts=[['Bazaar prices','Lots of items at ₹20, ₹99 and ₹100.'],['Retail + wholesale','Buy one piece or a full carton at trade rates.'],['Delivery all India','Order on WhatsApp, we ship to your city.'],['See before you buy','Unboxing and comparison videos for big items.']];
const budgets=[20,100,500,2000];
export default function Home(){const {categories,products,shop,wa}=useCatalog();
 const stick=categories.map(c=>products.find(p=>p.cat===c.id&&Number(p.price)>0&&Number(p.price)<=100)).filter(Boolean).slice(0,3);
 const belt=[...categories,...categories];
return(<>
<section className="hero"><div className="wrap hero-in"><div><h1>Ghar ka saaman, bazaar ke bhaav.</h1>
<p className="lead">Steel, plastic, glass, cups, bottles and home appliances from our Bhiwandi shops. Buy retail or wholesale, delivered all India.</p>
<div className="cta"><Link className="btn red" to="/products">See all products</Link><a className="btn wa" href={wa('Hi National Trader, please share your price list.')} target="_blank" rel="noreferrer">Get price list on WhatsApp</a></div></div>
<div className="stickers" aria-label="Sample prices">{stick.map((p,i)=><span key={p.id} className={`tag big s${i+1}`}>{p.name} {priceText(p)}</span>)}</div></div></section>
<div className="belt" aria-hidden="true"><div className="belt-in">{belt.map((c,i)=><span key={i}>{c.e} {c.label}</span>)}</div></div>
<Reveal><section className="wrap sec"><h2>Shop by what you need</h2><div className="cats">{categories.map(c=><Link key={c.id} to={`/products?cat=${c.id}`} className="cat"><span>{c.e}</span>{c.label}</Link>)}</div></section></Reveal>
{categories.filter(c=>c.home).map(c=>{const items=products.filter(p=>p.cat===c.id);return items.length?<Reveal key={c.id}><Carousel cat={c} items={items}/></Reveal>:null})}
<Reveal><section className="wrap sec"><h2>Shop by budget</h2><div className="cats">{budgets.map(b=><Link key={b} to={`/products?max=${b}`} className="cat bud">Up to ₹{b.toLocaleString('en-IN')}</Link>)}</div></section></Reveal>
<Reveal><section className="band"><div className="wrap sec"><h2>Why families and shopkeepers pick us</h2><div className="facts">{facts.map(([t,d])=><div key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>
<div className="cta"><a className="btn red" href={shop.youtube} target="_blank" rel="noreferrer">Watch product videos</a></div></div></section></Reveal>
<Reveal><section className="wrap sec"><h2>Visit us in Bhiwandi</h2><div className="facts">{shop.branches.map(b=><div key={b.phone}><h3>{b.name}</h3><p><a href={`tel:+91${b.phone}`}>Call {b.phone}</a></p></div>)}</div>
<div className="cta"><Link className="btn red" to="/wholesale">Buying in bulk? Wholesale enquiry</Link></div></section></Reveal></>)}
