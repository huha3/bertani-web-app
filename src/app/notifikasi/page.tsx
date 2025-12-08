"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Info,
  Trash2,
  Check,
  Calendar,
  Sprout,
  Trophy,
  TrendingUp,
  Clock,
  Filter,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "warning" | "info" | "success" | "reminder";
  category: "task" | "harvest" | "achievement" | "system";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

type FilterType = "all" | "unread" | "task" | "harvest" | "achievement";

export default function NotifikasiPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, notifications]);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu belum login!");
        router.push("/login");
        return;
      }

      // Fetch dari tabel notifications
      const { data: notifData, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const notifs: Notification[] = (notifData || []).map(n => ({
        id: n.id,
        type: n.type,
        category: n.category,
        title: n.title,
        message: n.message,
        timestamp: new Date(n.created_at),
        isRead: n.is_read,
        actionUrl: n.action_url || undefined,
        actionLabel: n.action_label || undefined
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);

    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...notifications];

    switch (filter) {
      case "unread":
        filtered = filtered.filter(n => !n.isRead);
        break;
      case "task":
        filtered = filtered.filter(n => n.category === "task");
        break;
      case "harvest":
        filtered = filtered.filter(n => n.category === "harvest");
        break;
      case "achievement":
        filtered = filtered.filter(n => n.category === "achievement");
        break;
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Gagal menandai notifikasi");
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("Semua notifikasi ditandai sudah dibaca");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Gagal menandai semua notifikasi");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notifikasi dihapus");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Gagal menghapus notifikasi");
    }
  };

  const clearAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
      toast.success("Semua notifikasi dihapus");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Gagal menghapus semua notifikasi");
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const getNotificationIcon = (type: string, category: string) => {
    if (category === "achievement") {
      return <Trophy className="w-5 h-5 text-purple-500" />;
    }
    
    switch (type) {
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "reminder":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "task":
        return <Calendar className="w-4 h-4" />;
      case "harvest":
        return <Sprout className="w-4 h-4" />;
      case "achievement":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm", { locale: id });
    }
    if (isYesterday(date)) {
      return "Kemarin";
    }
    return format(date, "dd MMM", { locale: id });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex h-16 items-center border-b px-6">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 items-center border-b px-6 bg-white">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-3 ml-4">
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold">Notifikasi</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Action Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className={filter === "all" ? "bg-emerald-600" : ""}
                  >
                    Semua ({notifications.length})
                  </Button>
                  <Button
                    variant={filter === "unread" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("unread")}
                    className={filter === "unread" ? "bg-emerald-600" : ""}
                  >
                    <BellRing className="w-4 h-4 mr-1" />
                    Belum Dibaca ({unreadCount})
                  </Button>
                  <Button
                    variant={filter === "task" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("task")}
                    className={filter === "task" ? "bg-emerald-600" : ""}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Tugas
                  </Button>
                  <Button
                    variant={filter === "harvest" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("harvest")}
                    className={filter === "harvest" ? "bg-emerald-600" : ""}
                  >
                    <Sprout className="w-4 h-4 mr-1" />
                    Panen
                  </Button>
                  <Button
                    variant={filter === "achievement" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("achievement")}
                    className={filter === "achievement" ? "bg-emerald-600" : ""}
                  >
                    <Trophy className="w-4 h-4 mr-1" />
                    Pencapaian
                  </Button>
                </div>

                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Tandai Semua
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus Semua
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {filter === "all" ? "Tidak ada notifikasi" : `Tidak ada notifikasi ${filter === "unread" ? "yang belum dibaca" : filter}`}
                  </h3>
                  <p className="text-gray-500">
                    {filter === "all" 
                      ? "Notifikasi akan muncul di sini"
                      : "Coba ubah filter untuk melihat notifikasi lain"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notif => (
                <Card 
                  key={notif.id}
                  className={cn(
                    "transition-all hover:shadow-md cursor-pointer",
                    !notif.isRead && "border-l-4 border-l-emerald-500 bg-emerald-50/30"
                  )}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        notif.type === "warning" && "bg-amber-100",
                        notif.type === "success" && "bg-emerald-100",
                        notif.type === "info" && "bg-blue-100",
                        notif.type === "reminder" && "bg-blue-100"
                      )}>
                        {getNotificationIcon(notif.type, notif.category)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "font-semibold text-sm",
                              !notif.isRead ? "text-gray-900" : "text-gray-600"
                            )}>
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              <span className="mr-1">{getCategoryIcon(notif.category)}</span>
                              {formatTimestamp(notif.timestamp)}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-2">
                          {notif.actionUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notif);
                              }}
                              className="h-8 text-xs"
                            >
                              {notif.actionLabel || "Lihat"}
                            </Button>
                          )}
                          
                          {!notif.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              className="h-8 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Tandai Dibaca
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="h-8 text-xs text-red-600 hover:text-red-700 ml-auto"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}