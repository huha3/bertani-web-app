"use client";
import { useRouter } from "next/navigation"; 
import { useState } from "react";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: Supabase credentials are missing. Periksa environment variables.");
  throw new Error("Supabase credentials are missing.");
}

// Buat Supabase client dengan validasi
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log("🔹 Login Attempt:", { email, password });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      console.log("🔹 Login response:", data, error);
      
      if (error) {
        console.error("Login failed:", error.message);
        setError(error.message);
      } else if (data.session) {
        console.log("Login berhasil! User:", data.user);

        // Simpan session ke localStorage agar tidak logout setelah refresh
        localStorage.setItem("supabase_session", JSON.stringify(data.session));

        // Redirect ke dashboard
        router.push("/dashboard");
      } else {
        setError("Login gagal: tidak ada session yang dikembalikan.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Terjadi kesalahan, coba lagi.");
    }

    setLoading(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleLogin} className="p-6 md:p-8">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Selamat Datang</h1>
                <p className="text-muted-foreground text-balance">
                  Login dulu untuk mulai Bertani
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Lupa password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : "Login"}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="text-center text-sm">
                Belum punya akun? buat dulu ya{" "}
                <button 
                  onClick={() => router.push("/signup")}
                  className="underline underline-offset-4 text-blue-600 hover:text-blue-800"
                >
                  Sign up
                </button>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/login.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
