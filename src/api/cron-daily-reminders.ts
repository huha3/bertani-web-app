import { supabase } from "@/lib/supabase"; // Klien Supabase Anda
import { insertNotification } from "@/lib/supabase-notifications"; // Fungsi notifikasi yang sudah kita buat

// Fungsi ini dirancang untuk dijalankan oleh Cron Job server Anda setiap hari
// pada waktu yang user-friendly (misalnya, setiap pagi pukul 07:00).
export async function checkAndNotifyDailyEvents() {
    console.log("Memulai pengecekan pengingat harian (Jadwal Tugas & Panen)...");

    const today = new Date();
    // Mendapatkan tanggal hari ini dalam format YYYY-MM-DD
    const todayISO = today.toISOString().split('T')[0];

    // --- BAGIAN 1: PENGINGAT TUGAS HARIAN (dari jadwal_menanam) ---
    try {
        // Ambil semua tugas yang jatuh tempo hari ini DAN belum selesai
        // Kita hanya mengambil user_id karena kita akan mengelompokkan notifikasi per pengguna
        const { data: allTodayTasks, error: taskFetchError } = await supabase
             .from('jadwal_menanam')
             .select('user_id, jenis_kegiatan') 
             .eq('tanggal', todayISO) // Filter: tanggal tugas adalah hari ini
             .eq('status', false); // Filter: tugas belum selesai

        if (taskFetchError) throw taskFetchError;

        // 1a. Mengelompokkan dan menghitung jumlah tugas per pengguna
        const taskCounts: { [userId: string]: { count: number, example: string } } = {};
        allTodayTasks?.forEach(task => {
            if (!taskCounts[task.user_id]) {
                taskCounts[task.user_id] = { count: 0, example: task.jenis_kegiatan };
            }
            taskCounts[task.user_id].count++;
        });

        const usersWithTasks = Object.keys(taskCounts);

        // 1b. Memasukkan notifikasi untuk setiap pengguna yang memiliki tugas
        if (usersWithTasks.length > 0) {
            console.log(`[TUGAS] Ditemukan ${usersWithTasks.length} pengguna dengan tugas hari ini.`);

            for (const userId of usersWithTasks) {
                 const { count, example } = taskCounts[userId];
                 const message = count > 1 
                    ? `Anda memiliki ${count} tugas tanaman yang harus diselesaikan, termasuk "${example}".`
                    : `Anda memiliki tugas: "${example}".`;

                await insertNotification({
                    user_id: userId,
                    title: "Jadwal Tugas Harian 📝",
                    message: message,
                    category: 'task',
                    action_url: '/jadwal',
                    action_label: 'Lihat Tugas'
                });
            }
        }
    } catch (e) {
        console.error("CRON_TASK_REMINDER_ERROR: Gagal membuat notifikasi tugas harian.", e);
    }
    
    // --- BAGIAN 2: PENGINGAT PANEN (dari tanaman_pengguna) ---
    // Logika ini tetap berjalan secara terpisah.
    try {
        const { data: harvestPlants, error: harvestError } = await supabase
            .from('tanaman_pengguna')
            .select('user_id, name, id') 
            .eq('tanggal_panen', todayISO)
            .eq('status', 'ACTIVE'); 

        if (harvestError) throw harvestError;

        if (harvestPlants && harvestPlants.length > 0) {
            console.log(`[PANEN] Ditemukan ${harvestPlants.length} tanaman siap panen hari ini.`);
            
            // Loop untuk membuat notifikasi (menggunakan Set di sini jika perlu menghindari notifikasi ganda)
            const usersNotifiedPanen = new Set<string>();
            for (const plant of harvestPlants) {
                if (!usersNotifiedPanen.has(plant.user_id)) {
                    await insertNotification({
                        user_id: plant.user_id,
                        title: "Waktunya Panen! 🥳",
                        message: `Satu atau lebih tanaman Anda jatuh tempo panen hari ini. Segera catat hasil panen!`,
                        category: 'reminder',
                        action_url: `/jadwal/${plant.id}`,
                        action_label: 'Catat Hasil'
                    });
                    usersNotifiedPanen.add(plant.user_id);
                }
            }
        }
    } catch (e) {
        console.error("CRON_HARVEST_ERROR: Gagal membuat notifikasi panen.", e);
    }
    
    console.log("Selesai pengecekan pengingat harian.");
    return { success: true };
}