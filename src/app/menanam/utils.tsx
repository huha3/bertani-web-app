export function hitungIntervalSiram(jumlahSiram: number, satuan: string): number {
  let hariPerSiram: number;

  switch (satuan.toLowerCase()) {
    case 'hari':
      hariPerSiram = 1 / jumlahSiram;
      break;
    case 'minggu':
      hariPerSiram = 7 / jumlahSiram;
      break;
    case 'bulan':
      hariPerSiram = 30 / jumlahSiram;
      break;
    case 'musim':
      hariPerSiram = 90 / jumlahSiram;
      break;
    default:
      hariPerSiram = 1;
      break;
  }

  if (hariPerSiram < 1) hariPerSiram = 1;

  return hariPerSiram;
}
