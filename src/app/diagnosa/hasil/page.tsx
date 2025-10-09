"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ResultPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  const [diagnosa, setDiagnosa] = useState({
    id_user: "user-id-123",
    nama_tanaman: "",
    nama_penyakit: "",
    saran: "",
    accuracy: "",
    gambar: null as File | null,
  });

  // ambil data dari query params
  useEffect(() => {
    const nama_tanaman = searchParams.get("nama_tanaman") || "";
    const nama_penyakit = searchParams.get("nama_penyakit") || "";
    const saran = searchParams.get("saran") || "";
    const accuracy = searchParams.get("accuracy") || "";
    const image = searchParams.get("image") || "";

    setDiagnosa((prev) => ({
      ...prev,
      nama_tanaman,
      nama_penyakit,
      saran,
      accuracy,
    }));

    if (image) {
      setImageUrl(image); // preview gambar
    }
  }, [searchParams]);

  // upload hasil + gambar ke Supabase
  const uploadAndSave = useCallback(async () => {
    if (!imageUrl) return;
    setLoading(true);

    const { error: insertError } = await supabase.from("hasil_diagnosa").insert([
      {
        id_user: diagnosa.id_user,
        nama_tanaman: diagnosa.nama_tanaman,
        nama_penyakit: diagnosa.nama_penyakit,
        saran: diagnosa.saran,
        accuracy: diagnosa.accuracy,
        gambar: imageUrl,
      },
    ]);

    if (insertError) {
      console.error("Insert gagal:", insertError.message);
    }
    setLoading(false);
  }, [diagnosa, imageUrl]);

  useEffect(() => {
    if (diagnosa.nama_penyakit) {
      uploadAndSave();
    }
  }, [diagnosa, uploadAndSave]);

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

                  <p className="font-medium">Akurasi</p>
                  <p>:</p>
                  <p>{diagnosa.accuracy}%</p>

                  <p className="font-medium">Solusi</p>
                  <p>:</p>
                  <p>{diagnosa.saran}</p>
                </div>
                <div className="pt-4">
                  <Button onClick={() => window.history.back()}>
                    Diagnosa Ulang
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
