import express from "express";
import cors from "cors"; // Untuk mengizinkan request dari frontend
import dotenv from "dotenv";
import { supabase } from "./supabase/supabaseClient.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Agar frontend bisa mengakses backend

app.post("/register", async (req, res) => {
  const { name, username, nomor, email, password, dateBirth, address } = req.body;

  if (!name || !username || !nomor || !email || !password || !dateBirth || !address) {
    return res.status(400).json({ error: "Semua field harus diisi." });
  }

  try {
    // Registrasi user di Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, username, nomor, dateBirth, address },
      },
    });

    if (authError) throw authError;

    res.status(201).json({ message: "Registrasi berhasil! Silakan cek email untuk verifikasi." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jalankan server di port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
