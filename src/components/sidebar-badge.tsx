"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface SidebarBadgeProps {
  className?: string;
}

export function SidebarBadge({ className }: SidebarBadgeProps) {
  const [badgeCount, setBadgeCount] = useState(0);
  const [highestBadge, setHighestBadge] = useState<string | null>(null);

  useEffect(() => {
    fetchUserBadges();
  }, []);

  const fetchUserBadges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_badges")
        .select("badge_id, badge_name")
        .eq("user_id", user.id)
        .order("earned_date", { ascending: false });

      if (error) throw error;

      setBadgeCount(data?.length || 0);
      
      // Tentukan badge tertinggi
      const badgeHierarchy = [
        "dedikasi-tinggi",
        "streak-petani", 
        "tepat-waktu",
        "pemula-rajin"
      ];

      const earnedBadgeIds = data?.map(b => b.badge_id) || [];
      const highest = badgeHierarchy.find(id => earnedBadgeIds.includes(id));
      
      if (highest) {
        const badgeName = data?.find(b => b.badge_id === highest)?.badge_name;
        setHighestBadge(badgeName || null);
      }

    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  const getBadgeColor = () => {
    if (badgeCount >= 4) return "bg-purple-500 text-white";
    if (badgeCount >= 3) return "bg-amber-500 text-white";
    if (badgeCount >= 2) return "bg-blue-500 text-white";
    if (badgeCount >= 1) return "bg-emerald-500 text-white";
    return "bg-gray-200 text-gray-600";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge className={cn("flex items-center gap-1 px-2 py-1", getBadgeColor())}>
        <Trophy className="w-3 h-3" />
        <span className="text-xs font-semibold">{badgeCount}</span>
      </Badge>
      
      {highestBadge && (
        <Badge variant="outline" className="text-xs px-2 py-1 border-amber-300 bg-amber-50 text-amber-700">
          <Sparkles className="w-3 h-3 mr-1" />
          {highestBadge}
        </Badge>
      )}
    </div>
  );
}