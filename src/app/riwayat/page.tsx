"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History,
  CheckCircle2,
  Droplets,
  Leaf,
  Calendar,
  Trophy,
  Award,
  Timer,
  Flame,
  Target,
  TrendingUp,
  Filter,
  Download,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CompletedTask {
  id: string;
  id_menanam: string;
  plant_name: string;
  plant_type: string;
  jenis_kegiatan: string;
  tanggal: Date;
  completed_at: Date;
  type: "watering" | "fertilizing";
}

interface EarnedBadge {
  id: string;
  badge_id: string;
  badge_name: string;
  earned_date: Date;
  icon: React.ElementType;
  color: string;
}

interface Stats {
  totalCompleted: number;
  thisMonth: number;
  thisYear: number;
  totalBadges: number;
  mostFrequentTask: string;
}

type FilterPeriod = "all" | "month" | "year";

export default function RiwayatPage() {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<CompletedTask[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCompleted: 0,
    thisMonth: 0,
    thisYear: 0,
    totalBadges: 0,
    mostFrequentTask: "-"
  });
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");

  useEffect(() => {
    fetchHistoryData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterPeriod, completedTasks]);

  const fetchHistoryData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        return;
      }

      // Fetch completed tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("jadwal_menanam")
        .select(`
          *,
          tanaman_pengguna (
            name,
            varietas
          )
        `)
        .eq("user_id", user.id)
        .eq("status", true)
        .order("tanggal", { ascending: false });

      if (tasksError) throw tasksError;

      const tasks: CompletedTask[] = (tasksData || []).map(t => ({
        id: t.id,
        id_menanam: t.id_menanam,
        plant_name: t.tanaman_pengguna?.name || "Tanaman",
        plant_type: t.tanaman_pengguna?.plant_type || "Indoor",
        jenis_kegiatan: t.jenis_kegiatan,
        tanggal: new Date(t.tanggal),
        completed_at: new Date(t.updated_at || t.tanggal),
        type: getTaskType(t.jenis_kegiatan)
      }));

      setCompletedTasks(tasks);

      // Fetch earned badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", user.id)
        .order("earned_date", { ascending: false });

      if (badgesError) throw badgesError;

      const badges: EarnedBadge[] = (badgesData || []).map(b => ({
        id: b.id,
        badge_id: b.badge_id,
        badge_name: b.badge_name,
        earned_date: new Date(b.earned_date),
        icon: getBadgeIcon(b.badge_id),
        color: getBadgeColor(b.badge_id)
      }));

      setEarnedBadges(badges);

      // Calculate stats
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);

      const thisMonthTasks = tasks.filter(t => 
        t.completed_at >= monthStart && t.completed_at <= monthEnd
      ).length;

      const thisYearTasks = tasks.filter(t => 
        t.completed_at >= yearStart && t.completed_at <= yearEnd
      ).length;

      // Find most frequent task
      const taskCounts: Record<string, number> = {};
      tasks.forEach(t => {
        const activity = t.jenis_kegiatan;
        taskCounts[activity] = (taskCounts[activity] || 0) + 1;
      });

      const mostFrequent = Object.entries(taskCounts).sort((a, b) => b[1] - a[1])[0];

      setStats({
        totalCompleted: tasks.length,
        thisMonth: thisMonthTasks,
        thisYear: thisYearTasks,
        totalBadges: badges.length,
        mostFrequentTask: mostFrequent ? mostFrequent[0] : "-"
      });

    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const now = new Date();
    let filtered = [...completedTasks];

    if (filterPeriod === "month") {
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      filtered = completedTasks.filter(t => 
        t.completed_at >= monthStart && t.completed_at <= monthEnd
      );
    } else if (filterPeriod === "year") {
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      filtered = completedTasks.filter(t => 
        t.completed_at >= yearStart && t.completed_at <= yearEnd
      );
    }

    setFilteredTasks(filtered);
  };

  const getTaskType = (activity: string): "watering" | "fertilizing" => {
    const lower = activity.toLowerCase();
    if (lower.includes("pupuk") || lower.includes("fertiliz")) {
      return "fertilizing";
    }
    return "watering";
  };

  const getTaskIcon = (type: string) => {
    return type === "watering" 
      ? <Droplets className="w-5 h-5 text-blue-600" />
      : <Leaf className="w-5 h-5 text-emerald-600" />;
  };

  const getTaskBgColor = (type: string) => {
    return type === "watering"
      ? "bg-blue-50 border-blue-200"
      : "bg-emerald-50 border-emerald-200";
  };

  const getBadgeIcon = (badgeId: string): React.ElementType => {
    switch (badgeId) {
      case "pemula-rajin":
        return Award;
      case "tepat-waktu":
        return Timer;
      case "streak-petani":
        return Flame;
      case "dedikasi-tinggi":
        return Trophy;
      default:
        return Trophy;
    }
  };

  const getBadgeColor = (badgeId: string): string => {
    switch (badgeId) {
      case "pemula-rajin":
        return "from-yellow-500 to-orange-500";
      case "tepat-waktu":
        return "from-blue-500 to-indigo-500";
      case "streak-petani":
        return "from-red-500 to-pink-500";
      case "dedikasi-tinggi":
        return "from-purple-500 to-violet-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const TaskCard = ({ task }: { task: CompletedTask }) => (
    <Card className={cn(
      "transition-all hover:shadow-md border-l-4 border-l-emerald-500 bg-emerald-50/30"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border",
            getTaskBgColor(task.type)
          )}>
            {getTaskIcon(task.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {task.plant_name}
              </Badge>
              <span className="text-xs text-gray-500">{task.plant_type}</span>
            </div>
            <p className="font-medium text-gray-900">{task.jenis_kegiatan}</p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-600">
                {format(task.tanggal, "dd MMMM yyyy, HH:mm", { locale: id })}
              </span>
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              ✓ Selesai {format(task.completed_at, "dd MMM yyyy", { locale: id })}
            </p>
          </div>

          <div className="text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const BadgeCard = ({ badge }: { badge: EarnedBadge }) => {
    const Icon = badge.icon;
    
    return (
      <Card className="relative overflow-hidden border-2">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", badge.color)} />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
              badge.color
            )}>
              <Icon className="w-8 h-8 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-gray-900">{badge.badge_name}</h3>
                <Badge className="bg-emerald-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Diraih
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Diraih pada {format(badge.earned_date, "dd MMMM yyyy", { locale: id })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-6 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <History className="w-8 h-8 ml-2" />
          <div>
            <h1 className="text-xl font-semibold ml-2">Riwayat</h1>
            <p className="text-sm text-black-50 ml-2">Lihat semua aktivitas yang sudah kamu lakukan</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Selesai</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalCompleted}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Bulan Ini</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tahun Ini</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.thisYear}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Lencana</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.totalBadges}</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Most Frequent Task */}
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Aktivitas Paling Sering</p>
                      <p className="text-lg font-bold text-gray-900">{stats.mostFrequentTask}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tasks" className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Tugas Selesai ({completedTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="badges" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Lencana Diraih ({earnedBadges.length})
                  </TabsTrigger>
                </TabsList>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="space-y-4 mt-6">
                  {/* Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Filter:</span>
                    <Button
                      variant={filterPeriod === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterPeriod("all")}
                    >
                      Semua
                    </Button>
                    <Button
                      variant={filterPeriod === "month" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterPeriod("month")}
                    >
                      Bulan Ini
                    </Button>
                    <Button
                      variant={filterPeriod === "year" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterPeriod("year")}
                    >
                      Tahun Ini
                    </Button>
                  </div>

                  {filteredTasks.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                        <History className="w-16 h-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Belum ada riwayat
                        </h3>
                        <p className="text-gray-500">Tugas yang sudah diselesaikan akan muncul di sini</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Badges Tab */}
                <TabsContent value="badges" className="space-y-4 mt-6">
                  {earnedBadges.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                        <Trophy className="w-16 h-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Belum ada lencana
                        </h3>
                        <p className="text-gray-500">Selesaikan tugas untuk mendapatkan lencana</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {earnedBadges.map(badge => (
                        <BadgeCard key={badge.id} badge={badge} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
}