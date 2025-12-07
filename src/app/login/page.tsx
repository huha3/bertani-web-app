"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase"; 
import AuthVisibilityHandler from "@/components/auth-visibility-handler";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

interface LoginFormProps {
  className?: string;
}

export default function LoginForm({ className }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        setError(error.message);
        toast.error("Login gagal: " + error.message);
      } else if (data.session) {
        // Simpan session
        localStorage.setItem("supabase_session", JSON.stringify(data.session));
        
        toast.success("🎉 Login berhasil! Selamat datang kembali!");
        
        // Redirect ke dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else {
        setError("Login gagal: tidak ada session yang dikembalikan.");
        toast.error("Login gagal");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Terjadi kesalahan, coba lagi.");
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthVisibilityHandler />
      <div className={cn("flex flex-col gap-6 min-h-screen items-center justify-center p-4 bg-gray-50", className)}>
        <Card className="overflow-hidden w-full max-w-4xl shadow-lg">
          <CardContent className="grid p-0 md:grid-cols-2">
            {/* Form Section */}
            <form onSubmit={handleLogin} className="p-8 md:p-10 flex flex-col justify-center">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">Selamat Datang Kembali 👋</h1>
                  <p className="text-gray-600">
                    Login untuk melanjutkan bertani digital
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nama@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password *
                      </Label>
                      <a
                        href="#"
                        className="text-sm text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
                      >
                        Lupa password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
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
                      Memproses...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Login Sekarang
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                    atau
                  </span>
                </div>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-gray-600">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => router.push("/signup")}
                    className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              </div>
            </form>

            {/* Image Section */}
            <div className="bg-muted relative hidden md:block">
              <img
                src="/login.jpg"
                alt="Farming"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="text-white space-y-2">
                  <h2 className="text-3xl font-bold">Kelola Tanaman Dengan Mudah</h2>
                  <p className="text-gray-200">
                    Pantau jadwal perawatan, diagnosa penyakit, dan tingkatkan hasil panen dengan teknologi digital
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Privacy */}
        <div className="text-center text-xs text-gray-500 max-w-md">
          Dengan melanjutkan, kamu setuju dengan{' '}
          <a href="#" className="underline underline-offset-4 hover:text-gray-700">
            Syarat Layanan
          </a>{' '}
          dan{' '}
          <a href="#" className="underline underline-offset-4 hover:text-gray-700">
            Kebijakan Privasi
          </a>{' '}
          kami.
        </div>
      </div>
    </>
  );
}