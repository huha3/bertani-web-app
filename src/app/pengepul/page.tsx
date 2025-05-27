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
import supabase  from "@/lib/supabase";


export default function PengepulPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Data Pengepul</h1>
        </div>
      </header>

      <div className="flex flex-col h-full p-5">
        <Card className="overflow-hidden p-5 w-[950px] mx-auto">
          <CardContent className="grid p-0 md:grid-cols-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jenis Panen</TableHead>
                  <TableHead className="text-right">Alamat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">1</TableCell>
                  <TableCell>Panen Tani Lestari</TableCell>
                  <TableCell>Padi, jagung, kopi</TableCell>
                  <TableCell className="text-right">Geneng, Kowangan, Temanggung, Temanggung Regency, Central Java 56218</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
