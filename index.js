// server.js (o index.js en tu backend de Railway)

const express = require('express');
const app = express();
const supabaseAdmin = require('./supabaseClientAdmin'); // IMPORTA EL CLIENTE ADMIN

// ... (configuración de express.json, cors, etc.)

app.post('/api/tarea-admin/eliminar-cuenta', async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'Falta el ID del usuario.' });
    }

    try {
        // Usa supabaseAdmin, no el cliente normal.
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (error) {
            console.error('Error de Supabase Admin:', error.message);
            return res.status(500).json({ error: 'Fallo al eliminar el usuario en Supabase.', details: error.message });
        }

        return res.status(200).json({ message: 'Cuenta eliminada exitosamente (Auth, Perfil y Carrito).' });

    } catch (e) {
        console.error('Error en el endpoint /eliminar-cuenta:', e);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ... (Inicio del servidor)