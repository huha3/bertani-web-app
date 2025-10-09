"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCallback, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const diagnosaSchema = z.object({
  id_user: z.string(),
  nama_tanaman: z.string().min(1, "Nama tanaman wajib diisi"),
  nama_penyakit: z.string().min(1, "Nama penyakit wajib diisi"),
  saran: z.string().min(1, "Saran wajib diisi"),
  gambar: z.instanceof(File).optional().nullable(),
});

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function Hasil() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const [diagnosa, setDiagnosa] = useState({
    id_user: "user-id-123",
    nama_tanaman: "",
    nama_penyakit: "",
    saran: "",
    gambar: null as File | null,
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📂 File dipilih:", file.name);

    setDiagnosa((prev) => ({ ...prev, gambar: file }));
    setImageUrl(URL.createObjectURL(file));

    try {
      const base64Image = await toBase64(file);
      console.log("🖼️ Base64 berhasil dibuat, panjang string:", base64Image.length);

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        throw new Error(`❌ API /api/predict error: ${res.status} ${res.statusText}`);
      }

      const result = await res.json();
      console.log("✅ Response dari API /api/predict:", result);

      setDiagnosa((prev) => ({
        ...prev,
        nama_tanaman: result.nama_tanaman || "Cabai Merah",
        nama_penyakit: result.nama_penyakit || "Busuk Akar",
        saran:
          result.saran || "Gunakan fungisida dan perbaiki drainase tanah.",
      }));
    } catch (err) {
      console.error("🔥 Error di handleImageChange:", err);
    }
  };

  const uploadAndSave = useCallback(async () => {
    if (!diagnosa.gambar) return;
    setLoading(true);
    const filename = `${Date.now()}-${diagnosa.gambar.name}`;

    console.log("⬆️ Uploading ke Supabase:", filename);

    try {
      const { error: uploadError } = await supabase.storage
        .from("diagnosa-images")
        .upload(filename, diagnosa.gambar);

      if (uploadError) {
        console.error("❌ Upload gagal:", uploadError.message);
        setLoading(false);
        return;
      }

      const url = supabase.storage
        .from("diagnosa-images")
        .getPublicUrl(filename).data.publicUrl;
      setImageUrl(url);

      console.log("✅ Upload sukses, public URL:", url);

      const { error: insertError } = await supabase
        .from("hasil_diagnosa")
        .insert([
          {
            id_user: diagnosa.id_user,
            nama_tanaman: diagnosa.nama_tanaman,
            nama_penyakit: diagnosa.nama_penyakit,
            saran: diagnosa.saran,
            gambar: url,
          },
        ]);

      if (insertError) {
        console.error("❌ Insert gagal:", insertError.message);
      } else {
        console.log("✅ Data berhasil disimpan ke tabel hasil_diagnosa");
      }
    } catch (err) {
      console.error("🔥 Error di uploadAndSave:", err);
    }

    setLoading(false);
  }, [diagnosa]);

  useEffect(() => {
    if (diagnosa.gambar) {
      console.log("📌 Gambar berubah, mulai upload...");
      uploadAndSave();
    }
  }, [diagnosa.gambar, uploadAndSave]);

  const handleLoad = async () => {
    if (!diagnosa.gambar) {
      console.warn("⚠️ Tidak ada gambar untuk diagnosa ulang");
      return;
    }

    setLoading(true);
    console.log("🔄 Diagnosa ulang dengan gambar:", diagnosa.gambar.name);

    try {
      const base64Image = await toBase64(diagnosa.gambar);

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        throw new Error(`❌ API /api/predict error: ${res.status} ${res.statusText}`);
      }

      const result = await res.json();
      console.log("✅ Response diagnosa ulang:", result);

      setDiagnosa((prev) => ({
        ...prev,
        nama_tanaman: result.nama_tanaman || "Cabai Merah",
        nama_penyakit: result.nama_penyakit || "Busuk Akar",
        saran:
          result.saran || "Gunakan fungisida dan perbaiki drainase tanah.",
      }));
    } catch (err) {
      console.error("🔥 Error di handleLoad:", err);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Hasil Diagnosa</h1>
        </div>
      </header>

      <div className="flex flex-col h-full p-5">
        {/* Input upload gambar */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mb-4"
        />

        <Card className="overflow-hidden p-5 w-[950px] mx-auto">
          <CardContent className="p-3">
            <div className="flex flex-col md:flex-row gap-6 px-3 pb-6">
              {/* Kiri: Gambar */}
              <div className="flex-1 bg-muted rounded-lg flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Gambar Tanaman"
                    className="rounded-lg object-cover max-h-64"
                  />
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    Tidak ada gambar
                  </p>
                )}
              </div>

              {/* Kanan: Teks Diagnosa */}
              <div className="flex-1 bg-muted rounded-lg p-4 space-y-2">
                <p>
                  <span className="text-2xl font-bold mb-4">
                    {diagnosa.nama_tanaman}
                  </span>
                </p>
                <div className="grid grid-cols-[100px_10px_auto] gap-y-2 items-start">
                  <p className="font-medium">Penyakit</p>
                  <p>:</p>
                  <p>{diagnosa.nama_penyakit}</p>

                  <p className="font-medium">Solusi</p>
                  <p>:</p>
                  <p>{diagnosa.saran}</p>
                </div>
                <div className="pt-4">
                  <Button onClick={handleLoad} disabled={loading}>
                    {loading ? "Memproses..." : "Diagnosa Ulang"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
