'use client'

import { useEffect, useState } from "react";
import { Trash } from 'lucide-react';
import supabase from "@/lib/supabase";
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function JadwalPage() {
  const [tanaman, setTanaman] = useState<any[]>([]);
  const [loadingTanaman, setLoadingTanaman] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [values, setValues] = useState({
    name: "",
    watering_frequency: 0,
    frequency: { amount: 0, unit: "" },
    estimated_harvest: "",
    fertilizers: "",
    date: "",
  });

  useEffect(() => {
    const fetchTanaman = async () => {
      setLoadingTanaman(true);
      const { data, error } = await supabase
        .from('tanaman_pengguna')
        .select('id, name, plant_type, date, fertilizers');
        
      if (error) {
        console.error('Gagal fetch tanaman:', error.message);
      } else {
        setTanaman(data || []);
      }
      setLoadingTanaman(false);
    };

    fetchTanaman();
  }, []);

return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Jadwal</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">{user?.username || "User"} Ini Jadwal Penanamanmu</h2>
          <p className="text-muted-foreground">Selesaikan tugas-tugas sampai panen nanti</p>
        </div>
              {loadingTanaman ? (
          <div>Loading tanaman...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            {tanaman.map((t) => {
              const deskripsi = `Jenis: ${t.plant_type || '-'}, Mulai tanam: ${t.date ? new Date(t.date).toLocaleDateString() : '-'}, Pupuk: ${t.fertilizers || '-'}`;
              return (
                <Card key={t.id} className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>{t.name}</CardTitle>
                    <CardDescription>{deskripsi}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Form atau konten lain */}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">
                      <Trash className="w-4 h-4 mr-0" />
                    </Button>
                    <Button>Kerjakan</Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
    )
}
