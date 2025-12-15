"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Map
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface GeocodingLog {
  nama: string;
  status: "pending" | "success" | "failed";
  latitude?: number;
  longitude?: number;
  error?: string;
}

export default function AdminGeocodePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<GeocodingLog[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });

  const geocodeWithNominatim = async (address: string, city: string) => {
    const fullAddress = `${address}, ${city}, Indonesia`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TaniApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }

    return null;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startGeocoding = async () => {
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    setStats({ total: 0, success: 0, failed: 0 });

    try {
      // Fetch toko tanpa koordinat
      const { data: tokos, error } = await supabase
        .from('toko_pupuk')
        .select('*')
        .or('latitude.is.null,longitude.is.null');

      if (error) throw error;

      if (!tokos || tokos.length === 0) {
        toast.success("Semua toko sudah memiliki koordinat!");
        setIsRunning(false);
        return;
      }

      const total = tokos.length;
      setStats(prev => ({ ...prev, total }));
      toast.info(`Memulai geocoding ${total} toko...`);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < tokos.length; i++) {
        const toko = tokos[i];
        
        // Add pending log
        setLogs(prev => [...prev, {
          nama: toko.nama,
          status: "pending"
        }]);

        try {
          // Geocode
          const result = await geocodeWithNominatim(toko.alamat, toko.kota);

          if (result) {
            // Update database
            const { error: updateError } = await supabase
              .from('toko_pupuk')
              .update({
                latitude: result.latitude,
                longitude: result.longitude
              })
              .eq('id', toko.id);

            if (updateError) throw updateError;

            // Update log to success
            setLogs(prev => prev.map(log => 
              log.nama === toko.nama 
                ? { ...log, status: "success", latitude: result.latitude, longitude: result.longitude }
                : log
            ));

            successCount++;
          } else {
            throw new Error("No results from geocoding");
          }
        } catch (error: any) {
          // Update log to failed
          setLogs(prev => prev.map(log => 
            log.nama === toko.nama 
              ? { ...log, status: "failed", error: error.message }
              : log
          ));
          failCount++;
        }

        // Update progress
        const currentProgress = ((i + 1) / total) * 100;
        setProgress(currentProgress);
        setStats({ total, success: successCount, failed: failCount });

        // Rate limiting
        if (i < tokos.length - 1) {
          await delay(1100); // 1.1 seconds
        }
      }

      toast.success(`Selesai! ${successCount} berhasil, ${failCount} gagal`);

    } catch (error: any) {
      console.error("Error during geocoding:", error);
      toast.error("Terjadi kesalahan: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center border-b px-6 bg-white">
        <div className="flex items-center gap-3 ml-4">
          <Map className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-semibold">Admin - Geocoding Toko</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Control Card */}
          <Card>
            <CardHeader>
              <CardTitle>Auto Geocoding</CardTitle>
              <CardDescription>
                Convert alamat toko menjadi koordinat latitude & longitude menggunakan OpenStreetMap Nominatim (FREE)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={startGeocoding}
                  disabled={isRunning}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Mulai Geocoding
                    </>
                  )}
                </Button>

                <div className="text-sm text-gray-600">
                  Rate limit: 1 request/second
                </div>
              </div>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          {stats.total > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">{stats.success}</p>
                    <p className="text-sm text-gray-600">Berhasil</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                    <p className="text-sm text-gray-600">Gagal</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Logs</CardTitle>
                <CardDescription>Real-time geocoding progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {log.status === "pending" && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        )}
                        {log.status === "success" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                        {log.status === "failed" && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{log.nama}</p>
                          {log.latitude && log.longitude && (
                            <p className="text-xs text-gray-500">
                              {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)}
                            </p>
                          )}
                          {log.error && (
                            <p className="text-xs text-red-600">{log.error}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          log.status === "success" ? "default" : 
                          log.status === "failed" ? "destructive" : 
                          "outline"
                        }
                        className={log.status === "success" ? "bg-emerald-100 text-emerald-800" : ""}
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}