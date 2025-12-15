import { supabase } from "@/lib/supabase";
import { insertNotification } from "@/lib/supabase-notifications";

// fungsi utama
export async function checkAndAwardBadges(userId: string) {
  try {
    // ambil daftar tanaman user
    const { data: plants, error: plantError } = await supabase
      .from("tanaman_pengguna")
      .select("*")
      .eq("user_id", userId);

    if (plantError) throw plantError;

    const badgeList = [];

    // Pemula Rajin — punya minimal 1 tanaman
    if (plants && plants.length >= 1) {
      badgeList.push({
        badge_id: "pemula-rajin",
        badge_name: "Pemula Rajin",
      });
    }

    // Petani Aktif — punya lebih dari 3 tanaman
    if (plants && plants.length > 3) {
      badgeList.push({
        badge_id: "petani-aktif",
        badge_name: "Petani Aktif",
      });
    }

    // Dedikasi Tinggi — tanaman aktif lebih dari 30 hari
    const now = new Date();
    const hasOldPlant = plants?.some(p => {
      const start = new Date(p.tanggal_tanam);
      const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 30;
    });
    if (hasOldPlant) {
      badgeList.push({
        badge_id: "dedikasi-tinggi",
        badge_name: "Dedikasi Tinggi",
      });
    }

    // Streak Petani — update selama 7 hari berturut-turut
    const { data: logs } = await supabase
      .from("aktivitas_pengguna")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (logs?.length) {
      const uniqueDays = new Set(logs.map(l => l.created_at.split("T")[0]));
      if (uniqueDays.size >= 7) {
        badgeList.push({
          badge_id: "streak-petani",
          badge_name: "Streak Petani",
        });
      }
    }

    // Cek badge yang sudah dimiliki
    const { data: existing } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);

    const owned = existing?.map(b => b.badge_id) || [];

    // Masukkan badge baru
    const newBadges = badgeList.filter(b => !owned.includes(b.badge_id));

    if (newBadges.length > 0) {
      const { error: insertError } = await supabase
        .from("user_badges")
        .insert(newBadges.map(b => ({
          user_id: userId,
          badge_id: b.badge_id,
          badge_name: b.badge_name,
        })));

      if (insertError) throw insertError;

      console.log("Badge baru diberikan:", newBadges);
      newBadges.forEach(badge => {
            insertNotification({
                user_id: userId,
                title: "Pencapaian Baru!",
                message: `Selamat! Anda berhasil meraih lencana "${badge.badge_name}". Lihat profil Anda sekarang.`,
                category: 'achievement',
                action_url: '/profile',
                action_label: 'Lihat Lencana'
            });
        });
    } else {
      console.log("Tidak ada badge baru untuk user ini");
    }

  } catch (error) {
    console.error("Error awarding badges:", error);
  }
}
