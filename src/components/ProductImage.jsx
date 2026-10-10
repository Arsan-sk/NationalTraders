import {useEffect,useState} from 'react';import {findImage,peek} from '../lib.js';
export default function ProductImage({p}){const q=p.q||p.name;const [src,setSrc]=useState(p.img||peek(q));const [bad,setBad]=useState(false);
 useEffect(()=>{let live=true;setBad(false);if(p.img){setSrc(p.img);return}
  setSrc(peek(q));findImage(q).then(u=>{if(live&&u)setSrc(u)});return()=>{live=false}},[p.img,q]);
 return <div className="thumb">{src&&!bad?<img src={src} alt={p.name} loading="lazy" onError={()=>setBad(true)}/>:<span aria-hidden="true">{p.e}</span>}</div>}
