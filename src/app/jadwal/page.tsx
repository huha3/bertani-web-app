'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sprout, Calendar, CheckCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import dayjs from 'dayjs';

type ProjectTumbuhan = {
  id: number;
  nama_tanaman: string;
  varietas?: string;
  tanggal_tanam: string;
  total_tasks: number;
  completed_tasks: number;
  today_tasks: number;
};

export default function ListProjectClient() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectTumbuhan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.id) {
          toast.error("Silakan login terlebih dahulu");
          router.push('/login');
          return;
        }

        // Fetch projects dengan statistik jadwal
        const { data, error } = await supabase
          .from('menanam')
          .select(`
            id,
            nama_tanaman,
            varietas,
            tanggal_tanam,
            jadwal_menanam!inner (
              id,
              tanggal,
              status
            )
          `)
          .eq('user_id', session.user.id)
          .order('tanggal_tanam', { ascending: false });

        if (error) {
          console.error('Error fetching projects:', error);
          toast.error("Gagal memuat data project");
          return;
        }

        // Process data untuk hitung statistik
        const today = dayjs().format('YYYY-MM-DD');
        
        const processedProjects = data?.map(project => {
          const jadwalItems = project.jadwal_menanam || [];
          const totalTasks = jadwalItems.length;
          const completedTasks = jadwalItems.filter(j => j.status).length;
          const todayTasks = jadwalItems.filter(j => 
            dayjs(j.tanggal).format('YYYY-MM-DD') === today
          ).length;

          return {
            id: project.id,
            nama_tanaman: project.nama_tanaman,
            varietas: project.varietas,
            tanggal_tanam: project.tanggal_tanam,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            today_tasks: todayTasks
          };
        }) || [];

        setProjects(processedProjects);
      } catch (err) {
        console.error('Unexpected error:', err);
        toast.error("Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router]);

  const handleProjectClick = (projectId: number) => {
    router.push(`/kerjakan-jadwal/${projectId}`);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-6 text-center">
        <Sprout className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Belum Ada Project Tanaman
        </h3>
        <p className="text-gray-500 mb-4">
          Mulai dengan menambahkan tanaman baru untuk dijadwalkan
        </p>
        <Button onClick={() => router.push('/tambah-tanaman')}>
          Tambah Tanaman Baru
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Jadwal Tanamanmu</h1>
        </div>
      </header>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Project Tanaman Saya</h2>
        <Button onClick={() => router.push('/tambah-tanaman')}>
          <Sprout className="w-4 h-4 mr-2" />
          Tambah Project Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
            onClick={() => handleProjectClick(project.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">
                  {project.nama_tanaman}
                  {project.varietas && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({project.varietas})
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Tanggal Tanam */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Ditanam: {dayjs(project.tanggal_tanam).format('DD MMM YYYY')}</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.completed_tasks}/{project.total_tasks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: project.total_tasks > 0 
                        ? `${(project.completed_tasks / project.total_tasks) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
              </div>

              {/* Task Hari Ini */}
              {project.today_tasks > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      {project.today_tasks} task untuk hari ini
                    </span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-4" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectClick(project.id);
                }}
              >
                Lihat Jadwal
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div> 
  );
}