"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sprout, 
  Calendar, 
  Trophy, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Bell,
  Shield,
  Zap
} from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();

  const features = [
    {
      icon: Calendar,
      title: "Jadwal Otomatis",
      description: "Sistem membuat jadwal perawatan berdasarkan kondisi tanaman dan lingkungan",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: Sparkles,
      title: "Diagnosa AI",
      description: "Deteksi penyakit tanaman dengan teknologi AI dan dapatkan solusi tepat",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: Trophy,
      title: "Gamifikasi",
      description: "Raih lencana dan track progress perawatan tanamanmu",
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      icon: Bell,
      title: "Notifikasi Pintar",
      description: "Pengingat otomatis untuk setiap aktivitas perawatan tanaman",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    }
  ];

  const benefits = [
    "Jadwal perawatan otomatis & akurat",
    "Diagnosa penyakit dengan AI",
    "Pantau progress tanaman real-time",
    "Database pengepul hasil panen",
    "Riwayat lengkap aktivitas bertani"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Bertani
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/login")}
                className="hidden sm:flex"
              >
                Login
              </Button>
              <Button 
                onClick={() => router.push("/signup")}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                Mulai Gratis
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
                <Zap className="w-3 h-3 mr-1" />
                Platform Bertani Digital #1 di Indonesia
              </Badge>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Kelola Tanaman
                  <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    Dengan Lebih Smart
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Jadwal otomatis, diagnosa AI, dan monitoring real-time untuk hasil panen maksimal. Semua dalam satu platform.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => router.push("/signup")}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-lg h-14"
                >
                  Mulai Sekarang Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="text-lg h-14 border-2"
                >
                  Login
                </Button>
              </div>

              {/* Benefits List */}
              <div className="space-y-3 pt-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Hero Image/Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl blur-3xl opacity-20"></div>
              <Card className="relative border-2 shadow-2xl overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-emerald-400 via-emerald-500 to-blue-500 p-8 flex items-center justify-center">
                  <img 
                    src="/login.jpg" 
                    alt="Farming Dashboard" 
                    className="w-full h-full object-cover rounded-2xl shadow-xl"
                  />
                </div>
                
                {/* Floating Stats Cards */}
                <div className="absolute top-6 right-6 bg-white rounded-xl shadow-lg p-4 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Produktivitas</p>
                      <p className="font-bold text-emerald-600">+85%</p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-lg p-4 animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Akurasi AI</p>
                      <p className="font-bold text-blue-600">98.9%</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
              <Sparkles className="w-3 h-3 mr-1" />
              Fitur Unggulan
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Semua yang Kamu Butuhkan
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                Dalam Satu Platform
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Teknologi terkini untuk membantu petani modern mengelola tanaman dengan lebih efisien
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 cursor-pointer"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-emerald-500 to-blue-500 border-0 shadow-2xl overflow-hidden">
            <CardContent className="p-12 text-center text-white space-y-6">
              <h2 className="text-4xl font-bold">
                Siap Bertani Lebih Smart?
              </h2>
              <p className="text-xl text-emerald-50 max-w-2xl mx-auto">
                Bergabung dengan ribuan petani yang sudah meningkatkan produktivitas mereka
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  onClick={() => router.push("/signup")}
                  className="bg-white text-emerald-600 hover:bg-gray-100 text-lg h-14"
                >
                  Daftar Sekarang - Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  
                  onClick={() => router.push("/login")}
                  className="bg-white text-emerald-600 hover:bg-gray-100 text-lg h-14"
                >
                  Sudah Punya Akun? Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Bertani</span>
          </div>
          <p className="text-sm">
            © 2025 Bertani. Platform Bertani Digital Indonesia.
          </p>
        </div>
      </footer>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}