import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import base from './catalog.json';
import {
  fetchCatalogData,
  DEFAULT_FEATURED_SECTIONS,
  DEFAULT_PRODUCT_SECTIONS,
  saveProductApi,
  deleteProductApi,
  toggleSectionApi,
  saveShopApi,
  saveCategoriesApi,
  deleteCategoryApi
} from './supabase.js';

const KEY = 'nt_catalog_v2';
const PFS_KEY = 'nt_pfs_v2';
const Ctx = createContext(null);

const readLocal = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.products) && Array.isArray(s.categories) && s.shop) return s;
  } catch {}
  return base;
};

const readLocalPfs = () => {
  try {
    const s = JSON.parse(localStorage.getItem(PFS_KEY));
    if (s && typeof s === 'object') {
      const map = {};
      Object.entries(s).forEach(([k, v]) => {
        map[k] = new Set(Array.isArray(v) ? v : []);
      });
      return map;
    }
  } catch {}
  const defMap = {};
  Object.entries(DEFAULT_PRODUCT_SECTIONS).forEach(([pid, secs]) => {
    defMap[pid] = new Set(secs);
  });
  return defMap;
};

export function StoreProvider({ children }) {
  const [data, setData] = useState(readLocal);
  const [featuredSections, setFeaturedSections] = useState(DEFAULT_FEATURED_SECTIONS);
  const [productFeaturedMap, setProductFeaturedMap] = useState(readLocalPfs);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync to localStorage as backup/offline cache
  const persistLocal = useCallback((d, pfsMap) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch {}
    if (pfsMap) {
      try {
        const serializable = {};
        Object.entries(pfsMap).forEach(([k, v]) => {
          serializable[k] = Array.from(v);
        });
        localStorage.setItem(PFS_KEY, JSON.stringify(serializable));
      } catch {}
    }
  }, []);

  // Fetch from Supabase on mount
  const refresh = useCallback(async () => {
    const res = await fetchCatalogData();
    if (res.isSupabaseLive) {
      setIsSupabaseLive(true);
      setData({
        shop: res.shop,
        categories: res.categories,
        products: res.products
      });
      setFeaturedSections(res.featuredSections);
      setProductFeaturedMap(res.productFeaturedMap);
      persistLocal({
        shop: res.shop,
        categories: res.categories,
        products: res.products
      }, res.productFeaturedMap);
    } else {
      setIsSupabaseLive(false);
    }
    setLoading(false);
  }, [persistLocal]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Save product (with section memberships and image cleanup)
  const saveProduct = useCallback(async (product, sectionIds, oldImagePath) => {
    // 1. Optimistic local update
    const updatedProducts = product.id && data.products.some(p => p.id === product.id)
      ? data.products.map(p => p.id === product.id ? product : p)
      : [...data.products, product];

    const updatedData = { ...data, products: updatedProducts };
    setData(updatedData);

    const updatedPfs = { ...productFeaturedMap };
    if (Array.isArray(sectionIds)) {
      updatedPfs[product.id] = new Set(sectionIds);
      setProductFeaturedMap(updatedPfs);
    }
    persistLocal(updatedData, updatedPfs);

    // 2. Persist to server / Supabase
    try {
      await saveProductApi(product, sectionIds, oldImagePath);
      return { ok: true };
    } catch (err) {
      console.warn('Backend save product notice:', err.message);
      return { ok: true, offlineNotice: err.message };
    }
  }, [data, productFeaturedMap, persistLocal]);

  // Delete product
  const deleteProduct = useCallback(async (id, imagePath) => {
    // 1. Optimistic local update
    const updatedProducts = data.products.filter(p => p.id !== id);
    const updatedData = { ...data, products: updatedProducts };
    setData(updatedData);

    const updatedPfs = { ...productFeaturedMap };
    delete updatedPfs[id];
    setProductFeaturedMap(updatedPfs);
    persistLocal(updatedData, updatedPfs);

    // 2. Persist to server / Supabase
    try {
      await deleteProductApi(id, imagePath);
      return { ok: true };
    } catch (err) {
      console.warn('Backend delete notice:', err.message);
      return { ok: true, offlineNotice: err.message };
    }
  }, [data, productFeaturedMap, persistLocal]);

  // Toggle single section membership
  const toggleSection = useCallback(async (productId, sectionId, active) => {
    // 1. Optimistic update
    const currentSet = new Set(productFeaturedMap[productId] || []);
    if (active) {
      currentSet.add(sectionId);
    } else {
      currentSet.delete(sectionId);
    }
    const updatedPfs = {
      ...productFeaturedMap,
      [productId]: currentSet
    };
    setProductFeaturedMap(updatedPfs);
    persistLocal(data, updatedPfs);

    // 2. Persist to server / Supabase
    try {
      await toggleSectionApi(productId, sectionId, active);
      return { ok: true };
    } catch (err) {
      console.warn('Backend toggle section notice:', err.message);
      return { ok: true, offlineNotice: err.message };
    }
  }, [data, productFeaturedMap, persistLocal]);

  // Save shop info
  const saveShop = useCallback(async (newShop) => {
    const updatedData = { ...data, shop: newShop };
    setData(updatedData);
    persistLocal(updatedData);

    try {
      await saveShopApi(newShop);
      return { ok: true };
    } catch (err) {
      console.warn('Backend save shop notice:', err.message);
      return { ok: true, offlineNotice: err.message };
    }
  }, [data, persistLocal]);

  // Save categories
  const saveCategories = useCallback(async (newCategories) => {
    const updatedData = { ...data, categories: newCategories };
    setData(updatedData);
    persistLocal(updatedData);

    try {
      await saveCategoriesApi(newCategories);
      return { ok: true };
    } catch (err) {
      console.warn('Backend save categories notice:', err.message);
      return { ok: true, offlineNotice: err.message };
    }
  }, [data, persistLocal]);

  // Delete category
  const deleteCategory = useCallback(async (id) => {
    const updatedCategories = data.categories.filter(c => c.id !== id);
    const updatedData = { ...data, categories: updatedCategories };
    setData(updatedData);
    persistLocal(updatedData);

    try {
      await deleteCategoryApi(id);
      return { ok: true };
    } catch (err) {
      console.warn('Backend delete category notice:', err.message);
      return { ok: true, offlineNotice: err.message };
    }
  }, [data, persistLocal]);

  const reset = () => {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(PFS_KEY);
    } catch {}
    setData(base);
    setFeaturedSections(DEFAULT_FEATURED_SECTIONS);
    const defMap = {};
    Object.entries(DEFAULT_PRODUCT_SECTIONS).forEach(([pid, secs]) => {
      defMap[pid] = new Set(secs);
    });
    setProductFeaturedMap(defMap);
  };

  const wa = t => `https://wa.me/${data.shop.wa}?text=${encodeURIComponent(t)}`;

  return (
    <Ctx.Provider value={{
      ...data,
      featuredSections,
      productFeaturedMap,
      isSupabaseLive,
      loading,
      refresh,
      saveProduct,
      deleteProduct,
      toggleSection,
      saveShop,
      saveCategories,
      deleteCategory,
      reset,
      wa
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCatalog = () => useContext(Ctx);
