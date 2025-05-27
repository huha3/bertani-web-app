"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import supabase from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type TokoPupuk = {
  nama: string;
  produk: string;
  kota: string;
  alamat: string;
};

export default function TokoPupukPage() {
  const [data, setData] = useState<TokoPupuk[]>([]);
  const [query, setQuery] = useState("");
  const [resultList, setResultList] = useState<TokoPupuk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokoPupuk() {
      const { data, error } = await supabase.from("toko_pupuk").select("*");
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else {
        console.log("DATA DARI SUPABASE:", data);
        setData(data);
      }
    }

    fetchTokoPupuk();
  }, []);

  function handleSearch(value: string) {
  setQuery(value);
  const trimmed = value.trim().toLowerCase();

  if (trimmed === "") {
    setResultList([]);
  } else {
    const filtered = data.filter((item) =>
      item.nama.toLowerCase().includes(trimmed)
    );
    setResultList(filtered);
  }
}

  const listToDisplay = query === "" ? data : resultList;

  // Render komponen dan data selanjutnya...

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Toko Pupuk</h1>
        </div>
      </header>

      <div className="flex flex-col h-full p-5">
        <Card className="overflow-hidden p-5 max-w-full mx-auto">
          <CardContent className="grid gap-4 p-0 md:grid-cols-1">
            {/* Input Search */}
            <Input
              type="text"
              placeholder="Cari toko pupuk"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="mb-4"
              disabled={loading}
            />

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Nama</TableHead>
                    <TableHead>Produk</TableHead>
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
                        <TableCell>{item.produk}</TableCell>
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