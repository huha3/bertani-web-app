"use client";

import { useEffect, useState, useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  Timer, 
  Flame, 
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Lock,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, startOfDay, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  tanggal: Date;
  status: boolean;
  jenis_kegiatan: string;
  isMissed: boolean;
}

interface BadgeData {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  isEarned: boolean;
  progress: number;
  maxProgress: number;
  progressText: string;
  color: string;
  earnedDate?: Date;
}

interface Stats {
  totalCompleted: number;
  totalMissed: number;
  totalTasks: number;
  completionRate: number;
  currentStreak: number;
  maxStreak: number;
}

export default function LencanaKeaktifanPage() {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCompleted: 0,
    totalMissed: 0,
    totalTasks: 0,
    completionRate: 0,
    currentStreak: 0,
    maxStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchBadgeData();
  }, []);

  const fetchBadgeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        return;
      }

      // Fetch all tasks
      const { data: jadwalData, error } = await supabase
        .from("jadwal_menanam")
        .select("*")
        .eq("user_id", user.id)
        .order("tanggal", { ascending: true });

      if (error) throw error;

      const today = startOfDay(new Date());
      const tasks: Task[] = (jadwalData || []).map(item => {
        const taskDate = startOfDay(new Date(item.tanggal));
        const isPast = taskDate < today;
        
        return {
          id: item.id,
          tanggal: new Date(item.tanggal),
          status: item.status,
          jenis_kegiatan: item.jenis_kegiatan,
          isMissed: isPast && !item.status
        };
      });

      setAllTasks(tasks);

      // Calculate stats
      const completed = tasks.filter(t => t.status).length;
      const missed = tasks.filter(t => t.isMissed).length;
      const total = completed + missed;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      // Calculate streak
      const { currentStreak, maxStreak } = calculateStreak(tasks);

      const calculatedStats = {
        totalCompleted: completed,
        totalMissed: missed,
        totalTasks: total,
        completionRate: rate,
        currentStreak,
        maxStreak
      };

      setStats(calculatedStats);

      // Fetch or calculate badges
      await fetchOrCreateBadges(user.id, tasks, calculatedStats);

    } catch (error) {
      console.error("Error fetching badge data:", error);
      toast.error("Gagal memuat data lencana");
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (tasks: Task[]) => {
    const completedDates = tasks
      .filter(t => t.status)
      .map(t => startOfDay(t.tanggal).toISOString())
      .sort();

    const uniqueDates = Array.from(new Set(completedDates)).map(d => new Date(d));

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    if (uniqueDates.length > 0) {
      tempStreak = 1;
      maxStreak = 1;

      for (let i = 1; i < uniqueDates.length; i++) {
        const diff = differenceInDays(uniqueDates[i], uniqueDates[i - 1]);
        
        if (diff === 1) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else if (diff > 1) {
          tempStreak = 1;
        }
      }

      // Check if current streak is still active (last completed task is yesterday or today)
      const lastCompletedDate = uniqueDates[uniqueDates.length - 1];
      const daysSinceLastTask = differenceInDays(new Date(), lastCompletedDate);
      
      if (daysSinceLastTask <= 1) {
        currentStreak = tempStreak;
      }
    }

    return { currentStreak, maxStreak };
  };

  const fetchOrCreateBadges = async (userId: string, tasks: Task[], stats: Stats) => {
    try {
      // Fetch existing badges
      const { data: badgeData, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", userId);

      if (error && error.code !== 'PGRST116') throw error;

      // Define all badges
      const allBadges: BadgeData[] = [
        {
          id: "pemula-rajin",
          name: "Pemula Rajin",
          icon: Award,
          description: "Selesaikan 10 tugas perawatan pertama",
          isEarned: stats.totalCompleted >= 10,
          progress: stats.totalCompleted,
          maxProgress: 10,
          progressText: `${stats.totalCompleted}/10 tugas`,
          color: "from-yellow-500 to-orange-500",
          earnedDate: badgeData?.find(b => b.badge_id === "pemula-rajin")?.earned_date
        },
        {
          id: "tepat-waktu",
          name: "Petani Tepat Waktu",
          icon: Timer,
          description: "Capai tingkat penyelesaian 85% atau lebih",
          isEarned: stats.completionRate >= 85 && stats.totalTasks >= 10,
          progress: Math.round(stats.completionRate),
          maxProgress: 85,
          progressText: `${Math.round(stats.completionRate)}%`,
          color: "from-blue-500 to-indigo-500",
          earnedDate: badgeData?.find(b => b.badge_id === "tepat-waktu")?.earned_date
        },
        {
          id: "streak-petani",
          name: "Streak Petani",
          icon: Flame,
          description: "Selesaikan tugas setiap hari selama 7 hari berturut-turut",
          isEarned: stats.maxStreak >= 7,
          progress: stats.maxStreak,
          maxProgress: 7,
          progressText: `${stats.maxStreak}/7 hari`,
          color: "from-red-500 to-pink-500",
          earnedDate: badgeData?.find(b => b.badge_id === "streak-petani")?.earned_date
        },
        {
          id: "dedikasi-tinggi",
          name: "Dedikasi Tinggi",
          icon: Trophy,
          description: "Selesaikan 50 tugas perawatan",
          isEarned: stats.totalCompleted >= 50,
          progress: stats.totalCompleted,
          maxProgress: 50,
          progressText: `${stats.totalCompleted}/50 tugas`,
          color: "from-purple-500 to-violet-500",
          earnedDate: badgeData?.find(b => b.badge_id === "dedikasi-tinggi")?.earned_date
        }
      ];

      // Save newly earned badges to database
      for (const badge of allBadges) {
        const existingBadge = badgeData?.find(b => b.badge_id === badge.id);
        
        if (badge.isEarned && !existingBadge) {
          await supabase.from("user_badges").insert({
            user_id: userId,
            badge_id: badge.id,
            badge_name: badge.name,
            earned_date: new Date().toISOString()
          });
        }
      }

      setBadges(allBadges);

    } catch (error) {
      console.error("Error with badges:", error);
    }
  };

  const BadgeCard = ({ badge }: { badge: BadgeData }) => {
    const Icon = badge.icon;
    const progressPercentage = (badge.progress / badge.maxProgress) * 100;

    return (
      <Card className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg",
        badge.isEarned ? "border-2" : "border opacity-75"
      )}>
        {/* Background gradient for earned badges */}
        {badge.isEarned && (
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", badge.color)} />
        )}

        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0",
              badge.isEarned 
                ? `bg-gradient-to-br ${badge.color}` 
                : "bg-gray-200"
            )}>
              {badge.isEarned ? (
                <Icon className="w-8 h-8 text-white" />
              ) : (
                <Lock className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{badge.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                </div>
                {badge.isEarned && (
                  <Badge className="bg-emerald-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Diraih
                  </Badge>
                )}
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-gray-900">{badge.progressText}</span>
                </div>
                <Progress 
                  value={badge.isEarned ? 100 : progressPercentage} 
                  className="h-2"
                />
              </div>

              {badge.isEarned && badge.earnedDate && (
                <p className="text-xs text-gray-500 mt-2">
                  Diraih pada {format(new Date(badge.earnedDate), "dd MMM yyyy", { locale: id })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const earnedBadges = badges.filter(b => b.isEarned);
  const lockedBadges = badges.filter(b => !b.isEarned);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-6 bg-white">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Trophy className="w-6 h-6 ml-2" />
          <div>
            <h1 className="text-xl font-semibold ml-2">Lencana Keaktifan</h1>
            <p className="text-sm text-black-50 ml-2">Pantau pencapaian dan progres perawatan tanaman</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-emerald-100 mb-1">Total Selesai</p>
                        <p className="text-3xl font-bold">{stats.totalCompleted}</p>
                      </div>
                      <CheckCircle2 className="w-12 h-12 opacity-80" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-100 mb-1">Completion Rate</p>
                        <p className="text-3xl font-bold">{Math.round(stats.completionRate)}%</p>
                      </div>
                      <Target className="w-12 h-12 opacity-80" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-100 mb-1">Streak Saat Ini</p>
                        <p className="text-3xl font-bold">{stats.currentStreak}</p>
                      </div>
                      <Flame className="w-12 h-12 opacity-80" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-100 mb-1">Lencana Diraih</p>
                        <p className="text-3xl font-bold">{earnedBadges.length}/{badges.length}</p>
                      </div>
                      <Trophy className="w-12 h-12 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Earned Badges Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    Lencana yang Sudah Diraih
                  </h2>
                  <Badge className="bg-amber-100 text-amber-800 text-sm px-3 py-1">
                    {earnedBadges.length} Lencana
                  </Badge>
                </div>

                {earnedBadges.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                      <Lock className="w-16 h-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Belum ada lencana
                      </h3>
                      <p className="text-gray-500">Selesaikan tugas untuk mendapatkan lencana pertamamu!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {earnedBadges.map(badge => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                )}
              </div>

              {/* Locked Badges Section */}
              {lockedBadges.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Target className="w-6 h-6 text-gray-500" />
                      Lencana yang Belum Diraih
                    </h2>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {lockedBadges.length} Tersisa
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {lockedBadges.map(badge => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}