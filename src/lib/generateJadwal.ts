export type JadwalParams = {
  start: Date;
  end: Date;
  wateringFreq: number;
  fertilizerFreq: number;
  unit?: string;
  fertilizers?: string;
  id_menanam: number;
  id_user: string;
};

type JadwalItem = {
  id_menanam: number;
  tanggal: Date;
  jenis_kegiatan: string;
  status: boolean;
  id_user: string;
};

export function generateJadwal({
  start,
  end,
  wateringFreq,
  fertilizerFreq,
  unit,
  fertilizers,
  id_menanam,
  id_user,
}: JadwalParams): JadwalItem[] {
  const jadwal: JadwalItem[] = [];

  // Tambahkan jadwal penyiraman
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + wateringFreq)) {
    jadwal.push({
      id_menanam,
      tanggal: new Date(d.getTime()),
      jenis_kegiatan: "Penyiraman",
      status: false,
      id_user,
    });
  }

  // Tambahkan jadwal pemupukan (jika ada)
  if (fertilizerFreq > 0 && fertilizers) {
    const daysToAdd = unit === "minggu" ? fertilizerFreq * 7 : fertilizerFreq;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + daysToAdd)) {
      jadwal.push({
        id_menanam,
        tanggal: new Date(d.getTime()),
        jenis_kegiatan: `Pemberian pupuk ${fertilizers}`,
        status: false,
        id_user,
      });
    }
  }

  return jadwal;
}
