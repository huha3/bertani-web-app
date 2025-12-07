"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  Sprout,
  ClipboardList, 
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
import { SidebarBadge } from "@/components/sidebar-badge";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [userData, setUserData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Gagal mendapatkan user:", authError?.message);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Gagal mengambil profil:", profileError.message);
      }

      setUserData({
        id: user.id,
        email: user.email,
        username: profile?.username || "Petani",
        full_name: profile?.full_name || "",
      });
    };

    fetchUserProfile();
  }, []);

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      items: [{ title: "Dashboard", url: "/dashboard" }],
    },
    {
      title: "Tumbuhan Kamu",
      url: "/tumbuhan",
      icon: Sprout,
      items: [
        { title: "Lagi Menanam Apa?", url: "/menanam" },
        { title: "Tanamanmu Sakit Apa?", url: "/diagnosa" },
      ],
    },
    {
      title: "Manajemen & Notifikasi",
      url: "/manajemen",
      icon: ClipboardList,
      items: [
        { title: "Penjadwalan Perawatan", url: "/jadwal" },
        { title: "Lencana Keaktifan", url: "/lencana" },
      ],
    },
    {
      title: "Riwayat & Data",
      url: "/riwayat",
      icon: BookOpen,
      items: [
        { title: "Riwayat", url: "/riwayat" },
        { title: "Cari Toko Pupuk", url: "/toko-pupuk" },
        { title: "Hubungi Pengepul", url: "/pengepul" },
      ],
    },
  ];

  const navMainWithActive = React.useMemo(() => {
    return navMain.map((item) => {
      const isActive =
        pathname === item.url ||
        pathname.startsWith(item.url + "/") ||
        item.items?.some((subItem) => pathname === subItem.url);

      const itemsWithActive = item.items?.map((subItem) => ({
        ...subItem,
        isActive: pathname.startsWith(subItem.url),
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
      {/* Header dengan Badge aja */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-center">
          {userData ? (
            <SidebarBadge />
          ) : (
            <div className="animate-pulse h-6 w-20 bg-gray-300 rounded" />
          )}
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <NavMain items={navMainWithActive} />
      </SidebarContent>

      {/* Footer dengan User Info */}
      <SidebarFooter>
        {userData ? (
          <NavUser
            user={{
              name: userData.full_name || userData.username,
              email: userData.email || "Tidak ada email",
              avatar: "/avatars/default.jpg",
            }}
          />
        ) : (
          <div className="p-2">
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-24 bg-gray-300 rounded" />
              <div className="h-3 w-32 bg-gray-300 rounded" />
            </div>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}