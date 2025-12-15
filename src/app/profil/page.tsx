"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Trash2,
  Save,
  X,
  LogOut,
  Shield,
  Trophy,
  Sprout,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(200, "Bio maksimal 200 karakter").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

interface UserStats {
  totalPlants: number;
  totalTasks: number;
  completedTasks: number;
  badges: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalPlants: 0,
    totalTasks: 0,
    completedTasks: 0,
    badges: 0
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
      phone: "",
      location: "",
      bio: "",
    },
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        router.push("/login");
        return;
      }

      // Fetch profile from profiles table (jika ada)
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || "",
        full_name: profileData?.full_name || user.user_metadata?.full_name || "",
        username: profileData?.username || user.user_metadata?.username || "",
        phone: profileData?.phone || user.user_metadata?.phone || "",
        location: profileData?.location || "",
        bio: profileData?.bio || "",
        avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || "",
        created_at: user.created_at
      };

      setProfile(userProfile);
      
      // Set form values
      form.reset({
        full_name: userProfile.full_name,
        username: userProfile.username,
        email: userProfile.email,
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
      });

    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Count plants
      const { data: plants } = await supabase
        .from("tanaman_pengguna")
        .select("id")
        .eq("user_id", user.id);

      // Count tasks
      const { data: tasks } = await supabase
        .from("jadwal_menanam")
        .select("status")
        .eq("user_id", user.id);

      // Count badges
      const { data: badges } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", user.id);

      const completed = tasks?.filter(t => t.status).length || 0;

      setStats({
        totalPlants: plants?.length || 0,
        totalTasks: tasks?.length || 0,
        completedTasks: completed,
        badges: badges?.length || 0
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSaveProfile = async (values: ProfileFormValues) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update or insert profile
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: values.full_name,
          username: values.username,
          phone: values.phone,
          location: values.location,
          bio: values.bio,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("✅ Profil berhasil diperbarui!");
      setIsEditing(false);
      fetchProfile();

    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Gagal memperbarui profil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete user data (cascade will handle related tables if set up)
      const { error: deleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (deleteError) throw deleteError;

      // Sign out
      await supabase.auth.signOut();

      toast.success("Akun berhasil dihapus");
      router.push("/login");

    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Gagal menghapus akun");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil logout");
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Gagal logout");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex h-16 items-center border-b px-6">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-6 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          {/* Ganti User icon dengan NavUser */}
          <div>
            <h1 className="text-xl font-semibold ml-2">Profil Saya</h1>
            <p className="text-sm text-black-50 ml-2">Kelola informasi akun kamu</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-white hover:bg-white/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                      {profile?.full_name ? getInitials(profile.full_name) : "??"}
                    </AvatarFallback>
                  </Avatar>
                  {/* <Button variant="outline" size="sm" disabled>
                    <Edit className="w-4 h-4 mr-2" />
                    Ganti Foto
                  </Button> */}
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || "Belum diisi"}</h2>
                    <p className="text-gray-600">@{profile?.username || "username"}</p>
                  </div>

                  {profile?.bio && (
                    <p className="text-gray-700">{profile.bio}</p>
                  )}

                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{profile?.email}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Bergabung {format(new Date(profile?.created_at || ""), "MMM yyyy", { locale: id })}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                      <DialogTrigger asChild>
                        <Button className="bg-emerald-500 hover:bg-emerald-600">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profil
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Edit Profil</DialogTitle>
                          <DialogDescription>
                            Perbarui informasi profil kamu di sini
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Nama Lengkap *</Label>
                            <Input
                              id="full_name"
                              {...form.register("full_name")}
                              placeholder="Masukkan nama lengkap"
                            />
                            {form.formState.errors.full_name && (
                              <p className="text-sm text-red-500">{form.formState.errors.full_name.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="username">Username *</Label>
                            <Input
                              id="username"
                              {...form.register("username")}
                              placeholder="Masukkan username"
                            />
                            {form.formState.errors.username && (
                              <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              {...form.register("email")}
                              placeholder="email@example.com"
                              disabled
                            />
                            <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Nomor Telepon</Label>
                            <Input
                              id="phone"
                              {...form.register("phone")}
                              placeholder="+62 812-3456-7890"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location">Lokasi</Label>
                            <Input
                              id="location"
                              {...form.register("location")}
                              placeholder="Kota, Provinsi"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Input
                              id="bio"
                              {...form.register("bio")}
                              placeholder="Ceritakan tentang diri kamu..."
                            />
                            <p className="text-xs text-gray-500">Maksimal 200 karakter</p>
                          </div>

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditing(false);
                                form.reset();
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Batal
                            </Button>
                            <Button
                              type="submit"
                              disabled={isSaving}
                              className="bg-emerald-500 hover:bg-emerald-600"
                            >
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Menyimpan...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Simpan
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tanaman</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPlants}</p>
                  </div>
                  <Sprout className="w-10 h-10 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tugas</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                  </div>
                  <Shield className="w-10 h-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Selesai</p>
                    <p className="text-3xl font-bold text-emerald-600">{stats.completedTasks}</p>
                  </div>
                  <Shield className="w-10 h-10 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Lencana</p>
                    <p className="text-3xl font-bold text-amber-600">{stats.badges}</p>
                  </div>
                  <Trophy className="w-10 h-10 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Zona Berbahaya
              </CardTitle>
              <CardDescription>
                Tindakan permanen yang tidak dapat dibatalkan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Hapus Akun</h4>
                  <p className="text-sm text-gray-600">
                    Hapus akun dan semua data terkait secara permanen
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Akun
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah kamu yakin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun kamu secara permanen
                        dan menghapus semua data dari server kami, termasuk:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Semua data tanaman ({stats.totalPlants})</li>
                          <li>Semua jadwal perawatan ({stats.totalTasks})</li>
                          <li>Semua lencana yang sudah diraih ({stats.badges})</li>
                          <li>Riwayat aktivitas</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Ya, Hapus Akun Saya
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}