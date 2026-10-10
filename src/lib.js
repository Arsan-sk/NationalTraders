export const priceText=p=>{const n=Number(p.price);return n>0?`₹${n.toLocaleString('en-IN')}`:'Ask price'};
const KEY='nt_img';const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return{}}};
const put=(q,u)=>{try{const m=load();m[q]=u;localStorage.setItem(KEY,JSON.stringify(m))}catch{}};
export const peek=q=>load()[q]||'';
const pend={};
// Free, keyless image lookup from Wikimedia Commons. Returns '' if nothing is found or offline.
export function findImage(q){const c=load()[q];if(c!==undefined)return Promise.resolve(c);if(pend[q])return pend[q];
 const url=`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q+' filetype:bitmap')}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime&iiurlwidth=480&format=json&origin=*`;
 pend[q]=fetch(url).then(r=>r.json()).then(j=>{const pages=Object.values(j.query?.pages||{}).sort((a,b)=>a.index-b.index);
  const hit=pages.map(x=>x.imageinfo&&x.imageinfo[0]).find(i=>i&&i.mime==='image/jpeg'&&i.thumburl);const u=hit?hit.thumburl:'';put(q,u);return u})
  .catch(()=>'').finally(()=>{delete pend[q]});return pend[q]}
