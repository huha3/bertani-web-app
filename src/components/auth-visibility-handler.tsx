"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthVisibilityHandler() {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
