"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2,
  AlertCircle,
  Info,
  Leaf,
  Camera,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function DiagnosaPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      toast.error("File harus berupa gambar!");
      return;
    }

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB!");
      return;
    }

    setSelectedFile(file);
    
    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  // Upload & analyze
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Pilih gambar terlebih dahulu!");
      return;
    }

    try {
      setIsUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        return;
      }

      // Upload image to Supabase Storage
      const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diagnosa')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Save to database (gunakan path storage)
      const { data: diagnosaData, error: dbError } = await supabase
        .from('diagnosa')
        .insert({
          user_id: user.id,
          gambar: fileName,   
          status: 'processing'
        })
        .select()
        .single();


      if (dbError) throw dbError;

      toast.success("Gambar berhasil diupload! Sedang menganalisis...");
      
      // Redirect ke halaman hasil dengan ID
      router.push(`/diagnosa/${diagnosaData.id}`);

    } catch (error) {
      if (error instanceof Error) {
        console.error("Error uploading (message):", error.message);
      } else {
        console.error("Error uploading (raw):", JSON.stringify(error, null, 2));
      }
      toast.error("Gagal mengupload gambar");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-6 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Sparkles className="w-6 h-6 ml-2" />
          <div>
            <h1 className="text-xl font-semibold ml-2">Diagnosa Tanaman</h1>
            <p className="text-sm text-black-50 ml-2">Deteksi penyakit tanaman jagung dengan AI</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Camera className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Ambil Foto</h3>
                    <p className="text-sm text-gray-600">Foto daun jagung yang terlihat sakit</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">AI Menganalisis</h3>
                    <p className="text-sm text-gray-600">Model AI mendeteksi penyakit</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Hasil & Solusi</h3>
                    <p className="text-sm text-gray-600">Dapatkan rekomendasi penanganan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Tentang Fitur Diagnosa
              </CardTitle>
              <CardDescription>
                Fitur ini menggunakan teknologi AI untuk mendeteksi penyakit pada tanaman jagung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    Apa yang Bisa Dideteksi?
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>Hawar Daun (Leaf Blight)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>Karat Daun (Leaf Rust)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>Bercak Daun (Leaf Spot)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>Tanaman Sehat (Healthy)</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-500" />
                    Tips Pengambilan Foto
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Ambil foto dengan pencahayaan yang cukup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Fokus pada daun yang menunjukkan gejala</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Hindari foto yang blur atau terlalu gelap</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Ukuran file maksimal 5MB</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">Catatan Penting</p>
                    <p className="text-sm text-amber-800">
                      Hasil diagnosa ini adalah prediksi dari model AI dan sebaiknya dikonfirmasi dengan ahli pertanian untuk penanganan yang lebih akurat.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Gambar Tanaman</CardTitle>
              <CardDescription>
                Pilih atau drag & drop gambar daun jagung yang ingin didiagnosa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!preview ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
                    isDragging 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">
                          {isDragging ? "Lepaskan file di sini" : "Klik untuk upload atau drag & drop"}
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, JPEG hingga 5MB
                        </p>
                      </div>
                      <Button type="button" className="bg-purple-600 hover:bg-purple-700">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Pilih Gambar
                      </Button>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview Image */}
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-96 object-contain bg-gray-50"
                    />
                    <button
                      onClick={handleRemoveFile}
                      className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* File Info */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile?.name}</p>
                        <p className="text-sm text-gray-500">
                          {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Siap Diupload
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      size="lg"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Menganalisis...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Mulai Diagnosa
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleRemoveFile}
                      variant="outline"
                      size="lg"
                      disabled={isUploading}
                    >
                      Ganti Gambar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats/Info Footer */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-purple-600 mb-1">98%+</p>
                  <p className="text-sm text-gray-600">Akurasi Model</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600 mb-1">&lt;3s</p>
                  <p className="text-sm text-gray-600">Waktu Analisis</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-600 mb-1">4</p>
                  <p className="text-sm text-gray-600">Jenis Penyakit</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}