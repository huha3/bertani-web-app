import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

// Gunakan Service Role Key di server-side
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // <- Ganti ke key yang benar

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL atau Service Role Key tidak ditemukan');
}

// Buat client admin Supabase (khusus server)
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    const { data: insertedData, error } = await supabaseAdmin
      .from('tanaman_pengguna')
      .insert([data])
      .select(); // Ambil data hasil insert

    if (error) throw new Error(error.message);

    const insertedId = insertedData?.[0]?.id;
    if (!insertedId) {
      return res.status(500).json({ error: 'ID tidak ditemukan setelah insert' });
    }

    res.status(200).json({ id: insertedId });
  } catch (error: any) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat memproses data' });
  }
}
