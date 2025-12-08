'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Sprout, 
  Calendar, 
  CheckCircle, 
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import dayjs from 'dayjs';
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  varietas: string;
  date: Date;
  estimated_harvest: Date;
  plant_type: string;
  total_tasks: number;
  completed_tasks: number;
  today_tasks: number;
  progress: number;
  daysToHarvest: number;
}

export default function JadwalPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlants: 0,
    activeTasks: 0,
    completedToday: 0,
    upcomingHarvest: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        toast.error("Silakan login terlebih dahulu");
        router.push('/login');
        return;
      }

      // Fetch plants
      const { data: plantsData, error: plantsError } = await supabase
        .from("tanaman_pengguna")
        .select("*")
        .eq("user_id", session.user.id)
        .order("date", { ascending: false });

      if (plantsError) throw plantsError;

      if (!plantsData || plantsData.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Fetch tasks for each plant
      const projectsWithStats = await Promise.all(
        plantsData.map(async (plant) => {
          const { data: tasksData } = await supabase
            .from("jadwal_menanam")
            .select("*")
            .eq("id_menanam", plant.id);

          const today = dayjs().startOf('day');
          const totalTasks = tasksData?.length || 0;
          const completedTasks = tasksData?.filter(t => t.status).length || 0;
          const todayTasks = tasksData?.filter(t => 
            dayjs(t.tanggal).isSame(today, 'day') && !t.status
          ).length || 0;

          // Calculate progress
          const startDate = dayjs(plant.date);
          const endDate = dayjs(plant.estimated_harvest);
          const todayDate = dayjs();
          const totalDays = endDate.diff(startDate, 'day');
          const elapsedDays = todayDate.diff(startDate, 'day');
          const progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

          const daysToHarvest = endDate.diff(todayDate, 'day');

          return {
            id: plant.id,
            name: plant.name,
            varietas: plant.varietas,
            date: new Date(plant.date),
            estimated_harvest: new Date(plant.estimated_harvest),
            plant_type: plant.plant_type,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            today_tasks: todayTasks,
            progress: Math.round(progress),
            daysToHarvest
          };
        })
      );

      setProjects(projectsWithStats);

      // Calculate overall stats
      const totalActiveTasks = projectsWithStats.reduce((sum, p) => sum + p.today_tasks, 0);
      const totalCompletedToday = projectsWithStats.reduce((sum, p) => sum + p.completed_tasks, 0);
      const upcomingHarvest = projectsWithStats.filter(p => p.daysToHarvest <= 14 && p.daysToHarvest > 0).length;

      setStats({
        totalPlants: projectsWithStats.length,
        activeTasks: totalActiveTasks,
        completedToday: totalCompletedToday,
        upcomingHarvest
      });

    } catch (err) {
      console.error("Error:", err);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/jadwal/${projectId}`);
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
          <Calendar className="w-8 h-8 ml-2" />
          <div>
            <h1 className="text-xl font-semibold ml-2">Jadwal Tanamanmu</h1>
            <p className="text-sm text-black-50 ml-2">Kelola jadwal perawatan semua tanaman</p>
          </div>
        </div>
        <Button 
          onClick={() => router.push('/menanam')}
          className="bg-white text-emerald-600 hover:bg-emerald-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Project Baru
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-96 text-center">
                <Sprout className="w-24 h-24 text-gray-400 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Belum Ada Project Tanaman
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Mulai perjalanan bertani kamu dengan menambahkan tanaman pertama dan buat jadwal perawatan otomatis
                </p>
                <Button 
                  onClick={() => router.push('/menanam')}
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Tanaman Baru
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Project</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalPlants}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Sprout className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tugas Hari Ini</p>
                        <p className="text-3xl font-bold text-blue-600">{stats.activeTasks}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Selesai</p>
                        <p className="text-3xl font-bold text-emerald-600">{stats.completedToday}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Segera Panen</p>
                        <p className="text-3xl font-bold text-amber-600">{stats.upcomingHarvest}</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Projects Grid */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Semua Project Tanaman</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <Card 
                      key={project.id} 
                      className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-emerald-500 group"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Sprout className="w-5 h-5 text-emerald-600" />
                              <CardTitle className="text-lg">
                                {project.name}
                              </CardTitle>
                            </div>
                            {project.varietas && (
                              <p className="text-sm text-gray-500">
                                Varietas: {project.varietas}
                              </p>
                            )}
                            <Badge variant="outline" className="mt-2">
                              {project.plant_type}
                            </Badge>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Tanggal Tanam */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Ditanam: {dayjs(project.date).format('DD MMM YYYY')}</span>
                        </div>

                        {/* Progress to Harvest */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress Tanam</span>
                            <span className="font-semibold text-gray-900">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                          <p className="text-xs text-gray-500">
                            {project.daysToHarvest > 0 
                              ? `${project.daysToHarvest} hari lagi menuju panen`
                              : project.daysToHarvest === 0
                              ? "Siap panen hari ini!"
                              : "Sudah melewati estimasi panen"
                            }
                          </p>
                        </div>

                        {/* Task Stats */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-gray-600">Progress Tugas</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {project.completed_tasks}/{project.total_tasks}
                          </span>
                        </div>

                        {/* Today's Tasks Alert */}
                        {project.today_tasks > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-800">
                                {project.today_tasks} tugas untuk hari ini
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button 
                          className="w-full bg-emerald-500 hover:bg-emerald-600" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectClick(project.id);
                          }}
                        >
                          Lihat Jadwal Lengkap
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
