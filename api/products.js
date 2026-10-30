import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;

  try {
    let body = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      body = await parseBody(req);
    }

    if (req.method === 'GET') {
      if (code) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('code', code)
          .single();
        if (error) return res.status(404).json({ error: 'not found' });
        return res.status(200).json(data);
      }

      const { data, error } = await supabase.from('products').select('*');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { data, error } = await supabase
        .from('products')
        .insert([body])
        .select();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json(data[0]);
    }

    if (req.method === 'PUT') {
      if (!code) return res.status(400).json({ error: 'code required' });
      const { data, error } = await supabase
        .from('products')
        .update(body)
        .eq('code', code)
        .select();
      if (error || !data.length) return res.status(404).json({ error: 'not found' });
      return res.status(200).json(data[0]);
    }

    if (req.method === 'DELETE') {
      if (!code) return res.status(400).json({ error: 'code required' });
      const { error } = await supabase.from('products').delete().eq('code', code);
      if (error) return res.status(404).json({ error: 'not found' });
      return res.status(200).json({ removed: code });
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
