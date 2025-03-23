// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";

dotenv.config();

// Ganti dengan URL dan Anon Key dari Supabase Dashboard kamu
const supabaseUrl = 'https://mkhywuylxyoncobckzoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1raHl3dXlseHlvbmNvYmNrem9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1MTAyMTEsImV4cCI6MjA1NzA4NjIxMX0.0urVGwFqwGnD3QSrgZx4y5TO4zmr4yfU3B-CyvLyH4s';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
