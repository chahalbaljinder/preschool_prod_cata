/**
 * Migrate products from assets/products.json into Supabase
 *
 * Setup:
 *   1. npm install   (installs @supabase/supabase-js from package.json)
 *   2. Set env vars:
 *      Windows PowerShell:
 *        $env:SUPABASE_URL="https://your-project.supabase.co"
 *        $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *      macOS/Linux:
 *        export SUPABASE_URL="https://your-project.supabase.co"
 *        export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *   3. Run: node scripts/migrate-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const products = JSON.parse(fs.readFileSync('./assets/products.json', 'utf8'));

async function migrate() {
  let inserted = 0;
  let failed = 0;

  // Insert in batches of 50 to avoid payload limits
  for (let i = 0; i < products.length; i += 50) {
    const batch = products.slice(i, i + 50);

    const { error } = await supabase.from('products').insert(batch);

    if (error) {
      console.error(`Batch starting at index ${i} failed:`, error.message);
      failed += batch.length;
    } else {
      inserted += batch.length;
      console.log(`Inserted ${inserted} / ${products.length}`);
    }
  }

  console.log(`\nMigration complete: ${inserted} inserted, ${failed} failed`);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
