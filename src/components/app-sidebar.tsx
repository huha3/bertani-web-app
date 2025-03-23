"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  AudioWaveform,
  BarChart3,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Home,
  Map,
  PieChart,
  Settings2,
  Sprout,
  ClipboardList,
  SquareTerminal,
  Users,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Inisialisasi Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);
  const [badge, setBadge] = React.useState<string>("Pemula"); // Default lencana

  // Ambil informasi user setelah login
  React.useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Gagal mendapatkan user:", error.message);
      } else {
        setUser(data?.user?.user_metadata); // Ambil dari user_metadata
      }
    };
  
    fetchUser();
  }, []);  

  // Definisi navigasi sidebar
  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Tumbuhan Kamu",
      url: "/tumbuhan",
      icon: Sprout,
      items: [
        { title: "Lagi Menanam Apa?", url: "/tumbuhan/menanam" },
        { title: "Tanamanmu Sakit Apa?", url: "/tumbuhan/diagnosis" },
      ],
    },
    {
      title: "Manajemen & Notifikasi",
      url: "/manajemen",
      icon: ClipboardList,
      items: [
        { title: "Penjadwalan Perawatan", url: "/manajemen/penjadwalan" },
        { title: "Notifikasi", url: "/manajemen/notifikasi" },
        { title: "Lencana Keaktifan", url: "/manajemen/lencana" },
      ],
    },
    {
      title: "Riwayat & Data",
      url: "/riwayat",
      icon: BookOpen,
      items: [
        { title: "Riwayat", url: "/riwayat/rekap" },
        { title: "Cari Toko Pupuk", url: "/riwayat/toko-pupuk" },
        { title: "Hubungi Pengepul", url: "/riwayat/pengepul" },
      ],
    },
  ];

  // Update navMain untuk menandai item aktif
  const navMainWithActive = React.useMemo(() => {
    return navMain.map((item) => {
      const isActive =
        pathname === item.url ||
        pathname.startsWith(item.url + "/") ||
        item.items?.some((subItem) => pathname === subItem.url);

      const itemsWithActive = item.items?.map((subItem) => ({
        ...subItem,
        isActive: pathname === subItem.url,
      }));

      return {
        ...item,
        isActive,
        items: itemsWithActive,
      };
    });
  }, [pathname]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {user ? (
          <div className="flex flex-col items-start gap-0.1 p-2">
            <p className="text-lg font-semibold">{user.username}</p>
            <span className="text-sm text-gray-500">Lencana: {badge}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Memuat profil...</p>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser
            user={{
              name: user.username, // Nama user (bisa diambil dari metadata kalau ada)
              email: user.email,
              avatar: "/avatars/default.jpg", // Bisa diganti dengan user.avatar kalau ada
            }}
          />
        ) : (
          <p className="text-sm text-gray-500">Memuat profil...</p>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
