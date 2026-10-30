import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;

  try {
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
        .insert([req.body])
        .select();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json(data[0]);
    }

    if (req.method === 'PUT') {
      const { data, error } = await supabase
        .from('products')
        .update(req.body)
        .eq('code', code)
        .select();
      if (error || !data.length) return res.status(404).json({ error: 'not found' });
      return res.status(200).json(data[0]);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('products').delete().eq('code', code);
      if (error) return res.status(404).json({ error: 'not found' });
      return res.status(200).json({ removed: code });
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
