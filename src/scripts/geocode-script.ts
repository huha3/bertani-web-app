import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // WAJIB pakai service role, bukan anon
);

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

export async function geocodeAllTokoPupuk() {
  console.log("Mulai geocoding...");

  // ambil toko yang belum punya lat/long
  const { data, error } = await supabase
    .from("toko_pupuk")
    .select("*")
    .is("lat", null);

  if (error) {
    console.error("Gagal ambil data:", error);
    return;
  }

  for (const toko of data) {
    console.log(`Geocoding: ${toko.nama} - ${toko.alamat}`);

    try {
      const coords = await geocodeAddress(toko.alamat);

      if (!coords) {
        console.log(`Gagal geocode ${toko.nama}`);
        continue;
      }

      await supabase
        .from("toko_pupuk")
        .update({
          lat: coords.lat,
          lon: coords.lon,
        })
        .eq("id", toko.id);

      console.log(`${toko.nama} berhasil diupdate!`);
    } catch (e) {
      console.error(`Error saat geocoding ${toko.nama}:`, e);
    }

    // rate limit
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log("Selesai!");
}

async function geocodeAddress(address: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${GOOGLE_API_KEY}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "OK") return null;

  const loc = json.results[0].geometry.location;

  return {
    lat: loc.lat,
    lon: loc.lng,
  };
}
