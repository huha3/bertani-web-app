"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react";
import { useForm  } from "react-hook-form"
import { z } from "zod"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ComboboxDemo } from "@/components/ui/combobox-demo"
import { Progress } from "@/components/ui/progress"
import { 
  CalendarIcon, 
  Sprout, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Droplets,
  Leaf,
  MapPin,
  Thermometer,
  Wind,
  Mountain,
  Beaker
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import { supabase }  from "@/lib/supabase";
import 'react-day-picker/dist/style.css';

const formSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  varietas: z.string().optional(),
  date: z.union([z.string(), z.date()]).optional(),
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

type FormValues = z.infer<typeof formSchema>;

export default function TambahTanamanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema), 
    defaultValues: {
      name: "",
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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        console.error("Gagal ambil user:", error);
      }
    };
    checkUser();
  }, []);

  const steps = [
    {
      title: "Informasi Dasar",
      description: "Data tanaman dan varietas",
      icon: Sprout,
      fields: ["name", "varietas", "date", "estimated_harvest"]
    },
    {
      title: "Metode & Sumber",
      description: "Benih dan cara tanam",
      icon: MapPin,
      fields: ["seed_source", "plant_method"]
    },
    {
      title: "Kondisi Tanah",
      description: "Jenis dan pH tanah",
      icon: Mountain,
      fields: ["soil_type", "soil_ph", "altitude"]
    },
    {
      title: "Lingkungan",
      description: "Cuaca dan kelembaban",
      icon: Wind,
      fields: ["temperature", "air_humadity", "irrigation"]
    },
    {
      title: "Jadwal Perawatan",
      description: "Penyiraman dan pemupukan",
      icon: Droplets,
      fields: ["frequency"]
    }
  ];

  const nextStep = async () => {
    const currentFields = steps[currentStep].fields;
    const isValid = await form.trigger(currentFields as any);
    
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        return;
      }
      if (!values.date || !values.estimated_harvest) {
        toast.error("Tanggal tanam dan estimasi panen wajib diisi!");
        return;
      }

      // Format data
      const formattedData = {
        ...values,
        user_id: user.id,
        date: values.date instanceof Date ? values.date.toISOString() : values.date,
        estimated_harvest: values.estimated_harvest instanceof Date ? values.estimated_harvest.toISOString() : values.estimated_harvest,
        watering_frequency: values.frequency?.watering_frequency?.amount ?? null,
        fertilizers: values.frequency?.fertilizers?.type ?? null,
        frequency: values.frequency
          ? `${values.frequency.watering_frequency.amount} ${values.frequency.watering_frequency.unit}`
          : null,
      };

      // Save plant
      const { data: tanamanData, error: tanamanError } = await supabase
        .from('tanaman_pengguna')
        .insert([formattedData])
        .select('id')
        .single();

      if (tanamanError) throw tanamanError;

      const tanaman_id = tanamanData?.id;
      if (!tanaman_id) throw new Error("Gagal mendapatkan ID tanaman");

      // Helper function
      function convertToDays(amount: number, unit: string) {
        switch (unit) {
          case "hari": return amount;
          case "minggu": return amount * 7;
          case "bulan": return amount * 30;
          case "musim": return amount * 90;
          default: return amount;
        }
      }

      // Calculate frequencies
      const wateringAmount = Number(values.frequency?.watering_frequency?.amount) || 3;
      const wateringUnit = values.frequency?.watering_frequency?.unit || "hari";
      const fertilizerAmount = Number(values.frequency?.fertilizers?.amount) || 14;
      const fertilizerUnit = values.frequency?.fertilizers?.unit || "hari";

      let adjustedWateringFreq = convertToDays(wateringAmount, wateringUnit);
      let adjustedFertilizerFreq = convertToDays(fertilizerAmount, fertilizerUnit);

      // Apply adjustments (same logic as before)
      if (values.soil_type === "Pasir") adjustedWateringFreq -= 1;
      if (values.soil_type === "Gambut") adjustedWateringFreq += 1;
      if (values.soil_type === "Tanah Humus") adjustedWateringFreq += 2;
      
      if (values.air_humadity?.includes("Rendah")) adjustedWateringFreq -= 1;
      if (values.air_humadity?.includes("Tinggi")) adjustedWateringFreq += 1;
      
      if (values.temperature?.includes("Panas")) adjustedWateringFreq -= 1;
      
      if (adjustedWateringFreq < 1) adjustedWateringFreq = 1;
      if (adjustedFertilizerFreq < 7) adjustedFertilizerFreq = 7;

      // Generate schedule
      const start = new Date(values.date);
      const end = new Date(values.estimated_harvest);
      const jadwal: any[] = [];

      for (let current = new Date(start); current <= end; current = new Date(current.getTime() + adjustedWateringFreq * 24 * 60 * 60 * 1000)) {
        jadwal.push({
          id_menanam: tanaman_id,
          tanggal: new Date(current.getTime()),
          jenis_kegiatan: "Penyiraman",
          status: false,
          user_id: user.id,
        });
      }

      if (adjustedFertilizerFreq > 0 && values.frequency?.fertilizers?.type) {
        for (let current = new Date(start); current <= end; current = new Date(current.getTime() + adjustedFertilizerFreq * 24 * 60 * 60 * 1000)) {
          jadwal.push({
            id_menanam: tanaman_id,
            tanggal: new Date(current.getTime()),
            jenis_kegiatan: `Pemberian pupuk ${values.frequency.fertilizers.type}`,
            status: false,
            user_id: user.id,
          });
        }
      }

      jadwal.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

      const jadwalInsert = jadwal.map((item) => ({
        id_menanam: item.id_menanam,
        tanggal: item.tanggal.toISOString(),
        jenis_kegiatan: item.jenis_kegiatan,
        status: item.status,
        user_id: user.id,
      }));

      const { error: jadwalError } = await supabase
        .from("jadwal_menanam")
        .insert(jadwalInsert);

      if (jadwalError) throw jadwalError;

      toast.success("🎉 Tanaman dan jadwal berhasil disimpan!");
      router.push(`/jadwal/${tanaman_id}`);
      
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal menyimpan data");
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-6 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Sprout className="w-8 h-8 ml-2" />
          <div>
            <h1 className="text-xl font-semibold ml-2">Tambah Tanaman Baru</h1>
            <p className="text-sm text-black-50 ml-2">Buat jadwal perawatan otomatis</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Progress Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Step {currentStep + 1} dari {steps.length}
                  </span>
                  <span className="text-sm font-medium text-emerald-600">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                
                {/* Step Indicators */}
                <div className="flex justify-between mt-4">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-2 flex-1">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          isActive && "bg-emerald-500 text-white ring-4 ring-emerald-100",
                          isCompleted && "bg-emerald-500 text-white",
                          !isActive && !isCompleted && "bg-gray-200 text-gray-500"
                        )}>
                          {isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <StepIcon className="w-5 h-5" />
                          )}
                        </div>
                        <span className={cn(
                          "text-xs text-center hidden sm:block",
                          isActive && "font-semibold text-emerald-600",
                          !isActive && "text-gray-500"
                        )}>
                          {step.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = steps[currentStep].icon;
                  return <Icon className="w-6 h-6 text-emerald-500" />;
                })()}
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Step 0: Basic Info */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Tanaman *</FormLabel>
                            <FormControl>
                              <Input placeholder="Contoh: Jagung Manis" {...field} />
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
                              <Input placeholder="Contoh: Pioneer P21" {...field} />
                            </FormControl>
                            <FormDescription>Opsional - Jenis varietas spesifik</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Tanggal Menanam *</FormLabel>
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
                                    <CalendarIcon className="mr-2 w-4 h-4" />
                                    {field.value ? format(new Date(field.value), "PPP") : "Pilih Tanggal"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    if (date) field.onChange(date.toISOString());
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estimated_harvest"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Estimasi Panen *</FormLabel>
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
                                    <CalendarIcon className="mr-2 w-4 h-4" />
                                    {field.value ? format(new Date(field.value), "PPP") : "Pilih Tanggal"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    if (date) field.onChange(date.toISOString());
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 1: Method & Source */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                    </div>
                  )}

                  {/* Step 2: Soil Conditions */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
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
                            <FormLabel>pH Tanah</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="Contoh: 6.5" {...field} />
                            </FormControl>
                            <FormDescription>Nilai pH tanah (biasanya 4.0 - 9.0)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="altitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ketinggian Lokasi</FormLabel>
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
                    </div>
                  )}

                  {/* Step 3: Environment */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="air_humadity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kelembaban Udara</FormLabel>
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
                        control={form.control}
                        name="irrigation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sumber Pengairan</FormLabel>
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
                    </div>
                  )}

                  {/* Step 4: Care Schedule */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="frequency.watering_frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frekuensi Penyiraman *</FormLabel>
                            <FormControl>
                              <ComboboxDemo
                                label=""
                                options={["Setiap hari", "2x sehari (pagi & sore)", "Setiap 2 hari sekali", "Seminggu 1-2 kali", "Seminggu 1 kali"]}
                                value={field.value?.amount || ""}
                                onChange={(val) => field.onChange({ amount: val })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="frequency.fertilizers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jenis Pupuk & Frekuensi</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <ComboboxDemo
                                  label=""
                                  options={["Pupuk Kandang (Organik)", "Pupuk Kompos (Organik)", "NPK (Kimia)", "Urea (Kimia)", "POC (Pupuk Organik Cair)"]}
                                  value={field.value?.type || ""}
                                  onChange={(val) => field.onChange({ ...(field.value || {}), type: val })}
                                />
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Frekuensi"
                                    value={field.value?.amount || ""}
                                    onChange={(e) => field.onChange({ ...(field.value || {}), amount: e.target.value })}
                                  />
                                  <Select
                                    value={field.value?.unit || ""}
                                    onValueChange={(val) => field.onChange({ ...(field.value || {}), unit: val })}
                                  >
                                    <SelectTrigger className="w-[130px]">
                                      <SelectValue placeholder="Satuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="hari">Hari</SelectItem>
                                      <SelectItem value="minggu">Minggu</SelectItem>
                                      <SelectItem value="bulan">Bulan</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>Contoh: 14 hari sekali</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 pt-4">
                    {currentStep > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Kembali
                      </Button>
                    )}

                    {currentStep < steps.length - 1 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                      >
                        Lanjut
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Simpan & Buat Jadwal
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sprout className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm mb-1">Tips</p>
                  <p className="text-sm text-blue-800">
                    Isi data dengan lengkap agar sistem dapat membuat jadwal perawatan yang optimal untuk tanamanmu!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
