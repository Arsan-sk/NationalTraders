import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.error('Dist directory does not exist. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const routes = [
  {
    path: 'products',
    title: 'All Products & Price List | National Traders Bhiwandi – Jafar Bhai (Jaffer)',
    description: 'Browse wholesale and retail steel cookware, ₹20 bazaar plastic items, dinner sets, and appliances from Jafar Bhai at National Traders Bhiwandi. Order via WhatsApp with pan-India delivery.',
    canonical: 'https://national-traders.vercel.app/products',
    h1: 'All Products & Price List – National Traders Bhiwandi (Jafar Bhai)',
    lead: 'High-grade stainless steel utensils, ₹20 plastic items, dinner sets, and kitchen appliances at Bhiwandi wholesale rates.'
  },
  {
    path: 'wholesale',
    title: 'Wholesale Trade & Bulk Inquiries | National Traders Bhiwandi – Jafar Bhai (Jaffer)',
    description: 'Wholesale carton rates and bulk supplies for shopkeepers, caterers, and resellers from National Trader Bhiwandi by Jafar Bhai. All-India transport and parcel delivery.',
    canonical: 'https://national-traders.vercel.app/wholesale',
    h1: 'Wholesale for Shopkeepers & Bulk Buyers – National Traders Bhiwandi',
    lead: 'Direct trade rates on stainless steel utensils, ₹20 items, and dinner sets with pan-India carton transport.'
  },
  {
    path: 'contact',
    title: 'Contact & Branch Locations | National Traders Bhiwandi – Koter Gate & Shanti Nagar',
    description: 'Visit National Traders (National Trader) branches in Bhiwandi, Maharashtra at Koter Gate (Branches 1 & 2) and Shanti Nagar (Branch 3). Call Jafar Bhai at +91 9156924664 / +91 7498774773.',
    canonical: 'https://national-traders.vercel.app/contact',
    h1: 'Contact & Branch Locations – National Traders Bhiwandi',
    lead: 'Visit our physical branches in Bhiwandi or reach out for retail and wholesale deliveries across India.'
  }
];

routes.forEach(route => {
  const routeDir = path.join(distDir, route.path);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }

  let html = baseHtml;
  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${route.title}</title>`);
  html = html.replace(/<meta name="title" content=".*?"\/>/i, `<meta name="title" content="${route.title}"/>`);
  html = html.replace(/<meta property="og:title" content=".*?"\/>/i, `<meta property="og:title" content="${route.title}"/>`);
  html = html.replace(/<meta property="twitter:title" content=".*?"\/>/i, `<meta property="twitter:title" content="${route.title}"/>`);

  // Replace Description
  html = html.replace(/<meta name="description" content=".*?"\/>/i, `<meta name="description" content="${route.description}"/>`);
  html = html.replace(/<meta property="og:description" content=".*?"\/>/i, `<meta property="og:description" content="${route.description}"/>`);
  html = html.replace(/<meta property="twitter:description" content=".*?"\/>/i, `<meta property="twitter:description" content="${route.description}"/>`);

  // Replace Canonical
  html = html.replace(/<link rel="canonical" href=".*?"\/>/i, `<link rel="canonical" href="${route.canonical}"/>`);
  html = html.replace(/<meta property="og:url" content=".*?"\/>/i, `<meta property="og:url" content="${route.canonical}"/>`);
  html = html.replace(/<meta property="twitter:url" content=".*?"\/>/i, `<meta property="twitter:url" content="${route.canonical}"/>`);

  fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8');
  console.log(`Generated prerendered HTML for /${route.path}`);
});

console.log('Static route prerendering completed successfully!');
