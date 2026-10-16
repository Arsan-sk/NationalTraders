import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = {};
if (fs.existsSync('.env')) {
  fs.readFileSync('.env', 'utf-8').split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      env[match[1]] = (match[2] || '').trim().replace(/^['"](.*)['"]$/, '$1');
    }
  });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(supabaseUrl, serviceKey);

async function inspectData() {
  const res1 = await client.from('NT_categories').select('*');
  console.log('Categories res:', res1.error ? res1.error : res1.data?.length);
  const res2 = await client.from('NT_products').select('*');
  console.log('Products res:', res2.error ? res2.error : res2.data?.length);
}

inspectData();
