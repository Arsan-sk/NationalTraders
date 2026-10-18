import {useState} from 'react';import {useSearchParams} from 'react-router-dom';import {useCatalog} from '../store.jsx';import ProductCard from '../components/ProductCard.jsx';import SEO from '../components/SEO.jsx';
const caps=[0,20,100,500,2000];
export default function Products(){const {categories,products,wa,featuredSections,productFeaturedMap}=useCatalog();const [sp,set]=useSearchParams();const [q,setQ]=useState('');
 const cat=sp.get('cat')||'all';const sec=sp.get('sec')||'all';const max=Number(sp.get('max'))||0;
 const upd=o=>{const n=new URLSearchParams(sp);Object.entries(o).forEach(([k,v])=>v?n.set(k,v):n.delete(k));set(n)};
 const list=products.filter(p=>(cat==='all'||p.cat===cat)&&(sec==='all'||Boolean(productFeaturedMap?.[p.id]?.has(sec)))&&(!max||(Number(p.price)>0&&Number(p.price)<=max))&&p.name.toLowerCase().includes(q.trim().toLowerCase()));
return(<section className="wrap sec"><SEO title="All Products & Price List | National Traders Bhiwandi – Jafar Bhai" description="Browse kitchenware, stainless steel cookware, ₹20 bazaar items, glassware, dinner sets, and appliances from National Trader in Bhiwandi by Jafar Bhai. Order directly on WhatsApp." keywords="National Traders products, National Trader catalog, Jafar Bhai products, 20 rs items Bhiwandi, steel utensils Bhiwandi price list, dinner sets wholesale Bhiwandi" canonicalPath="/products"/><h1>All products</h1>
<input className="search" type="search" placeholder="Search products" aria-label="Search products" value={q} onChange={e=>setQ(e.target.value)}/>
<div className="chips">{[{id:'all',label:'All'},...categories].map(c=><button key={c.id} className={cat===c.id?'on':''} onClick={()=>upd({cat:c.id==='all'?'':c.id})}>{c.label}</button>)}</div>
<div className="chips">{caps.map(b=><button key={b} className={max===b?'on':''} onClick={()=>upd({max:b||''})}>{b?`Up to ₹${b.toLocaleString('en-IN')}`:'Any price'}</button>)}</div>
{list.length?<div className="grid">{list.map(p=><ProductCard key={p.id} p={p}/>)}</div>:<p>No products found. Try another category or <a href={wa('Hi National Trader, I am looking for a product.')}>ask us on WhatsApp</a>.</p>}
<p className="small">Prices can change. Message us on WhatsApp for today’s rate and stock.</p></section>)}
