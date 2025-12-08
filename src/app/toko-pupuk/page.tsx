"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Search, 
  Navigation, 
  Store,
  Phone,
  ExternalLink,
  Filter,
  SlidersHorizontal
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TokoPupuk = {
  id: string;
  nama: string;
  produk: string;
  kota: string;
  alamat: string;
  telepon?: string;
  lat?: number;
  lon?: number;
  distance?: number; // in KM
};

type SortType = "nearest" | "name" | "city";

export default function TokoPupukPage() {
  const router = useRouter();
  const [data, setData] = useState<TokoPupuk[]>([]);
  const [query, setQuery] = useState("");
  const [resultList, setResultList] = useState<TokoPupuk[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortType>("nearest");
  const [maxDistance, setMaxDistance] = useState<number>(50); // KM

  useEffect(() => {
    fetchUserLocation();
    fetchTokoPupuk();
  }, []);

  useEffect(() => {
    handleSearch(query);
  }, [data, sortBy, maxDistance, userLocation]);

  const fetchUserLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("address, lat, lon")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserAddress(profile.address || "Alamat tidak tersedia");
        
        // Jika sudah ada lat/long di database
        if (profile.lat && profile.lon) {
          setUserLocation({
            lat: profile.lat,
            lng: profile.lon
          });
        } else {
          // Coba ambil dari browser geolocation
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setUserLocation({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
                // Optional: update ke database
                updateUserLocation(position.coords.latitude, position.coords.longitude);
              },
              (error) => {
                console.log("Geolocation error:", error);
                toast.error("Tidak bisa mendapatkan lokasi");
              }
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user location:", error);
    }
  };

  const updateUserLocation = async (lat: number, lng: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ latitude: lat, longitude: lng })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const fetchTokoPupuk = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("toko_pupuk")
        .select("*");

      if (error) throw error;

      setData(data || []);
    } catch (error: any) {
      console.error("Error fetching toko pupuk:", error);
      toast.error("Gagal memuat data toko pupuk");
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * 
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    const trimmed = value.trim().toLowerCase();

    let filtered = [...data];

    // Filter by search query
    if (trimmed !== "") {
      filtered = filtered.filter(
        (item) =>
          item.nama.toLowerCase().includes(trimmed) ||
          item.produk.toLowerCase().includes(trimmed) ||
          item.kota.toLowerCase().includes(trimmed) ||
          item.alamat.toLowerCase().includes(trimmed)
      );
    }

    // Calculate distance if user location available
    if (userLocation) {
      filtered = filtered.map(toko => {
        if (toko.lat && toko.lon) {
          return {
            ...toko,
            distance: calculateDistance(
              userLocation.lat,
              userLocation.lng,
              toko.lat,
              toko.lon
            )
          };
        }
        return toko;
      });

      // Filter by max distance
      filtered = filtered.filter(toko => 
        !toko.distance || toko.distance <= maxDistance
      );
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "nearest":
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        case "name":
          return a.nama.localeCompare(b.nama);
        case "city":
          return a.kota.localeCompare(b.kota);
        default:
          return 0;
      }
    });

    setResultList(filtered);
  };

  const openMaps = (toko: TokoPupuk) => {
    if (toko.lat && toko.lon) {
      const url = `https://www.google.com/maps/search/?api=1&query=${toko.lat},${toko.lon}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(toko.alamat + ", " + toko.kota)}`;
      window.open(url, '_blank');
    }
  };

  const listToDisplay = query === "" && sortBy === "nearest" && userLocation ? resultList : (query === "" ? data : resultList);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center border-b px-6 bg-white">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-3 ml-4">
          <Store className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-semibold">Toko Pupuk Terdekat</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* User Location Card */}
          {userLocation && (
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-900">Lokasi Kamu</p>
                    <p className="text-xs text-emerald-700">{userAddress}</p>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    <Navigation className="w-3 h-3 mr-1" />
                    Aktif
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search & Filter Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Cari Toko Pupuk</CardTitle>
              <CardDescription>
                Temukan toko pupuk terdekat dari lokasimu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari nama toko, produk, atau kota..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Urutkan:</span>
                </div>
                
                <Button
                  variant={sortBy === "nearest" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("nearest")}
                  disabled={!userLocation}
                  className={sortBy === "nearest" ? "bg-emerald-600" : ""}
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Terdekat
                </Button>

                <Button
                  variant={sortBy === "name" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("name")}
                  className={sortBy === "name" ? "bg-emerald-600" : ""}
                >
                  Nama
                </Button>

                <Button
                  variant={sortBy === "city" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("city")}
                  className={sortBy === "city" ? "bg-emerald-600" : ""}
                >
                  Kota
                </Button>

                {userLocation && (
                  <>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-sm text-gray-600">Radius:</span>
                      <select
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value={10}>10 km</option>
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                        <option value={100}>100 km</option>
                        <option value={999}>Semua</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {!userLocation && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Lokasi tidak aktif</p>
                    <p className="text-xs mt-1">Aktifkan lokasi untuk melihat toko terdekat</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Card */}
          {query !== "" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Hasil Pencarian
                  </CardTitle>
                  <Badge variant="outline">
                    {listToDisplay.length} Toko
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Nama Toko</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Kota</TableHead>
                        <TableHead>Alamat</TableHead>
                        {userLocation && <TableHead className="w-[100px]">Jarak</TableHead>}
                        <TableHead className="w-[100px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={userLocation ? 6 : 5} className="text-center py-12">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                              <span className="text-gray-600">Memuat data...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : listToDisplay.length > 0 ? (
                        listToDisplay.map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{item.nama}</TableCell>
                            <TableCell className="text-sm text-gray-600">{item.produk}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {item.kota}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{item.alamat}</TableCell>
                            {userLocation && (
                              <TableCell>
                                {item.distance ? (
                                  <Badge className="bg-emerald-100 text-emerald-800">
                                    {item.distance} km
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </TableCell>
                            )}
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openMaps(item)}
                                className="gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Maps
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={userLocation ? 6 : 5} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2">
                              <Store className="w-12 h-12 text-gray-400" />
                              <p className="text-gray-600 font-medium">Toko tidak ditemukan</p>
                              <p className="text-sm text-gray-500">
                                Coba kata kunci lain
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}