import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env
const env = {};
if (fs.existsSync('.env')) {
  fs.readFileSync('.env', 'utf-8').split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      env[match[1]] = (match[2] || '').trim().replace(/^['"](.*)['"]$/, '$1');
    }
  });
}

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('====================================================');
console.log('       Supabase Configuration & Verification        ');
console.log('====================================================');
console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing Supabase URL or Anon Key!');
  process.exit(1);
}

const adminClient = serviceKey ? createClient(supabaseUrl, serviceKey) : createClient(supabaseUrl, anonKey);

async function verify() {
  console.log('\n[1/2] Checking Storage Bucket "nt_products"...');
  try {
    const { data: buckets, error: bError } = await adminClient.storage.listBuckets();
    if (bError) {
      console.log('⚠️ Storage check warning:', bError.message);
    } else {
      const ntBucket = buckets.find(b => b.id === 'nt_products');
      if (ntBucket) {
        console.log(`✅ Bucket "nt_products" exists! (Public: ${ntBucket.public})`);
      } else {
        console.log('⚠️ Bucket "nt_products" not yet in list. Attempting creation...');
        const { error: cErr } = await adminClient.storage.createBucket('nt_products', {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
        });
        if (cErr) console.log('Bucket creation error:', cErr.message);
        else console.log('✅ Bucket "nt_products" created successfully!');
      }
    }
  } catch (e) {
    console.log('Bucket error:', e.message);
  }

  console.log('\n[2/2] Checking Database Tables (prefix: NT_)...');
  const tables = ['NT_categories', 'NT_products', 'NT_featured_sections', 'NT_product_featured_sections', 'NT_shop_info'];
  let allTablesPresent = true;

  for (const table of tables) {
    try {
      const { data, error } = await adminClient.from(table).select('id').limit(1);
      if (error) {
        console.log(`❌ Table "${table}": ${error.message} (${error.code})`);
        allTablesPresent = false;
      } else {
        console.log(`✅ Table "${table}": Ready and verified!`);
      }
    } catch (e) {
      console.log(`❌ Table "${table}": ${e.message}`);
      allTablesPresent = false;
    }
  }

  console.log('\n----------------------------------------------------');
  if (allTablesPresent) {
    console.log('🎉 ALL Supabase tables are ready and synchronized!');
  } else {
    console.log('📋 Next Action for Database Tables:');
    console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/mwzzrtlajtnmramuboho/sql');
    console.log('2. Copy and paste the contents of "supabase/schema.sql"');
    console.log('3. Click "Run" to create tables, indexes, RLS, and seed initial products');
    console.log('4. Re-run "node scripts/verify_supabase.js" to confirm!');
    console.log('\nNote: The application includes smart fallback to local catalog storage, so it will continue working seamlessly both before and after applying the schema.');
  }
  console.log('====================================================\n');
}

verify();
