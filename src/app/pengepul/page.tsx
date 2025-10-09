"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input";
import supabase from "@/lib/supabase";

type Pengepul = {
  nama: string;
  jenis_panen: string;
  kota: string;
  alamat: string;
};

export default function PengepulPage() {
  const [data, setData] = useState<Pengepul[]>([]);
  const [query, setQuery] = useState("");
  const [resultList, setResultList] = useState<Pengepul[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchPengepul() {
      const { data, error } = await supabase.from("pengepul").select("*");
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else {
        console.log("DATA DARI SUPABASE:", data);
        setData(data);
      }
    }
  
    fetchPengepul();
  }, []);
  
  function handleSearch(value: string) {
    setQuery(value);
    const trimmed = value.trim().toLowerCase();

    if (trimmed === "") {
      setResultList([]);
    } else {
      const filtered = data.filter(
        (item) =>
          item.jenis_panen.toLowerCase().includes(trimmed) ||
          item.kota.toLowerCase().includes(trimmed)
      );
      setResultList(filtered);
    }
  }

  const listToDisplay = query === "" ? data : resultList;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Daftar Pengepul</h1>
        </div>
      </header>

      <div className="flex flex-col h-full p-5">
        <Card className="overflow-hidden pt-5 pb-3 px-5 w-[950px] mx-auto">
          <CardContent className="grid gap-4 p-0 md:grid-cols-1">
            <Input
              type="text"
              placeholder="Cari"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="-mb-2"
              disabled={loading}
            />

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Nama</TableHead>
                    <TableHead>Jenis Panen</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Alamat</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : listToDisplay.length > 0 ? (
                      listToDisplay.map((item) => (
                        <TableRow key={item.nama}>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell>{item.jenis_panen}</TableCell>
                          <TableCell>{item.kota}</TableCell>
                          <TableCell>{item.alamat}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Toko tidak ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
              </Table>
            </div>  
          </CardContent>
        </Card>
      </div>
    </div>
  );
}