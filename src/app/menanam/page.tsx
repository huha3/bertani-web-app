"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react";
import { SubmitHandler, useForm, Controller  } from "react-hook-form"
import { z } from "zod"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ComboboxDemo } from "@/components/ui/combobox-demo"
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import supabase  from "@/lib/supabase";
import { generateJadwal } from "@/lib/generateJadwal";
import { hitungIntervalSiram } from '@/app/menanam/utils';

const formSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  plant_type: z.string().min(1, "Jenis tanaman harus diisi"),
  varietas: z.string().optional(),
  date: z.union([z.string(), z.date()]).optional(),  // Bisa string atau Date
  estimated_harvest: z.union([z.string(), z.date()]).optional(), 
  seed_source: z.string().optional(),
  soil_type: z.string().optional(),
  soil_ph: z.string().optional(),
  air_humadity: z.string().optional(),
  temperature: z.string().optional(),
  altitude: z.string().optional(),
  irrigation: z.string().optional(),
  plant_method: z.string().optional(),
  frequency: z.object({
    watering_frequency: z.object({
      amount: z.string().min(1, "Harus diisi"),
      unit: z.string().optional(),
    }),
    fertilizers: z.object({
      type: z.string(),
      amount: z.string(),
      unit: z.string(),
    }),
  }),
  
});

export default function Page() {
  const form = useForm({
    resolver: zodResolver(formSchema), 
    defaultValues: {
      name: "",
      plant_type: "",
      varietas: "",
      date: "",
      estimated_harvest: "",
      seed_source: "",
      soil_type: "",
      soil_ph: "",
      air_humadity: "",
      temperature: "",
      altitude: "",
      irrigation: "",
      plant_method: "",
      frequency: {
          watering_frequency: { amount: "", unit: "" },
          fertilizers: { type: "", amount: "", unit: "" },
        }
    }
  });
  
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);


  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        console.log("User saat ini:", user);
        setUserId(user.id); // Simpan user.id ke state
      } else {
        console.error("Gagal ambil user:", error);
      }
    };
    checkUser();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("handleSubmit dipanggil");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        return;
      }
      const payload = {
        ...values,
        id_user: user.id, 
      };
      
      const { error } = await supabase.from("nama_tabel").insert(payload);
      // const user_id = user.id;
      
      if (!values.date || !values.estimated_harvest) {
        toast.error("Tanggal tanam dan estimasi panen wajib diisi!");
        return;
      }
  
      // Format data untuk insert tanaman
      const formattedData = {
        ...values,
        user_id: user.id,
        date: values.date instanceof Date ? values.date.toISOString() : values.date,
        estimated_harvest: values.estimated_harvest instanceof Date ? values.estimated_harvest.toISOString() : values.estimated_harvest,
        watering_frequency: values.frequency?.watering_frequency?.amount ?? null,
        fertilizers:  values.frequency?.fertilizers?.type ?? null,
        frequency: values.frequency
          ? `${values.frequency.watering_frequency.amount} ${values.frequency.watering_frequency.unit}`
          : null,
      };

      // Simpan data tanaman ke Supabase
      const { data: tanamanData, error: tanamanError } = await supabase
        .from('tanaman_pengguna')
        .insert([formattedData])
        .select('id')
        .single();

      if (tanamanError) {
        toast.error("Gagal menyimpan tanaman: " + tanamanError.message);
        return;
      }

      const tanaman_id = tanamanData?.id;
      if (!tanaman_id) {
        toast.error("Gagal mendapatkan ID tanaman.");
        return;
      }
      
      // Fungsi bantu convert unit ke hari
      function convertToDays(amount: number, unit: string) {
        switch (unit) {
          case "hari": return amount;
          case "minggu": return amount * 7;
          case "bulan": return amount * 30;
          case "musim": return amount * 90;
          default: return amount;
        }
      }

      // Ambil nilai frekuensi dari values (pakai watering_frequency)
      const wateringAmount = Number(values.frequency?.watering_frequency?.amount) || 3;
      const wateringUnit = values.frequency?.watering_frequency?.unit || "hari";

      const fertilizerAmount = Number(values.frequency?.fertilizers?.amount) || 14;
      const fertilizerUnit = values.frequency?.fertilizers?.unit || "hari";

      // Gunakan let karena nanti akan diubah
      let adjustedWateringFreq = convertToDays(wateringAmount, wateringUnit);
      let adjustedFertilizerFreq = convertToDays(fertilizerAmount, fertilizerUnit);
  
      if (values.soil_type === "Pasir") adjustedWateringFreq -= 1;
      if (values.soil_type === "Gambut") adjustedWateringFreq += 1;
      if (values.soil_type === "Lempung") adjustedWateringFreq += 0;
      if (values.soil_type === "Tanah Vulkanik") adjustedWateringFreq += 1;
      if (values.soil_type === "Tanah Aluvial") adjustedWateringFreq += 0;
      if (values.soil_type === "Tanah Berbatu") adjustedWateringFreq -= 1;
      if (values.soil_type === "Tanah Laterit") adjustedWateringFreq += 1;
      if (values.soil_type === "Tanah Humus") adjustedWateringFreq += 2;
  
      if (values.air_humadity?.includes("Rendah")) adjustedWateringFreq -= 1;
      if (values.air_humadity?.includes("Sedang")) adjustedWateringFreq += 0;
      if (values.air_humadity?.includes("Tinggi")) adjustedWateringFreq += 1;

      if (values.temperature?.includes("Dingin")) adjustedWateringFreq += 1;
      if (values.temperature?.includes("Sedang")) adjustedWateringFreq += 0;
      if (values.temperature?.includes("Hangat")) adjustedWateringFreq += 0;
      if (values.temperature?.includes("Panas")) adjustedWateringFreq -= 1;
  
      if (values.irrigation?.includes("Irigasi Tetes")) {adjustedWateringFreq += 1;}
      if (values.irrigation?.includes("Irigasi Subsurface")) {adjustedWateringFreq += 1;}
      if (values.irrigation?.includes("Irigasi Permukaan")) {adjustedWateringFreq -= 1;}
      if (values.irrigation?.includes("Irigasi Tadah Hujan")) {adjustedWateringFreq -= 1;}
      if (values.irrigation?.includes("Irigasi Sumur/Pompa")) {adjustedWateringFreq -= 1;}
      if (values.irrigation?.includes("Irigasi Sprinkler")) { }
  
      if (adjustedWateringFreq < 1) adjustedWateringFreq = 1;

      if (values.seed_source?.includes("Benih hasil panen sendiri")) {adjustedFertilizerFreq -= 2;}
      if (values.seed_source?.includes("Benih dari petani lain")) {adjustedFertilizerFreq -= 1;}
      if (values.seed_source?.includes("Benih dari alam liar")) {adjustedFertilizerFreq -= 1;}
      if (values.seed_source?.includes("Benih dari balai penelitian/pemerintah")) {adjustedFertilizerFreq += 1;}
      if (values.seed_source?.includes("Benih komersial")) { }
      
      if (values.altitude?.includes("Dataran Tinggi")) {adjustedFertilizerFreq += 1;}
      if (values.altitude?.includes("Dataran Menengah")) {adjustedFertilizerFreq += 2;}
      if (values.altitude?.includes("Dataran Rendah")) {adjustedFertilizerFreq += 2;}      

      if (values.frequency?.fertilizers?.type === "Pupuk Kandang (Organik)") adjustedFertilizerFreq -= 1;
      if (values.frequency?.fertilizers?.type === "Pupuk Kompos (Organik)") adjustedFertilizerFreq += 1;
      if (values.frequency?.fertilizers?.type === "Pupuk Hijau (Organik)") adjustedFertilizerFreq += 1;
      if (values.frequency?.fertilizers?.type === "Pupuk Bokashi (Organik)") adjustedFertilizerFreq += 1;
      if (values.frequency?.fertilizers?.type === "Pupuk Hayati (Mikroba)") adjustedFertilizerFreq += 1;
      if (values.frequency?.fertilizers?.type === "Urea (Kimia)") adjustedFertilizerFreq -= 1;
      if (values.frequency?.fertilizers?.type === "NPK (Kimia)") adjustedFertilizerFreq -= 1;
      if (values.frequency?.fertilizers?.type === "SP-36 (Super Phosphate)") adjustedFertilizerFreq -= 1;
      if (values.frequency?.fertilizers?.type === "ZA (Zwavelzure Ammoniak)") adjustedFertilizerFreq -= 1;
      if (values.frequency?.fertilizers?.type === "KCl (Kalium Klorida)") adjustedFertilizerFreq -= 1;
      if (values.frequency?.fertilizers?.type === "POC (Pupuk Organik Cair)") adjustedFertilizerFreq += 1;
      if (values.frequency?.fertilizers?.type === "Hidroponik Nutrisi (AB Mix)") adjustedFertilizerFreq += 1;
      if (values.frequency?.fertilizers?.type === "Biofertilizer (Cair)") adjustedFertilizerFreq += 1;
      if (values.frequency?.fertilizers?.type === "Osmocote (Slow Release)") adjustedFertilizerFreq -= 1;
      if (values.frequency?.fertilizers?.type === "Dekastar (Dekastar)") adjustedFertilizerFreq -= 1;
      if (values.soil_ph && parseFloat(values.soil_ph) < 5.5) adjustedFertilizerFreq -= 2;
  
      if (values.soil_ph && parseFloat(values.soil_ph) < 5.5) adjustedFertilizerFreq -= 2;
      if (adjustedFertilizerFreq < 7) adjustedFertilizerFreq = 7;
  
      const start = new Date(values.date);
      const end = new Date(values.estimated_harvest);

      if (adjustedWateringFreq <= 0 || adjustedFertilizerFreq <= 0) {
        toast.error("Frekuensi penyiraman atau pemupukan tidak valid.");
        return;
      }

      // deklarasi jadwal sebelum loop
      const jadwal: any[] = [];

      // Looping jadwal penyiraman
      for (let current = new Date(start); current <= end; current = new Date(current.getTime() + adjustedWateringFreq * 24 * 60 * 60 * 1000)) {
        jadwal.push({
          id_menanam: tanaman_id,
          tanggal: new Date(current.getTime()),
          jenis_kegiatan: "Penyiraman",
          status: false,
          id_user: user.id,
        });
      }

      // Looping jadwal pemupukan
      if (adjustedFertilizerFreq > 0 && values.frequency?.fertilizers?.type) {
        const daysToAdd = fertilizerUnit === "minggu" ? adjustedFertilizerFreq * 7 : adjustedFertilizerFreq;
        for (let current = new Date(start); current <= end; current = new Date(current.getTime() + daysToAdd * 24 * 60 * 60 * 1000)) {
          jadwal.push({
            id_menanam: tanaman_id,
            tanggal: new Date(current.getTime()),
            jenis_kegiatan: `Pemberian pupuk ${values.frequency?.fertilizers}`,
            status: false,
            id_user: userId,
          });
        }
      }

       const jadwalInsert = jadwal.map((item) => ({
        id_menanam: item.id_menanam,
        tanggal: item.tanggal.toISOString(),
        jenis_kegiatan: item.jenis_kegiatan,
        status: item.status,
      }));

      const { error: jadwalError } = await supabase
        .from("jadwal_menanam")
        .insert(jadwalInsert);

      if (jadwalError) {
        toast.error("Gagal menyimpan jadwal: " + jadwalError.message);
        return;
      }

      toast.success("Data tanaman dan jadwal berhasil disimpan!");
      router.push("/jadwal"); 
    } catch (error) {
      console.error("Terjadi error saat submit:", error);
      toast.error("Terjadi kesalahan saat menyimpan data.");
    } 
  };  
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Data Tanamanmu</h1>
        </div>
      </header>
      <div className="flex flex-col h-full p-5">
        <Card className="overflow-hidden p-5 w-[600px] mx-auto">
          <CardContent className="grid p-0 md:grid-cols-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Tanaman</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Padi"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  <FormField
                    control={form.control}
                    name="plant_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Tanaman</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Serealia", "Umbi-umbian", "Buah", "Sayuran", "Kacang-kacangan", "Rempah", "Tanaman Herbal", "Tanaman Hias"]}
                            value={field.value || ""} // Pakai field.value biar sinkron
                            onChange={field.onChange} // Pakai field.onChange biar tersimpan di form
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="varietas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Varietas</FormLabel>
                        <FormControl>
                          <Input placeholder="Japonica" {...field} />
                        </FormControl>
                        {/* <FormDescription>
                          This is your public display name.
                        </FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Menanam</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2" />
                                  {field.value ? format(new Date(field.value), "PPP") : "Pilih Tanggal"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(date.toISOString()); // Convert Date ke String
                                  }
                                }}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                              {/* <FormDescription>
                          Tanggal lahir digunakan untuk menghitung umur.
                        </FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimated_harvest"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Estimasi Panen</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2" />
                                  {field.value ? format(new Date(field.value), "PPP") : "Pilih Tanggal"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(date.toISOString()); // Convert Date ke String
                                  }
                                }}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                              {/* <FormDescription>
                          Tanggal lahir digunakan untuk menghitung umur.
                        </FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} // <- Panggil dari useForm
                    name="seed_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sumber Benih</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Benih komersial", "Benih hasil panen sendiri", "Benih dari petani lain", "Benih dari balai penelitian/pemerintah", "Benih dari alam liar"]}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} // <- Panggil dari useForm
                    name="soil_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Tanah</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Lempung", "Pasir", "Gambut", "Tanah Vulkanik", "Tanah Aluvial", "Tanah Berbatu", "Tanah Laterit", "Tanah Humus"]}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="soil_ph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PH Tanah</FormLabel>
                        <FormControl>
                          <Input placeholder="5.8, 6.5" {...field} />
                        </FormControl>
                        {/* <FormDescription>
                          This is your public display name.
                        </FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} // <- Panggil dari useForm
                    name="air_humadity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kelembapan Udara</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Rendah (<40%)", "Sedang (40%-70%)", "Tinggi (>70%)"]}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} // <- Panggil dari useForm
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperatur</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Dingin (<15°C)", "Sedang (15°C - 25°C)", "Hangat (25°C - 35°C)", "Panas (>35°C)"]}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} // <- Panggil dari useForm
                    name="altitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ketinggian dari Dasar Laut</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Dataran Rendah (<500 mdpl)", "Dataran Menengah (500 - 1000 mdpl)", "Dataran Tinggi (>1000 mdpl)"]}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} // <- Panggil dari useForm
                    name="irrigation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Irigasi</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Irigasi Permukaan", "Irigasi Tetes", "Irigasi Sprinkler", "Irigasi Subsurface (bawah tanah)", "Irigasi Sumur/Pompa", "Irigasi Tadah Hujan"]}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} // <- Panggil dari useForm
                    name="frequency.watering_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frekuensi Penyiraman</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Setiap hari", "2x sehari (pagi & sore)", "Setiap 2 hari sekali", "Seminggu 1-2 kali", "Seminggu 1 kali"]}
                            value={field.value.amount || ""}
                             onChange={(val) => {
                                field.onChange({
                                  ...(field.value || {}),
                                  amount: val, // Hanya ubah amount
                                });
                              } }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} // <- Panggil dari useForm
                    name="plant_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metode Penanaman</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Tanam Langsung", "Pembibitan Terpisah", "Hidroponik", "Aeroponik", "Vertikultur", "Tumpangsari", "Monokultur", "Polikultur", "Agroforestri"]}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control} // <- Panggil dari useForm
                    name="frequency.fertilizers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Pupuk</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Pupuk Kandang (Organik)", "Pupuk Kompos (Organik)", "Pupuk Hijau (Organik)", "Pupuk Bokashi (Organik)", "Pupuk Hayati (Mikroba)", "Urea (Kimia)", "NPK (Kimia)", "SP-36 (Super Phosphate)", "ZA (Zwavelzure Ammoniak)", "KCl (Kalium Klorida)", "POC (Pupuk Organik Cair)", "Hidroponik Nutrisi (AB Mix)", "Biofertilizer (Cair)", "Osmocote (Slow Release)", "Dekastar (Dekastar)"]}
                            value={field.value?.type || ""}
                            onChange={(val) => field.onChange({ ...(field.value || {}), type: val })}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="frequency.fertilizers"
                    render={({ field }) => {
                      // Pastikan field.value adalah objek
                      const value =
                        typeof field.value === "object" && field.value !== null
                          ? field.value
                          : { amount: "", unit: "" };

                      return (
                        <FormItem>
                          <FormLabel>Frekuensi Pemupukan</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Masukkan frekuensi"
                                value={field.value?.amount || ""}
                                type="number"
                                onChange={(val) => {
                                  field.onChange({
                                    ...(field.value || {}),
                                    amount: val,
                                  });
                                }}
                              />
                              <Select
                                value={field.value?.unit || ""}
                                onValueChange={(val) => field.onChange({ ...(field.value || {}), unit: val })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih satuan" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hari">Hari</SelectItem>
                                  <SelectItem value="minggu">Minggu</SelectItem>
                                  <SelectItem value="bulan">Bulan</SelectItem>
                                  <SelectItem value="musim">Musim</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
