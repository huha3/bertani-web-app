import { supabase } from "@/lib/supabase"; // Asumsikan Anda memiliki konfigurasi Supabase di path ini

// Interface untuk struktur data notifikasi
interface NotificationPayload {
    user_id: string;
    title: string;
    message: string;
    category: 'task' | 'achievement' | 'reminder' | 'system'; // Kategori yang bisa disesuaikan
    action_url: string;
    action_label?: string; // Opsional
}

/**
 * Fungsi untuk memasukkan notifikasi baru ke database.
 * Ini dipanggil dari backend (misalnya, setelah lencana diberikan, atau tugas penting terjadi).
 * @param payload Objek berisi detail notifikasi.
 */
export async function insertNotification(payload: NotificationPayload) {
    // Pastikan payload memiliki action_label atau set default
    const notificationData = {
        ...payload,
        is_read: false,
        action_label: payload.action_label || 'Lihat Detail',
    };

    try {
        const { error } = await supabase
            .from('notifications')
            .insert([notificationData]);

        if (error) {
            console.error('SUPABASE_NOTIF_ERROR: Gagal memasukkan notifikasi baru.', error);
            throw error;
        }

        console.log(`Notifikasi baru berhasil dibuat untuk user ${payload.user_id}: ${payload.title}`);
        return true;

    } catch (e) {
        console.error('Error saat insertNotification:', e);
        return false;
    }
}

/**
 * Fungsi untuk mengambil notifikasi pengguna.
 * @param userId ID Pengguna
 */
export async function fetchNotifications(userId: string) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Error saat fetchNotifications:', e);
        return [];
    }
}

/**
 * Fungsi untuk menandai satu notifikasi sebagai telah dibaca.
 * @param notificationId ID Notifikasi
 */
export async function markAsRead(notificationId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
        console.log(`Notifikasi ${notificationId} ditandai sebagai dibaca.`);
        return true;
    } catch (e) {
        console.error('Error saat markAsRead:', e);
        return false;
    }
}

/**
 * Fungsi untuk menandai SEMUA notifikasi pengguna sebagai telah dibaca.
 * @param userId ID Pengguna
 */
export async function markAllAsRead(userId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false); // Hanya update yang belum dibaca

        if (error) throw error;
        console.log(`Semua notifikasi untuk user ${userId} ditandai sebagai dibaca.`);
        return true;
    } catch (e) {
        console.error('Error saat markAllAsRead:', e);
        return false;
    }
}

// Tambahkan fungsi lain (deleteNotification, clearAll) sesuai kebutuhan Anda