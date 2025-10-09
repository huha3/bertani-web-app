"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function UploadImage() {
    const [image, setImage] = useState<File | null>(null);
    const [result, setResult] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setImage(acceptedFiles[0]);
        setResult(""); // reset result kalau upload baru
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
    });

    const handlePredict = async () => {
        if (!image) {
            alert("Please select an image first.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('file', image);

        try {
            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to get prediction');
            }

            const data = await response.json();
            setResult(data.prediction);
        } catch (error) {
            console.error(error);
            alert("Prediction failed");
        }

        setLoading(false);
    };

    return (
      <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-xl font-semibold">Diagnosa Tanamanmu</h1>
            </div>
          </header>
          <div className="flex flex-col h-full p-5">
      
          <Card className="overflow-hidden p-5 w-[600px] mx-auto">
            <CardContent className="grid p-0 md:grid-cols-1">
            <div {...getRootProps()} className="w-full h-100 flex flex-col items-center justify-center">
              <input {...getInputProps()} />
              {image ? (
                <img src={URL.createObjectURL(image)} alt="Preview" className="max-h-40 rounded-lg" />
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400" />
                  <p className="text-gray-500 text-sm mt-2">Seret atau klik untuk unggah foto</p>
                </>
              )}
            </div>
            {image && (
              <Button variant="default" className="mt-4 w-full">
                Mulai Deteksi Penyakit
              </Button>
            )}
            </CardContent>
          </Card>
        </div>
        </div>
      );
    }
