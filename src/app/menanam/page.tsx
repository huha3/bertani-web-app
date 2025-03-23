"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, useForm, Controller  } from "react-hook-form"
import { z } from "zod"
import { useState } from "react";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  watering_frequency: z.string().optional(),
  plant_method: z.string().optional(),
  fertilizers: z.string().optional(),
  frequency: z.object({amount: z.string(), unit: z.string(), }).optional(), 
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
      watering_frequency: "",
      plant_method: "",
      fertilizers: "",
      frequency: { amount: "", unit: "" },
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Data yang dikirim ke Supabase:", values);

      // Pastikan format tanggal sesuai
      const formattedData = {
        ...values,
        date: values.date instanceof Date ? values.date.toISOString() : values.date,
        estimated_harvest: values.estimated_harvest instanceof Date ? values.estimated_harvest.toISOString() : values.estimated_harvest,
        watering_frequency: values.watering_frequency ?? null,
        fertilizers: values.fertilizers ?? null,
        frequency: values.frequency 
          ? `${values.frequency.amount} ${values.frequency.unit}` 
          : null, //  Langsung masukin object-nya
      };

      const { data, error } = await supabase.from("tanaman_pengguna").insert([formattedData]);

      if (error) {
        console.error("Error inserting data:", error.message);
      } else {
        console.log("Data berhasil dimasukkan!");
        alert("Data berhasil disimpan!");
        form.reset();
      }
    } catch (err) {
      console.error("Terjadi kesalahan:", err);
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
                    name="watering_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frekuensi Penyiraman</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Setiap hari", "2x sehari (pagi & sore)", "Setiap 2 hari sekali", "Seminggu 1-2 kali", "Seminggu 1 kali"]}
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
                    name="fertilizers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Pupuk</FormLabel>
                        <FormControl>
                          <ComboboxDemo
                            label=""
                            options={["Pupuk Kandang (Organik)", "Pupuk Kompos (Organik)", "Pupuk Hijau (Organik)", "Pupuk Bokashi (Organik)", "Pupuk Hayati (Mikroba)", "Urea (Kimia)", "NPK (Kimia)", "SP-36 (Super Phosphate)", "ZA (Zwavelzure Ammoniak)", "KCl (Kalium Klorida)", "POC (Pupuk Organik Cair)", "Hidroponik Nutrisi (AB Mix)", "Biofertilizer (Cair)", "Osmocote (Slow Release)", "Dekastar (Dekastar)"]}
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
                    name="frequency"
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
                                onChange={(e) =>
                                  field.onChange({ ...value, amount: e.target.value })
                                }
                              />
                              <Select
                                value={value.unit} // Pastikan Select juga punya default value
                                onValueChange={(val) => field.onChange({ ...value, unit: val })}
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
                  <form onSubmit={form.handleSubmit(onSubmit)}></form>
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
