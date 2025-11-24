// index.js (Tu código en Railway)

import express from 'express';
// Necesitas instalar esta librería en Railway: npm install @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// --- ACCESO SEGURO A LAS CLAVES ---
// Las claves se leen de las variables de entorno de Railway
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Creador del cliente con privilegios de ADMINISTRADOR (ignora RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

// --- ENDPOINT PARA TAREAS SENSIBLES ---
// Esta será la URL que llamará tu frontend
app.post('/api/tarea-admin/buscar-usuario', async (req, res) => {
    try {
        // En el backend, siempre debes verificar la autenticación del usuario llamando (ej: con un token JWT)
        // Por simplicidad, aquí solo demostraremos el acceso a la DB.
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Falta el ID de usuario.' });
        }

        // ⚠️ ACCESO ADMINISTRATIVO: Usamos supabaseAdmin, que puede leer CUALQUIER perfil
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', userId)
            .single();

        if (error) throw error;

        res.status(200).json({
            status: 'success',
            message: 'Datos del perfil obtenidos con privilegios de administrador',
            profile: profile
        });

    } catch (e) {
        console.error('Error en la tarea admin:', e.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));