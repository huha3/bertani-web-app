"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@supabase/supabase-js";
import { useForm, FormProvider  } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignupForm() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [nomor, setNomor] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateBirth, setDateBirth] = useState<Date | undefined>(undefined);
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null); // Perbaikan tipe
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      dob: undefined,
    },
  });
  const MyForm = () => {
    const form = useForm(); }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  const { error } = await supabase.auth.signUp({ email, password, 
    options: {
      data: {
        username,
        name,
        nomor,
        dateBirth,
        address,
      },
    }, 
  });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage("Registrasi berhasil!");
      setTimeout(() => router.push("/login"), 1000);
    }

    setLoading(false);
  };

  return (
    <FormProvider {...form}>
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <h1 className="text-2xl font-bold text-center">Selamat Datang</h1>
            <p className="text-center text-muted-foreground">Daftar dulu di Bertani</p>
            <div className="grid gap-3">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" placeholder="A*** H**** N****" value={name} onChange={(e) => setName(e.target.value)} required />

              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="H***" value={username} onChange={(e) => setUsername(e.target.value)} required />

              <Label htmlFor="nomor">No. HP</Label>
              <Input id="nomor" placeholder="08xxxxxxxxxx" value={nomor} onChange={(e) => setNomor(e.target.value)} required />

              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="example@gmail.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

              <Label htmlFor="password">Password</Label>
              <Input id="password" placeholder="*********" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Lahir</FormLabel>
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
                              if (date) field.onChange(date);
                            }}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" placeholder="Jl. **** No. ****, ****, ****" value={address} onChange={(e) => setAddress(e.target.value)} required />
              {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}
              {error && <p className="text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mendaftar..." : "Daftar"}
              </Button>
              <p className="text-center text-sm">
                Sudah punya akun?{' '}
                <button onClick={() => router.push("/login")} className="underline text-blue-600 hover:text-blue-800">
                  Login
                </button>
              </p> 
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img src="/login.jpg" alt="Image" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </CardContent>
      </Card>
      
    </div>
    </FormProvider>
  );
}
