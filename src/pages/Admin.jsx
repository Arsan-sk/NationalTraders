import {useState} from 'react';import {useCatalog} from '../store.jsx';import {priceText} from '../lib.js';
const blank={id:'',name:'',cat:'',price:'',note:'',e:'🛍️',img:'',q:''};
const toData=file=>new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const i=new Image();i.onerror=rej;i.onload=()=>{const s=Math.min(1,600/Math.max(i.width,i.height));const c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.8))};i.src=r.result};r.readAsDataURL(file)});
export default function Admin(){const [ok,setOk]=useState(()=>{try{return sessionStorage.getItem('nt_admin')==='1'}catch{return false}});
 const [u,setU]=useState('');const [pw,setPw]=useState('');const [err,setErr]=useState('');
 if(!ok)return(<section className="adm narrow"><h1>Admin login</h1><form className="form" onSubmit={e=>{e.preventDefault();if(u==='admin'&&pw==='admin'){try{sessionStorage.setItem('nt_admin','1')}catch{}setOk(true)}else setErr('Wrong username or password.')}}>
 <label>Username<input value={u} onChange={e=>setU(e.target.value)} autoComplete="username"/></label><label>Password<input type="password" value={pw} onChange={e=>setPw(e.target.value)} autoComplete="current-password"/></label>
 {err&&<p role="alert" className="err">{err}</p>}<button className="btn red" type="submit">Log in</button></form></section>);
 return <Panel out={()=>{try{sessionStorage.removeItem('nt_admin')}catch{}setOk(false)}}/>}
function Panel({out}){const {shop,categories,products,save,reset}=useCatalog();const data={shop,categories,products};
 const [tab,setTab]=useState('products');const [f,setF]=useState(blank);const [msg,setMsg]=useState('');
 const [s,setS]=useState({wa:shop.wa,instagram:shop.instagram,wholesaleIg:shop.wholesaleIg,youtube:shop.youtube,br:shop.branches.map(b=>`${b.name} | ${b.phone}`).join('\n')});
 const say=m=>{setMsg(m);setTimeout(()=>setMsg(''),3000)};
 const put=d=>say(save(d)?'Saved.':'Saved for this session only: browser storage is full. Use a link instead of an upload, or Export.');
 const ch=k=>e=>setF({...f,[k]:e.target.value});
 const submit=e=>{e.preventDefault();if(!f.cat){say('Pick a category first.');return}
  const p={...f,id:f.id||`p${Date.now()}`,price:Number(f.price)>0?Number(f.price):null};
  put({...data,products:f.id?products.map(x=>x.id===f.id?p:x):[...products,p]});setF(blank)};
 const up=async e=>{const file=e.target.files[0];if(file){try{setF({...f,img:await toData(file)})}catch{say('Could not read that image.')}}};
 const setCat=(id,o)=>put({...data,categories:categories.map(x=>x.id===id?{...x,...o}:x)});
 const delCat=id=>products.some(p=>p.cat===id)?say('Move or delete its products first.'):put({...data,categories:categories.filter(x=>x.id!==id)});
 const saveShop=e=>{e.preventDefault();const branches=s.br.split('\n').map(l=>l.split('|').map(x=>x.trim())).filter(a=>a[0]&&a[1]).map(([name,phone])=>({name,phone}));
  put({...data,shop:{...shop,wa:s.wa.replace(/\D/g,''),instagram:s.instagram,wholesaleIg:s.wholesaleIg,youtube:s.youtube,branches}})};
 const exp=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='catalog.json';a.click()};
 const imp=e=>{const file=e.target.files[0];if(!file)return;file.text().then(t=>{const d=JSON.parse(t);if(d.shop&&Array.isArray(d.products)&&Array.isArray(d.categories))put(d);else say('That file is not a catalog.')}).catch(()=>say('That file is not a catalog.'))};
return(<section className="adm"><div className="adm-top"><h1>Admin</h1><button className="btn red" onClick={out}>Log out</button></div>
<p className="small">Changes are saved in this browser. To show them to every visitor, export the catalog (Data tab) and replace <code>src/catalog.json</code>, then redeploy.</p>
{msg&&<p role="status" className="ok">{msg}</p>}
<div className="chips">{[['products','Products'],['categories','Categories'],['shop','Shop info'],['data','Data']].map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
{tab==='products'&&<><form className="form box" onSubmit={submit}><h2>{f.id?'Edit product':'Add product'}</h2>
<label>Name<input required value={f.name} onChange={ch('name')}/></label>
<label>Category<select required value={f.cat} onChange={ch('cat')}><option value="">Choose</option>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
<label>Price in ₹ (leave empty for “Ask price”)<input inputMode="numeric" value={f.price??''} onChange={ch('price')}/></label>
<label>Short note<input value={f.note} onChange={ch('note')}/></label>
<label>Image link (paste any image URL)<input value={f.img.startsWith('data:')?'':f.img} onChange={ch('img')} placeholder="https://..."/></label>
<label>Or upload an image<input type="file" accept="image/*" onChange={up}/></label>
{f.img&&<img className="prev" src={f.img} alt="Preview"/>}
<label>Auto-image search words (used when no image is set)<input value={f.q} onChange={ch('q')} placeholder="e.g. steel tiffin"/></label>
<label>Fallback emoji<input value={f.e} onChange={ch('e')}/></label>
<div className="cta"><button className="btn wa" type="submit">{f.id?'Save changes':'Add product'}</button>{f.id&&<button className="btn red" type="button" onClick={()=>setF(blank)}>Cancel</button>}</div></form>
<div className="alist">{products.map(p=><div key={p.id} className="arow"><span>{p.e} {p.name}<small> {categories.find(c=>c.id===p.cat)?.label||'No category'} · {priceText(p)}</small></span>
<span><button onClick={()=>{setF({...blank,...p,price:p.price??''});window.scrollTo(0,0)}}>Edit</button><button onClick={()=>window.confirm(`Delete ${p.name}?`)&&put({...data,products:products.filter(x=>x.id!==p.id)})}>Delete</button></span></div>)}</div></>}
{tab==='categories'&&<div className="alist">{categories.map(c=><div key={c.id} className="arow col"><div className="inl"><input className="em" aria-label="Emoji" value={c.e} onChange={e=>setCat(c.id,{e:e.target.value})}/><input aria-label="Category name" value={c.label} onChange={e=>setCat(c.id,{label:e.target.value})}/></div>
<input aria-label="Description" value={c.blurb} onChange={e=>setCat(c.id,{blurb:e.target.value})} placeholder="Short description"/>
<div className="inl"><label className="chk"><input type="checkbox" checked={!!c.home} onChange={e=>setCat(c.id,{home:e.target.checked})}/>Show on home page</label><button onClick={()=>delCat(c.id)}>Delete</button></div></div>)}
<button className="btn wa" onClick={()=>put({...data,categories:[...categories,{id:`c${Date.now()}`,label:'New category',e:'🛍️',blurb:'',home:false}]})}>Add category</button></div>}
{tab==='shop'&&<form className="form box" onSubmit={saveShop}><label>WhatsApp number with country code<input value={s.wa} onChange={e=>setS({...s,wa:e.target.value})}/></label>
<label>Branches, one per line as Name | Phone<textarea rows="4" value={s.br} onChange={e=>setS({...s,br:e.target.value})}/></label>
<label>Instagram link<input value={s.instagram} onChange={e=>setS({...s,instagram:e.target.value})}/></label><label>Wholesale Instagram link<input value={s.wholesaleIg} onChange={e=>setS({...s,wholesaleIg:e.target.value})}/></label>
<label>YouTube link<input value={s.youtube} onChange={e=>setS({...s,youtube:e.target.value})}/></label><button className="btn wa" type="submit">Save shop info</button></form>}
{tab==='data'&&<div className="form box"><button className="btn wa" onClick={exp}>Export catalog.json</button><label>Import catalog.json<input type="file" accept="application/json" onChange={imp}/></label>
<button className="btn red" onClick={()=>window.confirm('Reset everything to the original catalog?')&&reset()}>Reset to original</button></div>}</section>)}
