import {NavLink,Link,Outlet,useLocation} from 'react-router-dom';import {useCatalog} from '../store.jsx';import ErrorBoundary from './ErrorBoundary.jsx';
export default function Layout(){const {shop,categories,wa}=useCatalog();const {pathname}=useLocation();return(<>
<header className="head"><div className="wrap bar"><Link to="/" className="logo">National<b>Trader</b></Link>
<nav>{[['/','Home'],['/products','Products'],['/wholesale','Wholesale'],['/contact','Contact']].map(([t,l])=><NavLink key={t} to={t} end={t==='/'}>{l}</NavLink>)}</nav></div></header>
<main key={pathname} className="page"><ErrorBoundary><Outlet/></ErrorBoundary></main>
<footer className="foot"><div className="wrap fgrid">
<div><h3>National Trader</h3><p>Home, kitchen and steel store in Bhiwandi. Retail and wholesale, delivery all India.</p><p><a href={shop.instagram}>Instagram</a><br/><a href={shop.wholesaleIg}>Wholesale Instagram</a><br/><a href={shop.youtube}>YouTube reviews</a></p></div>
<div><h3>Shop</h3><p>{categories.map(c=><span key={c.id}><Link to={`/products?cat=${c.id}`}>{c.label}</Link><br/></span>)}</p></div>
<div><h3>Visit us</h3><p>{shop.branches.map(b=><span key={b.phone}>{b.name}<br/><a href={`tel:+91${b.phone}`}>{b.phone}</a><br/></span>)}</p></div>
<div><h3>Quick links</h3><p><Link to="/products">All products</Link><br/><Link to="/wholesale">Wholesale enquiry</Link><br/><Link to="/contact">Contact</Link><br/><a href={wa('Hi National Trader!')} target="_blank" rel="noreferrer">WhatsApp</a></p></div></div>
<div className="credit">Created by <a href="http://arsansk.vercel.app/" target="_blank" rel="noreferrer">Sheikh Mohd Arsan</a> | <a href="https://chrysaaa.vercel.app/" target="_blank" rel="noreferrer">Chrysa</a></div></footer>
<a className="fab" href={wa('Hi National Trader, I have a question.')} target="_blank" rel="noreferrer">WhatsApp us</a></>)}
