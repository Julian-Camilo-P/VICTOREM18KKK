// supabaseClient.js — Importado como 'type="module"' en el HTML
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// TUS CLAVES REALES AQUÍ:
const SUPABASE_URL = 'https://zkgudjvubwxohfsbzzkv.supabase.co'; // Reemplaza
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZ3VkanZ1Ynd4b2hmc2J6emt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTAyNjAsImV4cCI6MjA3OTU2NjI2MH0.9rE_3kaOSG_ADJnGdMBKgQLLtDJAeL_m4WyBXCw0lH0'; // Reemplaza

// Inicializa el cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);