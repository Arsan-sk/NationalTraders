import {useCatalog} from '../store.jsx';
export default function Contact(){const {shop,wa}=useCatalog();return(<section className="wrap sec narrow"><h1>Contact & branches</h1><div className="facts">
{shop.branches.map(b=><div key={b.phone}><h3>{b.name}</h3><p><a href={`tel:+91${b.phone}`}>{b.phone}</a></p></div>)}</div>
<div className="cta"><a className="btn wa" href={wa('Hi National Trader!')} target="_blank" rel="noreferrer">Chat on WhatsApp</a><a className="btn red" href={shop.instagram}>Instagram</a><a className="btn red" href={shop.youtube}>Watch product videos</a></div></section>)}
