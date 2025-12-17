// src/lib/classLabels.ts


export const mapIndexToLabel = (index: number) => {
  const labels = [
    "Bercak Daun (Leaf Spot)",
    "Hawar Daun (Blight)",
    "Karat Daun (Rust)",
    "Sehat (Healthy)",
  ];
  return labels[index] || "Tidak diketahui";
};

export const mapValueToDisease = (value: number) => {
  if (value < 0.25) return "Sehat (Healthy)";
  if (value < 0.5)  return "Bercak Daun (Leaf Spot)";
  if (value < 0.75) return "Karat Daun (Rust)";
  return "Hawar Daun (Blight)";
};

export const getSaran = (index: number) => {
  const saranList = [
    "Singkirkan daun yang terinfeksi, gunakan fungisida sesuai dosis, hindari kelembaban berlebih.",
    "Buang bagian tanaman yang terinfeksi, pastikan jarak tanam cukup, gunakan fungisida sistemik.",
    "Potong daun yang berkarat, gunakan fungisida berbasis tembaga, pastikan sirkulasi udara baik.",
    "Tidak ada tindakan khusus, tanaman sehat."
  ];
  return saranList[index] || "Tidak ada saran";
};

export const getDeskripsi = (index: number) => {
  const descList = [
    "Bercak daun biasanya muncul sebagai noda kecil berwarna coklat atau hitam di permukaan daun, dapat menyebar jika kelembaban tinggi.",
    "Hawar daun menyebabkan layu dan kematian jaringan tanaman, biasanya disebabkan oleh jamur atau bakteri, cepat menular.",
    "Karat daun menimbulkan bercak oranye atau coklat di permukaan daun, merusak klorofil dan mengurangi fotosintesis.",
    "Tanaman dalam kondisi sehat, tidak ada tanda-tanda penyakit."
  ];
  return descList[index] || "Deskripsi tidak tersedia";
};

export const getSeverity = (index: number) => {
  const severityList = ["ringan", "sedang", "sedang", "sehat"];
  return severityList[index] || "sehat";
};
