"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sprout,
  Droplets,
  Leaf,
  TrendingUp,
  Clock,
  Sparkles,
  Sun,
  Moon,
  CloudRain,
  ArrowRight,
  Trophy,
  Target,
  Activity
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, isToday, startOfDay, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  id_menanam: string;
  plant_name: string;
  tanggal: Date;
  jenis_kegiatan: string;
  status: boolean;
}

interface Plant {
  id: string;
  name: string;
  varietas: string;
  date: Date;
  estimated_harvest: Date;
  progress: number;
}

interface Notification {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface DashboardStats {
  todayTasks: number;
  completedToday: number;
  totalPlants: number;
  upcomingHarvest: number;
  weeklyCompletion: number;
  badges: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("Petani");
  const [greeting, setGreeting] = useState("");
  const [greetingIcon, setGreetingIcon] = useState<React.ReactNode>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayTasks: 0,
    completedToday: 0,
    totalPlants: 0,
    upcomingHarvest: 0,
    weeklyCompletion: 0,
    badges: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDynamicGreeting();
    fetchDashboardData();
  }, []);

  const setDynamicGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 10) {
      setGreeting("Selamat Pagi");
      setGreetingIcon(<Sun className="w-8 h-8 text-orange-500" />);
    } else if (hour >= 10 && hour < 15) {
      setGreeting("Selamat Siang");
      setGreetingIcon(<Sun className="w-8 h-8 text-yellow-500" />);
    } else if (hour >= 15 && hour < 18) {
      setGreeting("Selamat Sore");
      setGreetingIcon(<CloudRain className="w-8 h-8 text-orange-400" />);
    } else {
      setGreeting("Selamat Malam");
      setGreetingIcon(<Moon className="w-8 h-8 text-indigo-400" />);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        router.push("/login");
        return;
      }

      // Fetch user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      setUserName(profile?.username || "Petani");

      // Fetch today's tasks
      const today = startOfDay(new Date());
      const { data: tasksData } = await supabase
        .from("jadwal_menanam")
        .select(`
          *,
          tanaman_pengguna (name)
        `)
        .eq("user_id", user.id)
        .gte("tanggal", today.toISOString())
        .lt("tanggal", new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
        .order("tanggal", { ascending: true });

      const tasks: Task[] = (tasksData || []).map((t: any) => ({
        id: t.id,
        id_menanam: t.id_menanam,
        plant_name: t.tanaman_pengguna?.name || "Tanaman",
        tanggal: new Date(t.tanggal),
        jenis_kegiatan: t.jenis_kegiatan,
        status: t.status
      }));

      setTodayTasks(tasks);

      // Fetch plants
      const { data: plantsData } = await supabase
        .from("tanaman_pengguna")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      const plantsWithProgress: Plant[] = (plantsData || []).map((p: any) => {
        const startDate = new Date(p.date);
        const endDate = new Date(p.estimated_harvest);
        const today = new Date();
        
        const totalDays = differenceInDays(endDate, startDate);
        const daysElapsed = differenceInDays(today, startDate);
        const progress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100);

        return {
          id: p.id,
          name: p.name,
          varietas: p.varietas,
          date: new Date(p.date),
          estimated_harvest: new Date(p.estimated_harvest),
          progress: Math.round(progress)
        };
      });

      setPlants(plantsWithProgress);

      // Fetch badges count
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", user.id);

      // Fetch weekly completion
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const { data: weeklyTasks } = await supabase
        .from("jadwal_menanam")
        .select("status")
        .eq("user_id", user.id)
        .gte("tanggal", weekAgo.toISOString())
        .lt("tanggal", new Date().toISOString());

      const weeklyCompleted = weeklyTasks?.filter((t: any) => t.status).length || 0;
      const weeklyTotal = weeklyTasks?.length || 1;
      const weeklyRate = (weeklyCompleted / weeklyTotal) * 100;

      // Count upcoming harvests (within 2 weeks)
      const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      const upcomingHarvest = plantsWithProgress.filter(
        p => p.estimated_harvest >= today && p.estimated_harvest <= twoWeeksLater
      ).length;

      // Generate notifications
      const notifs: Notification[] = [];
      
      // Task reminder
      const incompleteTasks = tasks.filter(t => !t.status);
      if (incompleteTasks.length > 0) {
        notifs.push({
          id: "task-reminder",
          type: "warning",
          title: "Tugas Hari Ini",
          message: `Kamu punya ${incompleteTasks.length} tugas yang belum diselesaikan`,
          timestamp: new Date(),
          isRead: false
        });
      }

      // Harvest reminder
      if (upcomingHarvest > 0) {
        notifs.push({
          id: "harvest-reminder",
          type: "info",
          title: "Segera Panen",
          message: `${upcomingHarvest} tanaman siap dipanen dalam 2 minggu`,
          timestamp: new Date(),
          isRead: false
        });
      }

      // Good performance
      if (weeklyRate >= 90) {
        notifs.push({
          id: "good-job",
          type: "success",
          title: "Kerja Bagus! 🎉",
          message: `Tingkat penyelesaian minggu ini: ${Math.round(weeklyRate)}%`,
          timestamp: new Date(),
          isRead: false
        });
      }

      setNotifications(notifs);

      setStats({
        todayTasks: tasks.length,
        completedToday: tasks.filter(t => t.status).length,
        totalPlants: plantsData?.length || 0,
        upcomingHarvest,
        weeklyCompletion: Math.round(weeklyRate),
        badges: badgesData?.length || 0
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("jadwal_menanam")
        .update({ status: true })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("✅ Tugas selesai!");
      fetchDashboardData();
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Gagal menyelesaikan tugas");
    }
  };

  const getTaskIcon = (activity: string) => {
    const lower = activity.toLowerCase();
    if (lower.includes("siram") || lower.includes("air")) {
      return <Droplets className="w-4 h-4 text-blue-600" />;
    }
    if (lower.includes("pupuk")) {
      return <Leaf className="w-4 h-4 text-emerald-600" />;
    }
    return <Sprout className="w-4 h-4 text-green-600" />;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex h-16 items-center border-b px-6">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center border-b px-6 bg-white">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-xl font-semibold ml-4">Dashboard</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Greeting Card */}
          <Card className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {greetingIcon}
                  <div>
                    <h2 className="text-3xl font-bold mb-1">{greeting}, {userName}! 👋</h2>
                    <p className="text-emerald-50">
                      {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => router.push("/diagnosa")}
                  className="bg-white text-emerald-600 hover:bg-emerald-50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Diagnosa Tanaman
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/jadwal")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge variant="outline">{stats.completedToday}/{stats.todayTasks}</Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.todayTasks}</h3>
                <p className="text-sm text-gray-600">Tugas Hari Ini</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/tanaman")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Sprout className="w-6 h-6 text-emerald-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalPlants}</h3>
                <p className="text-sm text-gray-600">Total Tanaman</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-amber-600" />
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">{stats.weeklyCompletion}%</Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.weeklyCompletion}%</h3>
                <p className="text-sm text-gray-600">Performa Minggu Ini</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/lencana")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.badges}</h3>
                <p className="text-sm text-gray-600">Lencana Diraih</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Today's Tasks */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Tugas Hari Ini
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {stats.completedToday} dari {stats.todayTasks} tugas selesai
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push("/jadwal")}
                >
                  Lihat Semua
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {todayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Tidak ada tugas hari ini! 🎉
                    </h3>
                    <p className="text-gray-500">Santai dulu atau tambah tanaman baru</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.slice(0, 5).map(task => (
                      <div 
                        key={task.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          task.status 
                            ? "bg-emerald-50 border-emerald-200" 
                            : "bg-white border-gray-200 hover:border-emerald-300"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          task.status ? "bg-emerald-100" : "bg-blue-50"
                        )}>
                          {getTaskIcon(task.jenis_kegiatan)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium text-sm",
                            task.status ? "text-emerald-900 line-through" : "text-gray-900"
                          )}>
                            {task.jenis_kegiatan}
                          </p>
                          <p className="text-xs text-gray-500">{task.plant_name}</p>
                        </div>

                        {task.status ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            Selesai
                          </Button>
                        )}
                      </div>
                    ))}

                    {todayTasks.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => router.push("/jadwal")}
                      >
                        Lihat {todayTasks.length - 5} tugas lainnya
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  Notifikasi
                </CardTitle>
                <CardDescription>
                  {notifications.filter(n => !n.isRead).length} notifikasi baru
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id}
                        className={cn(
                          "p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                          notif.type === "warning" && "bg-amber-50 border-amber-200",
                          notif.type === "success" && "bg-emerald-50 border-emerald-200",
                          notif.type === "info" && "bg-blue-50 border-blue-200"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900 mb-1">
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-600">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Plants Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-500" />
                  Progress Tanaman
                </CardTitle>
                <CardDescription className="mt-1">
                  Pantau perkembangan tanaman menuju panen
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/tanaman")}
              >
                Lihat Semua
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {plants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sprout className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Belum ada tanaman
                  </h3>
                  <p className="text-gray-500 mb-4">Mulai menanam sekarang!</p>
                  <Button onClick={() => router.push("/tambah-tanaman")}>
                    <Sprout className="w-4 h-4 mr-2" />
                    Tambah Tanaman
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {plants.map(plant => (
                    <div key={plant.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{plant.name}</h4>
                          <p className="text-sm text-gray-600">{plant.varietas}</p>
                        </div>
                        <Badge variant="outline">
                          {plant.progress}%
                        </Badge>
                      </div>
                      <Progress value={plant.progress} className="h-2 mb-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Ditanam: {format(plant.date, "dd MMM", { locale: id })}</span>
                        <span>Panen: {format(plant.estimated_harvest, "dd MMM", { locale: id })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}