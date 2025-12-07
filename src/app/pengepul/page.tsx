"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  MapPin, 
  Package, 
  Search,
  ExternalLink,
  Phone,
  Mail,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Pengepul {
  id: string;
  nama: string;
  jenis_panen: string;
  kota: string;
  alamat: string;
  kontak?: string;
  email?: string;
  rating?: number;
}

export default function PengepulPage() {
  const [data, setData] = useState<Pengepul[]>([]);
  const [filteredData, setFilteredData] = useState<Pengepul[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [jenisTypes, setJenisTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchPengepul();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedType, data]);

  const fetchPengepul = async () => {
    try {
      const { data: pengepulData, error } = await supabase
        .from("pengepul")
        .select("*")
        .order("nama", { ascending: true });

      if (error) throw error;

      setData(pengepulData || []);

      // Extract unique jenis panen
      const types = Array.from(
        new Set((pengepulData || []).map(p => p.jenis_panen))
      );
      setJenisTypes(types);

    } catch (error) {
      console.error("Error fetching pengepul:", error);
      toast.error("Gagal memuat data pengepul");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...data];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.nama.toLowerCase().includes(query) ||
          p.jenis_panen.toLowerCase().includes(query) ||
          p.kota.toLowerCase().includes(query) ||
          p.alamat.toLowerCase().includes(query)
      );
    }

    // Filter by jenis panen
    if (selectedType !== "all") {
      filtered = filtered.filter(p => p.jenis_panen === selectedType);
    }

    setFilteredData(filtered);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const PengepulCard = ({ pengepul }: { pengepul: Pengepul }) => (
    <Card className="hover:shadow-lg transition-all border-l-4 border-l-emerald-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {pengepul.nama}
              </h3>
              <Badge className="bg-emerald-100 text-emerald-800">
                <Package className="w-3 h-3 mr-1" />
                {pengepul.jenis_panen}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Location */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{pengepul.kota}</p>
              <p className="text-gray-600">{pengepul.alamat}</p>
            </div>
          </div>

          {/* Contact Info */}
          {pengepul.kontak && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>{pengepul.kontak}</span>
            </div>
          )}

          {pengepul.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{pengepul.email}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button 
          className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600"
          onClick={() => {
            // Open Google Maps or contact
            const address = `${pengepul.alamat}, ${pengepul.kota}`;
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
          }}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Buka Lokasi
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center border-b px-6 bg-white">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Store className="w-8 h-8 ml-2" />
          <div>
            <h1 className="text-xl font-semibold ml-2">Saran Pengepul</h1>
            <p className="text-sm text-black-50 ml-2">Temukan pengepul hasil panen terdekat</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <>
              {/* Search & Filter Section */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Cari berdasarkan nama, jenis panen, kota, atau alamat..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600 font-medium">Filter:</span>
                      <Button
                        variant={selectedType === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("all")}
                        className={selectedType === "all" ? "bg-emerald-500" : ""}
                      >
                        Semua ({data.length})
                      </Button>
                      {jenisTypes.map(type => (
                        <Button
                          key={type}
                          variant={selectedType === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedType(type)}
                          className={selectedType === type ? "bg-emerald-500" : ""}
                        >
                          {type} ({data.filter(p => p.jenis_panen === type).length})
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Pengepul</p>
                        <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                      </div>
                      <Store className="w-10 h-10 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Hasil Pencarian</p>
                        <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
                      </div>
                      <Search className="w-10 h-10 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Jenis Tersedia</p>
                        <p className="text-2xl font-bold text-purple-600">{jenisTypes.length}</p>
                      </div>
                      <Package className="w-10 h-10 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {searchQuery || selectedType !== "all" 
                      ? `Hasil Pencarian (${filteredData.length})`
                      : "Semua Pengepul"
                    }
                  </h2>
                </div>

                {filteredData.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                      <Store className="w-16 h-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Tidak ada pengepul ditemukan
                      </h3>
                      <p className="text-gray-500">
                        Coba ubah kata kunci pencarian atau filter
                      </p>
                      {(searchQuery || selectedType !== "all") && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedType("all");
                          }}
                        >
                          Reset Filter
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.map((pengepul) => (
                      <PengepulCard key={pengepul.id} pengepul={pengepul} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}