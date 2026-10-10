import {useEffect,useRef,useState} from 'react';
export default function Reveal({children}){const r=useRef(null);const [on,setOn]=useState(false);
 useEffect(()=>{const el=r.current;if(!el||!('IntersectionObserver' in window)){setOn(true);return}
  const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){setOn(true);io.disconnect()}},{threshold:.08});io.observe(el);return()=>io.disconnect()},[]);
 return <div ref={r} className={`rv${on?' in':''}`}>{children}</div>}
