// supabaseClientAdmin.js (Ubicado en tu Backend de Railway)

const { createClient } = require('@supabase/supabase-js');

// 1. LEE las variables de entorno configuradas en el Dashboard de Railway
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificación de seguridad (opcional, pero buena práctica)
if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ ERROR: Las variables de entorno de Supabase no están cargadas. Revisa la configuración en Railway.");
    // No salimos con error fatal para dar tiempo a Railway de reiniciarse, pero avisamos.
}

// 2. CREA EL CLIENTE CON PERMISOS DE ADMINISTRADOR TOTAL
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false 
    }
});

module.exports = supabaseAdmin;