"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Droplets, 
  Leaf, 
  Scissors, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Lock,
  XCircle,
  History,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, isToday, isFuture, isPast, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  id_menanam: string;
  name: string;
  varietas: string;
  jenis_kegiatan: string;
  tanggal: Date;
  status: boolean;
  type: "watering" | "fertilizing";
  canComplete: boolean;
  isMissed: boolean;
  isLocked: boolean;
}

export default function JadwalPerawatan() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [missedTasks, setMissedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalToday: 0,
    completed: 0,
    missed: 0,
    completionRate: 0
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        return;
      }

      // Fetch semua jadwal
      const { data: jadwalData, error } = await supabase
        .from("jadwal_menanam")
        .select(`
          *,
          tanaman_pengguna (
            name,
            varietas
          )
        `)
        .eq("user_id", user.id)
        .order("tanggal", { ascending: true });

      if (error) throw error;

      const todayDate = startOfDay(new Date());
      const allTasks: Task[] = (jadwalData || []).map(item => {
        const taskDate = startOfDay(new Date(item.tanggal));
        const isTaskToday = isToday(taskDate);
        const isTaskFuture = isFuture(taskDate);
        const isTaskPast = isPast(taskDate) && !isToday(taskDate);

        return {
          id: item.id,
          id_menanam: item.id_menanam,
          name: item.tanaman_pengguna?.name,        
          varietas: item.tanaman_pengguna?.varietas,
          jenis_kegiatan: item.jenis_kegiatan,
          tanggal: new Date(item.tanggal),
          status: item.status,
          type: getTaskType(item.jenis_kegiatan),
          canComplete: isTaskToday && !item.status, // Hanya bisa diselesaikan hari ini
          isMissed: isTaskPast && !item.status, // Lewat deadline & belum dikerjakan
          isLocked: isTaskFuture // Tugas masa depan terkunci
        };
      });

      // Kategorikan tasks
      const today = allTasks.filter(task => isToday(task.tanggal) && !task.status);
      const tasksUpcoming  = allTasks.filter(task => task.isLocked);
      const tasksCompleted  = allTasks.filter(task => task.status);
      const missed = allTasks.filter(task => task.isMissed);

      setTodayTasks(today);
      setUpcomingTasks(tasksUpcoming);
      setCompletedTasks(tasksCompleted);
      setMissedTasks(missed);

      // Calculate stats
      const totalCompleted = tasksCompleted.length;
      const totalMissed = missed.length;
      const totalTasks = allTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

      setStats({
        totalToday: today.length,
        completed: totalCompleted,
        missed: totalMissed,
        completionRate
      });

    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Gagal memuat jadwal");
    } finally {
      setLoading(false);
    }
  };

  const getTaskType = (activity: string): "watering" | "fertilizing" => {
    const lower = activity.toLowerCase();
    if (lower.includes("siram") || lower.includes("air")) return "watering";
    return "fertilizing";
  };

  const handleCompleteTask = async (taskId: string) => {
    try {

      const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Kamu belum login!");
          return;
        }

      const { error } = await supabase
        .from("jadwal_menanam")
        .update({ status: true })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("✅ Tugas berhasil diselesaikan!");
      fetchTasks(); // Refresh data
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Gagal menyelesaikan tugas");
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "watering":
        return <Droplets className="w-5 h-5 text-blue-600" />;
      case "fertilizing":
        return <Leaf className="w-5 h-5 text-amber-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTaskBgColor = (type: string) => {
    switch (type) {
      case "watering":
        return "bg-blue-50 border-blue-200";
      case "fertilizing":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const TaskCard = ({ task, showPlantName = true }: { task: Task; showPlantName?: boolean }) => (
    <Card className={cn(
      "transition-all hover:shadow-md border-l-4",
      task.isMissed && "border-l-red-500 bg-red-50/30",
      task.isLocked && "border-l-gray-300 bg-gray-50/50",
      task.status && "border-l-emerald-500 bg-emerald-50/30",
      !task.isMissed && !task.isLocked && !task.status && "border-l-blue-500"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border",
            getTaskBgColor(task.type),
            task.isLocked && "opacity-50",
            task.isMissed && "bg-red-50 border-red-200"
          )}>
            {task.isLocked ? (
              <Lock className="w-5 h-5 text-gray-400" />
            ) : task.isMissed ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              getTaskIcon(task.type)
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {showPlantName && (
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {task.name}
                </Badge>
                <span className="text-xs text-gray-500">{task.varietas}</span>
              </div>
            )}
            <p className="font-medium text-gray-900">{task.jenis_kegiatan}</p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-600">
                {format(task.tanggal, "dd MMMM yyyy", { locale: id })}
              </span>
              {task.isMissed && (
                <Badge variant="destructive" className="text-xs">Terlewat</Badge>
              )}
              {task.isLocked && (
                <Badge variant="secondary" className="text-xs">Terkunci</Badge>
              )}
              {task.status && (
                <Badge className="bg-emerald-500 text-xs">Selesai</Badge>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div>
            {task.canComplete ? (
              <Button
                size="sm"
                onClick={() => handleCompleteTask(task.id)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Selesai
              </Button>
            ) : task.isLocked ? (
              <Button size="sm" disabled variant="ghost">
                <Lock className="w-4 h-4" />
              </Button>
            ) : task.status ? (
              <div className="text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : task.isMissed ? (
              <div className="text-red-500">
                <XCircle className="w-6 h-6" />
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-6 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Calendar className="w-6 h-6 ml-2" />
          <div>
            <h1 className="text-xl font-semibold ml-2">Jadwal Perawatan</h1>
            <p className="text-sm text-black-50 ml-2">Kelola tugas harian tanaman kamu</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tugas Hari Ini</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalToday}</p>
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
                    <p className="text-sm text-gray-600">Selesai</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
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
                    <p className="text-sm text-gray-600">Terlewat</p>
                    <p className="text-2xl font-bold text-red-600">{stats.missed}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="today" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Hari Ini ({todayTasks.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mendatang ({upcomingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Riwayat ({completedTasks.length})
              </TabsTrigger>
              <TabsTrigger value="missed" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Terlewat ({missedTasks.length})
              </TabsTrigger>
            </TabsList>

            {/* Today Tasks */}
            <TabsContent value="today" className="space-y-4 mt-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
              ) : todayTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Semua tugas hari ini sudah selesai! 🎉
                    </h3>
                    <p className="text-gray-500">Kerja bagus! Tanaman kamu pasti senang.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Upcoming Tasks */}
            <TabsContent value="upcoming" className="space-y-4 mt-6">
              {upcomingTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Clock className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Tidak ada tugas mendatang
                    </h3>
                    <p className="text-gray-500">Jadwal masih kosong untuk hari-hari ke depan.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* History */}
            <TabsContent value="history" className="space-y-4 mt-6">
              {completedTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <History className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Belum ada riwayat
                    </h3>
                    <p className="text-gray-500">Tugas yang sudah diselesaikan akan muncul di sini.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Missed Tasks */}
            <TabsContent value="missed" className="space-y-4 mt-6">
              {missedTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Tidak ada tugas terlewat! 👍
                    </h3>
                    <p className="text-gray-500">Kamu sangat disiplin merawat tanaman.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">Perhatian!</p>
                        <p className="text-sm text-red-700 mt-1">
                          Ada {missedTasks.length} tugas yang terlewat. Segera lakukan perawatan ekstra untuk tanaman kamu.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {missedTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}