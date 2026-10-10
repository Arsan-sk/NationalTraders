import {useState} from 'react';import {useCatalog} from '../store.jsx';
export default function Wholesale(){const {wa,shop}=useCatalog();const [f,setF]=useState({name:'',city:'',items:'',qty:''});const ch=k=>e=>setF({...f,[k]:e.target.value});
const go=e=>{e.preventDefault();window.open(wa(`Wholesale enquiry\nName: ${f.name}\nCity: ${f.city}\nItems: ${f.items}\nQuantity: ${f.qty}`),'_blank')};
return(<section className="wrap sec narrow"><h1>Wholesale for shopkeepers</h1><p className="lead">Trade rates on steel, plastic, glass, cups, bottles and appliances. Tell us what you need and we reply on WhatsApp with rates and delivery.</p>
<form onSubmit={go} className="form"><label>Your name<input required value={f.name} onChange={ch('name')}/></label><label>City<input required value={f.city} onChange={ch('city')}/></label>
<label>Items you need<textarea required rows="3" value={f.items} onChange={ch('items')} placeholder="e.g. glass sets, water bottles, steel plates"/></label><label>Approx. quantity<input value={f.qty} onChange={ch('qty')} placeholder="e.g. 2 cartons"/></label>
<button className="btn wa" type="submit">Send enquiry on WhatsApp</button></form>
<p className="small">More trade rates on our <a href={shop.wholesaleIg}>wholesale Instagram</a>.</p></section>)}
