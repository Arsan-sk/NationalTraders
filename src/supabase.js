import { createClient } from '@supabase/supabase-js';
import baseCatalog from './catalog.json';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial default featured sections
export const DEFAULT_FEATURED_SECTIONS = [
  { id: 'hero_deals', title: 'Hero Deals & Stickers', description: 'Highlighted deals displayed in the homepage hero banner sticker tags', is_active: true, display_order: 1 },
  { id: 'rs20_specials', title: '₹20 Dhamaka Specials', description: 'Best-selling items in the ₹20 range', is_active: true, display_order: 2 },
  { id: 'kitchen_steel', title: 'Kitchen & Steel Essentials', description: 'Top cookware, tiffins, and dinner sets', is_active: true, display_order: 3 },
  { id: 'popular_appliances', title: 'Appliances & Purifiers', description: 'Mixers, water purifiers, and stoves with reviews', is_active: true, display_order: 4 }
];

// Initial default product memberships
export const DEFAULT_PRODUCT_SECTIONS = {
  a1: ['hero_deals', 'rs20_specials'],
  a2: ['rs20_specials'],
  a3: ['rs20_specials'],
  a4: ['rs20_specials'],
  b1: ['hero_deals'],
  c1: ['kitchen_steel'],
  c2: ['kitchen_steel'],
  c4: ['kitchen_steel'],
  d1: ['kitchen_steel'],
  f2: ['hero_deals'],
  g1: ['popular_appliances'],
  g2: ['popular_appliances'],
  g3: ['popular_appliances']
};

/**
 * Fetch catalog data from Supabase if available; falls back to localStorage / baseCatalog
 */
export async function fetchCatalogData() {
  if (!supabase) {
    return { isSupabaseLive: false, error: 'Supabase client not initialized' };
  }

  try {
    const [catRes, prodRes, secRes, pfsRes, shopRes] = await Promise.all([
      supabase.from('NT_categories').select('*').order('display_order', { ascending: true }),
      supabase.from('NT_products').select('*').order('id', { ascending: true }),
      supabase.from('NT_featured_sections').select('*').order('display_order', { ascending: true }),
      supabase.from('NT_product_featured_sections').select('*'),
      supabase.from('NT_shop_info').select('*').limit(1)
    ]);

    // Check if tables are present (PGRST205 indicates table does not exist)
    if (prodRes.error || catRes.error) {
      const err = prodRes.error || catRes.error;
      console.warn('Supabase query issue, using fallback:', err.message);
      return { isSupabaseLive: false, error: err.message };
    }

    const categories = catRes.data && catRes.data.length > 0 ? catRes.data : baseCatalog.categories;
    const products = prodRes.data && prodRes.data.length > 0 ? prodRes.data : baseCatalog.products;
    const featuredSections = secRes.data && secRes.data.length > 0 ? secRes.data : DEFAULT_FEATURED_SECTIONS;

    // Build map: productId -> Set of sectionIds
    const productFeaturedMap = {};
    if (pfsRes.data && pfsRes.data.length > 0) {
      pfsRes.data.forEach(row => {
        if (!productFeaturedMap[row.product_id]) {
          productFeaturedMap[row.product_id] = new Set();
        }
        productFeaturedMap[row.product_id].add(row.section_id);
      });
    } else {
      // Use defaults
      Object.entries(DEFAULT_PRODUCT_SECTIONS).forEach(([pid, secs]) => {
        productFeaturedMap[pid] = new Set(secs);
      });
    }

    let shop = baseCatalog.shop;
    if (shopRes.data && shopRes.data.length > 0) {
      const s = shopRes.data[0];
      shop = {
        wa: s.wa || baseCatalog.shop.wa,
        branches: Array.isArray(s.branches) ? s.branches : baseCatalog.shop.branches,
        instagram: s.instagram || baseCatalog.shop.instagram,
        wholesaleIg: s.wholesale_ig || baseCatalog.shop.wholesaleIg,
        youtube: s.youtube || baseCatalog.shop.youtube
      };
    }

    return {
      isSupabaseLive: true,
      categories,
      products,
      featuredSections,
      productFeaturedMap,
      shop
    };
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return { isSupabaseLive: false, error: err.message };
  }
}

/**
 * Admin API Client calls (guarded server-side)
 */
async function callAdminApi(endpoint, options = {}) {
  const token = sessionStorage.getItem('nt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'same-origin'
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function loginAdmin(username, password) {
  const data = await callAdminApi('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  if (data.token) {
    sessionStorage.setItem('nt_token', data.token);
  }
  return data;
}

export async function logoutAdmin() {
  try {
    await callAdminApi('/api/auth/logout', { method: 'POST' });
  } finally {
    sessionStorage.removeItem('nt_token');
  }
}

export async function checkSession() {
  try {
    const data = await callAdminApi('/api/auth/session', { method: 'GET' });
    return data.authenticated;
  } catch {
    return false;
  }
}

export async function uploadProductImage(dataUrl, filename) {
  return callAdminApi('/api/admin/upload', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, filename })
  });
}

export async function saveProductApi(product, sectionIds, oldImagePath) {
  return callAdminApi('/api/admin/mutate', {
    method: 'POST',
    body: JSON.stringify({
      action: 'save_product',
      payload: { product, sectionIds, oldImagePath }
    })
  });
}

export async function deleteProductApi(id, imagePath) {
  return callAdminApi('/api/admin/mutate', {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete_product',
      payload: { id, imagePath }
    })
  });
}

export async function toggleSectionApi(productId, sectionId, active) {
  return callAdminApi('/api/admin/mutate', {
    method: 'POST',
    body: JSON.stringify({
      action: 'toggle_section',
      payload: { productId, sectionId, active }
    })
  });
}

export async function saveSectionApi(section) {
  return callAdminApi('/api/admin/mutate', {
    method: 'POST',
    body: JSON.stringify({
      action: 'save_section',
      payload: { section }
    })
  });
}

export async function saveShopApi(shop) {
  return callAdminApi('/api/admin/mutate', {
    method: 'POST',
    body: JSON.stringify({
      action: 'save_shop',
      payload: { shop }
    })
  });
}

export async function saveCategoriesApi(categories) {
  return callAdminApi('/api/admin/mutate', {
    method: 'POST',
    body: JSON.stringify({
      action: 'save_categories',
      payload: { categories }
    })
  });
}

export async function deleteCategoryApi(id) {
  return callAdminApi('/api/admin/mutate', {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete_category',
      payload: { id }
    })
  });
}
