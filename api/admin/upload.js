import { getSessionFromRequest, getSupabaseConfig } from '../_auth.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { dataUrl, filename } = body || {};
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return res.status(400).json({ error: 'Invalid image data' });
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid data URL format' });
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const { supabaseUrl, serviceKey, anonKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, serviceKey || anonKey);

  const ext = mimeType.split('/')[1] || 'jpg';
  const cleanName = (filename || 'product').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `products/${Date.now()}_${cleanName}.${ext}`;

  try {
    const { data, error } = await supabase.storage
      .from('nt_products')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error('Storage upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from('nt_products')
      .getPublicUrl(filePath);

    return res.status(200).json({
      ok: true,
      url: publicUrlData.publicUrl,
      path: filePath
    });
  } catch (err) {
    console.error('Storage upload exception:', err);
    return res.status(500).json({ error: err.message });
  }
}
