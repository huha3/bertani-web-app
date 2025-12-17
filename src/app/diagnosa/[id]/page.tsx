"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  Leaf,
  Droplets,
  Sun,
  Bug,
  Download,
  Share2,
  Calendar,
  Clock,
  TrendingUp,
  Shield,
  Sparkles,
  ImageIcon,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { onnxService } from '@/lib/onnxModel';
import { mapIndexToLabel, getSaran, getDeskripsi, getSeverity } from "@/lib/classLabels";

interface DiagnosaResult {
  id: string;
  user_id: string;
  nama_penyakit: string;
  akurasi: number;
  saran: string;
  deskripsi: string;
  tingkat_keparahan: string;
  created_at: string;
  image_url?: string;
}

export default function HasilDiagnosaPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<DiagnosaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiagnosaResult();
  }, [params.id]);

  const fetchDiagnosaResult = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        router.push("/login");
        return;
      }

      // Ambil data diagnosa
      const { data: diagnosaData, error: diagnosaError } = await supabase
        .from("diagnosa")
        .select("id, gambar, created_at")
        .eq("id", params.id)
        .single();

      if (diagnosaError) throw diagnosaError;
      if (!diagnosaData) throw new Error("Record diagnosa tidak ditemukan");

      const gambarValue = diagnosaData.gambar;
      if (!gambarValue) throw new Error("Field gambar kosong");

      let publicUrl = "";

      if (typeof gambarValue === "string" && gambarValue.startsWith("http")) {
        publicUrl = gambarValue;
      } else {
        const { data: publicData } = supabase
          .storage
          .from("diagnosa")
          .getPublicUrl(gambarValue);

        if (publicData?.publicUrl) {
          publicUrl = publicData.publicUrl;
        } else {
          const { data: signedData, error: signedError } = await supabase
            .storage
            .from("diagnosa")
            .createSignedUrl(gambarValue, 60);

          if (signedError || !signedData?.signedUrl) {
            throw new Error("Gagal akses file gambar");
          }
          publicUrl = signedData.signedUrl;
        }
      }

      console.log("Public URL untuk prediksi:", publicUrl);

      // convert URL → File
      const urlToFile = async (
        url: string,
        filename: string,
        mimeType: string
      ): Promise<File> => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new File([blob], filename, { type: mimeType });
      };

      const imageFile = await urlToFile(publicUrl, "image.jpg", "image/jpeg");

      // 🔥 PREDIKSI ONNX (regresi)
      const aiResult = await onnxService.predict(imageFile);

      // Simpan hasil diagnosa
      const { data: hasilData, error: hasilError } = await supabase
        .from("hasil_diagnosa")
        .insert({
          id_diagnosa: diagnosaData.id,
          user_id: user.id,

          // ⬇️ disesuaikan dengan model regresi
          nilai_prediksi: aiResult.value,
          akurasi: aiResult.persentase,

          saran: aiResult.saran,
          deskripsi: aiResult.deskripsi,
          tingkat_keparahan: aiResult.tingkatKeparahan,
          image_url: publicUrl,
        })
        .select()
        .single();

      if (hasilError) throw hasilError;

      // Update status diagnosa
      await supabase
        .from("diagnosa")
        .update({ status: "completed" })
        .eq("id", diagnosaData.id);

      setResult({
        ...hasilData,
        image_url: publicUrl,
      });

    } catch (err: any) {
      console.error("Error fetching result:", err);
      setError(err.message || "Gagal mengambil hasil diagnosa");
      toast.error("Gagal memuat hasil diagnosa");
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'sehat': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ringan': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sedang': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'berat': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'sehat': return <CheckCircle2 className="w-5 h-5" />;
      case 'ringan': return <Info className="w-5 h-5" />;
      case 'sedang': return <AlertTriangle className="w-5 h-5" />;
      case 'berat': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const handleDownloadReport = () => {
    toast.success("Fitur download report sedang dalam pengembangan");
  };

  const handleShare = () => {
    toast.success("Fitur share sedang dalam pengembangan");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-white">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Sparkles className="w-6 h-6 ml-2" />
            <h1 className="text-xl font-semibold ml-2">Hasil Diagnosa</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <Card className="w-96">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Menganalisis Gambar</h3>
              <p className="text-sm text-gray-600 mb-4">AI sedang memproses gambar Anda...</p>
              <Progress value={66} className="h-2" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-white">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-semibold ml-2">Hasil Diagnosa</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <Card className="w-96">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gagal Memuat Hasil</h3>
              <p className="text-sm text-gray-600 mb-4">{error || "Data tidak ditemukan"}</p>
              <Button onClick={() => router.push('/diagnosa')} className="bg-purple-600 hover:bg-purple-700">
                Kembali ke Diagnosa
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-6 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/diagnosa')}
            className="ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Bagikan
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Success Banner */}
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Diagnosa Selesai!
                  </h3>
                  <p className="text-sm text-gray-600">
                    AI telah selesai menganalisis gambar tanaman Anda dengan tingkat kepercayaan {result.akurasi.toFixed(1)}%
                  </p>
                </div>
                <Badge className={`${getSeverityColor(result.tingkat_keparahan)} border px-4 py-2`}>
                  {getSeverityIcon(result.tingkat_keparahan)}
                  <span className="ml-2 font-semibold capitalize">{result.tingkat_keparahan}</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Main Result Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Left Column - Image & Info */}
            <div className="space-y-6">
              
              {/* Image Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                    Gambar Tanaman
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border-2 border-gray-200">
                    <img 
                      src={result.image_url} 
                      alt="Tanaman yang didiagnosa"
                      className="w-full h-80 object-cover"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(result.created_at).toLocaleDateString('id-ID', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(result.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Confidence Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Tingkat Kepercayaan AI
                  </CardTitle>
                  <CardDescription>
                    Akurasi prediksi model AI untuk diagnosa ini
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Score</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {result.akurasi.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={result.akurasi} className="h-3" />
                  </div>
                  
                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-600">Status Akurasi</p>
                      <p className="font-semibold text-gray-900">
                        {result.akurasi >= 90 ? "Sangat Tinggi" :
                         result.akurasi >= 80 ? "Tinggi" :
                         result.akurasi >= 70 ? "Sedang" : "Rendah"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600">Rekomendasi</p>
                      <p className="font-semibold text-gray-900">
                        {result.akurasi >= 80 ? "Dapat Dipercaya" : "Perlu Verifikasi"}
                      </p>
                    </div>
                  </div>

                  {result.akurasi < 80 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          Tingkat kepercayaan di bawah 80%. Disarankan konsultasi dengan ahli pertanian.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column - Diagnosis Details */}
            <div className="space-y-6">
              
              {/* Disease Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5 text-red-600" />
                    Hasil Diagnosa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Nama Penyakit</label>
                    <p className="text-xl font-bold text-gray-900">{result.nama_penyakit}</p>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Tingkat Keparahan</label>
                    <Badge className={`${getSeverityColor(result.tingkat_keparahan)} border px-3 py-1.5 text-sm`}>
                      {getSeverityIcon(result.tingkat_keparahan)}
                      <span className="ml-2 font-semibold capitalize">{result.tingkat_keparahan}</span>
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Deskripsi</label>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {result.deskripsi}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    Saran Penanganan
                  </CardTitle>
                  <CardDescription>
                    Langkah-langkah yang dapat dilakukan untuk mengatasi masalah
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.saran.split('\n').map((saran, index) => (
                      saran.trim() && (
                        <div key={index} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-emerald-700">{index + 1}</span>
                          </div>
                          <p className="text-sm text-gray-700 flex-1">
                            {saran.replace(/^\d+\.\s*/, '')}
                          </p>
                        </div>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>

          {/* Additional Tips */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-blue-600" />
                Tips Perawatan Umum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Penyiraman</h4>
                    <p className="text-sm text-gray-600">
                      Siram secara teratur, terutama saat musim kemarau. Hindari genangan air.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sun className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Sinar Matahari</h4>
                    <p className="text-sm text-gray-600">
                      Pastikan tanaman mendapat sinar matahari minimal 6-8 jam per hari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Pemupukan</h4>
                    <p className="text-sm text-gray-600">
                      Berikan pupuk NPK sesuai dosis dan jadwal yang dianjurkan.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pb-6">
            <Button 
              onClick={() => router.push('/diagnosa')}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Diagnosa Gambar Lain
            </Button>
            <Button 
              onClick={() => router.push('/riwayat-diagnosa')}
              variant="outline"
              size="lg"
            >
              Lihat Riwayat Diagnosa
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}