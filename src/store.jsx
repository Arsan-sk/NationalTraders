import {createContext,useContext,useState,useCallback} from 'react';import base from './catalog.json';
const KEY='nt_catalog_v2';const Ctx=createContext(null);
const read=()=>{try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Array.isArray(s.products)&&Array.isArray(s.categories)&&s.shop)return s}catch{}return base};
export function StoreProvider({children}){const [data,setData]=useState(read);
 const save=useCallback(d=>{setData(d);try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch{return false}},[]);
 const reset=()=>{try{localStorage.removeItem(KEY)}catch{}setData(base)};
 const wa=t=>`https://wa.me/${data.shop.wa}?text=${encodeURIComponent(t)}`;
 return <Ctx.Provider value={{...data,save,reset,wa}}>{children}</Ctx.Provider>}
export const useCatalog=()=>useContext(Ctx);
