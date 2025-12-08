"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { CalendarIcon, User, UserCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase }  from "@/lib/supabase";
import { useForm, FormProvider  } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [nomor, setNomor] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      dob: undefined,
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { dob } = form.getValues();

    // Validate gender
    if (!gender) {
      setError("Pilih jenis kelamin terlebih dahulu");
      setLoading(false);
      return;
    }

    try {
      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      const user = data?.user;

      // Pilih folder berdasarkan gender
      const folder = gender === "male" ? "gender/male" : "gender/female";

      // Ambil semua file di folder tersebut
      const { data: files, error: listError } = await supabase.storage
        .from("profil")
        .list(folder.replace("gender/", ""), { limit: 100 });

      if (listError) {
        console.error("Gagal mengambil daftar avatar:", listError.message);
      }

      // Pilih random avatar
      const randomFile = files?.length
        ? files[Math.floor(Math.random() * files.length)].name
        : null;

      // Buat URL avatar
      const avatarUrl = randomFile
        ? `https://YOUR-PROJECT-REF.supabase.co/storage/v1/object/public/avatars/${gender}/${randomFile}`
        : null;


      if (user) {
        // Insert profile
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: user.id,
            full_name: name,
            username: username,
            phone_number: nomor,
            gender: gender,
            date_of_birth: dob ? new Date(dob).toISOString() : null,
            address: address,
            email: email,
            avatar_url: avatarUrl,
          },
        ]);

        if (profileError) throw profileError;

        toast.success("Akun berhasil dibuat! Silakan cek email untuk verifikasi.");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Terjadi kesalahan saat mendaftar");
      toast.error(err.message || "Gagal membuat akun");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6 min-h-screen items-center justify-center p-4 bg-gray-50">
        <Card className="overflow-hidden w-full max-w-4xl shadow-lg">
          <CardContent className="grid p-0 md:grid-cols-2">
            {/* Form Section */}
            <form className="p-6 md:p-8 space-y-4" onSubmit={handleSubmit}>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Selamat Datang 👋</h1>
                <p className="text-gray-600 mt-2">Daftar untuk memulai bertani digital</p>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {/* Nama Lengkap */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="Masukkan ">Username *</Label>
                  <Input
                    id="username"
                    placeholder="Masukkan nama pengguna"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Gender - Radio Group */}
                <div className="space-y-3">
                  <Label>Jenis Kelamin *</Label>
                  <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="cursor-pointer flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        Laki-laki
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="cursor-pointer flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-pink-600" />
                        Perempuan
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Lahir *</FormLabel>
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
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(new Date(field.value), "PPP")
                                : "Pilih Tanggal"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) field.onChange(date)
                            }}
                            captionLayout="dropdown"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className="rounded-md border shadow-sm"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* No. HP */}
                <div className="space-y-2">
                  <Label htmlFor="nomor">No. HP</Label>
                  <Input
                    id="nomor"
                    placeholder="08123456789"
                    value={nomor}
                    onChange={(e) => setNomor(e.target.value)}
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    placeholder="Jl. Raya No. 123, Kota"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-emerald-500 hover:bg-emerald-600" 
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mendaftar...
                  </>
                ) : (
                  "Daftar Sekarang"
                )}
              </Button>

              {/* Login Link */}
              <p className="text-center text-sm text-gray-600">
                Sudah punya akun?{' '}
                <button 
                  type="button"
                  onClick={() => router.push("/login")} 
                  className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Login
                </button>
              </p>
            </form>

            {/* Image Section */}
            <div className="bg-muted relative hidden md:block">
              <img 
                src="/login.jpg" 
                alt="Farming" 
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="text-white">
                  <h2 className="text-3xl font-bold mb-2">Mulai Bertani Digital</h2>
                  <p className="text-gray-200">Kelola tanaman dan jadwal perawatan dengan mudah</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}
