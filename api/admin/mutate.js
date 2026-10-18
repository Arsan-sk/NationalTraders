import { getSessionFromRequest, getSupabaseConfig } from '../_auth.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: admin session required' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { action, payload } = body || {};
  const { supabaseUrl, serviceKey, anonKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, serviceKey || anonKey);

  try {
    switch (action) {
      case 'save_product': {
        const { product, sectionIds, oldImagePath } = payload;
        if (!product || !product.id || !product.name || !product.cat) {
          return res.status(400).json({ error: 'Missing required product fields' });
        }

        // Clean up old storage file if image was replaced
        if (oldImagePath && oldImagePath !== product.image_path) {
          try {
            await supabase.storage.from('nt_products').remove([oldImagePath]);
          } catch (e) {
            console.warn('Could not remove old image:', e.message);
          }
        }

        const productData = {
          id: product.id,
          name: product.name,
          cat: product.cat,
          price: product.price !== null && product.price !== undefined && product.price !== '' ? Number(product.price) : null,
          note: product.note || '',
          e: product.e || '🛍️',
          img: product.img || '',
          fallback_url: product.fallback_url || product.fallbackUrl || '',
          image_path: product.image_path || null,
          q: product.q || '',
          updated_at: new Date().toISOString()
        };

        let { error: pErr } = await supabase
          .from('NT_products')
          .upsert(productData);

        // Graceful fallback if fallback_url column has not been added to Supabase DB yet
        if (pErr && pErr.code === 'PGRST204' && pErr.message?.includes('fallback_url')) {
          const { fallback_url, ...legacyProductData } = productData;
          const retryRes = await supabase.from('NT_products').upsert(legacyProductData);
          pErr = retryRes.error;
        }

        if (pErr) throw pErr;

        // If sectionIds is provided, synchronize memberships
        if (Array.isArray(sectionIds)) {
          // Remove all existing memberships for this product
          await supabase
            .from('NT_product_featured_sections')
            .delete()
            .eq('product_id', product.id);

          // Insert new memberships
          if (sectionIds.length > 0) {
            const rows = sectionIds.map(secId => ({
              product_id: product.id,
              section_id: secId
            }));
            const { error: sErr } = await supabase
              .from('NT_product_featured_sections')
              .insert(rows);
            if (sErr) throw sErr;
          }
        }

        return res.status(200).json({ ok: true, product: productData });
      }

      case 'delete_product': {
        const { id, imagePath } = payload;
        if (!id) return res.status(400).json({ error: 'Missing product ID' });

        // Remove storage object if exists
        if (imagePath) {
          try {
            await supabase.storage.from('nt_products').remove([imagePath]);
          } catch (e) {
            console.warn('Could not remove storage file on delete:', e.message);
          }
        }

        // Delete from NT_products (FK CASCADE removes section memberships automatically)
        const { error: delErr } = await supabase
          .from('NT_products')
          .delete()
          .eq('id', id);

        if (delErr) throw delErr;
        return res.status(200).json({ ok: true, deletedId: id });
      }

      case 'toggle_section': {
        const { productId, sectionId, active } = payload;
        if (!productId || !sectionId) {
          return res.status(400).json({ error: 'Missing productId or sectionId' });
        }

        if (active) {
          const { error } = await supabase
            .from('NT_product_featured_sections')
            .upsert({ product_id: productId, section_id: sectionId });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('NT_product_featured_sections')
            .delete()
            .match({ product_id: productId, section_id: sectionId });
          if (error) throw error;
        }

        return res.status(200).json({ ok: true, productId, sectionId, active });
      }

      case 'save_section': {
        const { section } = payload;
        if (!section || !section.id || !section.title) {
          return res.status(400).json({ error: 'Missing section fields' });
        }
        const { error } = await supabase
          .from('NT_featured_sections')
          .upsert(section);
        if (error) throw error;
        return res.status(200).json({ ok: true, section });
      }

      case 'save_categories': {
        const { categories } = payload;
        if (!Array.isArray(categories)) {
          return res.status(400).json({ error: 'Invalid categories' });
        }
        const { error } = await supabase
          .from('NT_categories')
          .upsert(categories);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case 'delete_category': {
        const { id } = payload;
        if (!id) return res.status(400).json({ error: 'Missing category ID' });
        const { error } = await supabase
          .from('NT_categories')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case 'save_shop': {
        const { shop } = payload;
        if (!shop) return res.status(400).json({ error: 'Missing shop payload' });
        const shopRow = {
          id: 'default',
          wa: shop.wa,
          branches: shop.branches,
          instagram: shop.instagram,
          wholesale_ig: shop.wholesaleIg,
          youtube: shop.youtube,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase
          .from('NT_shop_info')
          .upsert(shopRow);
        if (error) throw error;
        return res.status(200).json({ ok: true, shop });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Admin mutation error:', err);
    return res.status(500).json({ error: err.message || 'Operation failed' });
  }
}
