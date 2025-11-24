// miperfil.js (Integrado con Supabase)

import { supabase } from './supabaseClient.js';

// URL pública de tu servicio Railway (para tareas administrativas futuras)
const RAILWAY_API_URL = 'https://victorem18kkk-production.up.railway.app'; 

// Variable global para guardar la sección activa
let seccionActiva = 'carrito';

// --- Placeholder para detalles del producto (La tabla cart_items solo guarda IDs) ---
// En una aplicación real, esta información vendría de una tabla 'products' de Supabase.
const PRODUCT_DETAILS_MAP = {
    'P101': { nombre: 'Espada de Mithril', precio: '75.000', imagen: 'https://via.placeholder.com/60x60/333333/FFFFFF?text=P101' },
    'P102': { nombre: 'Poción Curativa', precio: '15.000', imagen: 'https://via.placeholder.com/60x60/8B0000/FFFFFF?text=P102' },
    'P103': { nombre: 'Escudo de Acero', precio: '55.000', imagen: 'https://via.placeholder.com/60x60/555555/FFFFFF?text=P103' }
};

function getProductDetails(productId) {
    return PRODUCT_DETAILS_MAP[productId] || { 
        nombre: `Producto ID: ${productId}`, 
        precio: '0', 
        imagen: 'https://via.placeholder.com/60x60/AAAAAA/FFFFFF?text=NA' 
    };
}

// ----------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const authNav = document.getElementById('auth-nav');
    const perfilContenido = document.getElementById('perfil-contenido');
    
    // 1. REEMPLAZO DE checkAuthStatus
    async function checkAuthStatus() {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // Obtener el perfil de la tabla 'profiles' (donde guardamos los metadatos)
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('full_name, email, created_at, metadata')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error("Error al cargar perfil de Supabase:", error.message);
                // Si hay un error, aún mostramos el usuario básico
                const defaultName = user.email.split('@')[0];
                cargarPerfilNoData(user.email, defaultName, user.created_at);
                return;
            }

            // Mapear los datos de Supabase a la estructura de usuario esperada por el HTML
            const currentUser = {
                id: user.id,
                email: user.email,
                name: profile.full_name || user.email.split('@')[0], 
                registrationDate: profile.created_at,
                // Datos adicionales (ahora vienen del campo JSONB 'metadata')
                phone: profile.metadata?.phone || '',
                birthDate: profile.metadata?.birthDate || '',
                bio: profile.metadata?.bio || '',
                addresses: profile.metadata?.addresses || [],
                // Guardamos el profile original para acceder al metadata más fácilmente
                rawProfile: profile
            };
            
            // Actualizar navegación
            authNav.innerHTML = `
              <div class="user-menu">
                <button class="user-menu-btn">
                  <span>${currentUser.name}</span>
                  <span>▼</span>
                </button>
                <div class="user-dropdown">
                  <a href="miperfil.html" style="color: #d4af37;">Mi Perfil</a>
                  <a href="#" id="logoutLink">Cerrar Sesión</a>
                </div>
              </div>
            `;
            document.getElementById('logoutLink').addEventListener('click', logout);
            
            // Cargar contenido del perfil
            await cargarPerfilUsuario(currentUser);

        } else {
            // Lógica si no está autenticado (sin cambios)
            authNav.innerHTML = `
              <li><a href="#" id="loginLink">Iniciar Sesión</a></li>
            `;
            document.getElementById('loginLink').addEventListener('click', function() {
              window.location.href = 'index.html#login';
            });
            
            perfilContenido.innerHTML = `
              <div class="no-auth-message">
                <h2>Acceso Restringido</h2>
                <p>Debes iniciar sesión para acceder a tu perfil.</p>
                <a href="index.html" class="btn">Ir a Inicio de Sesión</a>
              </div>
            `;
        }
    }

    // 2. REEMPLAZO DE logout
    async function logout() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Error al cerrar sesión: ' + error.message);
            return;
        }
        // Redirigir y limpiar
        window.location.href = 'miperfil.html';
    }
    
    // 3. REEMPLAZO DE cargarPerfilUsuario
    async function cargarPerfilUsuario(user) {
        // Obtener carrito del usuario de la DB (RLS asegura que solo vemos el nuestro)
        const { data: carritoDB, error: carritoError } = await supabase
            .from('cart_items')
            .select('*'); 
        
        if (carritoError) console.error("Error al cargar carrito:", carritoError.message);
        
        // ** NOTA: Los pedidos (`pedidos`) aún no están integrados en Supabase (requiere tabla `orders`)
        const pedidos = []; // Array vacío por ahora

        // Mapear el carrito de la DB para incluir detalles del producto (usando el placeholder)
        const carrito = (carritoDB || []).map(item => ({
            id: item.id, // ID del item en la tabla cart_items
            product_id: item.product_id,
            cantidad: item.quantity,
            ...getProductDetails(item.product_id) // Agrega nombre, precio, imagen del placeholder
        }));
        
        // Obtener iniciales para el avatar
        const iniciales = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        perfilContenido.innerHTML = `
            <div class="perfil-container">
                <div class="perfil-sidebar">
                    <div class="perfil-avatar">
                        <div class="avatar">${iniciales}</div>
                        <h3>${user.name}</h3>
                        <p>${user.email}</p>
                        <p>Miembro desde: ${new Date(user.registrationDate).toLocaleDateString('es-ES')}</p>
                    </div>
                    
                    <ul class="perfil-nav">
                        <li><a href="#informacion" class="nav-link ${seccionActiva === 'informacion' ? 'active' : ''}">Información Personal</a></li>
                        <li><a href="#direcciones" class="nav-link ${seccionActiva === 'direcciones' ? 'active' : ''}">Direcciones</a></li>
                        <li><a href="#pedidos" class="nav-link ${seccionActiva === 'pedidos' ? 'active' : ''}">Mis Pedidos</a></li>
                        <li><a href="#carrito" class="nav-link ${seccionActiva === 'carrito' ? 'active' : ''}">Carrito de Compras (${carrito.length})</a></li>
                        <li><a href="#seguridad" class="nav-link ${seccionActiva === 'seguridad' ? 'active' : ''}">Seguridad</a></li>
                    </ul>
                </div>
                
                <div class="perfil-content">
                    <div id="informacion" class="perfil-seccion ${seccionActiva === 'informacion' ? 'active' : ''}">
                        <h2 class="perfil-titulo">Información Personal</h2>
                        <form id="form-info-personal">
                          <div class="form-row">
                            <div class="form-group">
                              <label for="nombre">Nombre Completo</label>
                              <input type="text" id="nombre" value="${user.name}" required>
                            </div>
                            <div class="form-group">
                              <label for="email">Correo Electrónico (Solo lectura)</label>
                              <input type="email" id="email" value="${user.email}" readonly>
                            </div>
                          </div>
                          <div class="form-row">
                            <div class="form-group">
                              <label for="telefono">Teléfono</label>
                              <input type="tel" id="telefono" value="${user.phone || ''}">
                            </div>
                            <div class="form-group">
                              <label for="fecha-nacimiento">Fecha de Nacimiento</label>
                              <input type="date" id="fecha-nacimiento" value="${user.birthDate || ''}">
                            </div>
                          </div>
                          <div class="form-group">
                            <label for="bio">Biografía</label>
                            <textarea id="bio" rows="4" placeholder="Cuéntanos sobre ti...">${user.bio || ''}</textarea>
                          </div>
                          <button type="submit" class="btn">Guardar Cambios</button>
                        </form>
                    </div>

                    <div id="direcciones" class="perfil-seccion ${seccionActiva === 'direcciones' ? 'active' : ''}">
                        <h2 class="perfil-titulo">Mis Direcciones</h2>
                        <div id="lista-direcciones">
                            ${generarDireccionesHTML(user.addresses)}
                        </div>
                        <button id="agregar-direccion" class="btn" style="margin-top: 20px;">Agregar Nueva Dirección</button>
                        
                        <form id="form-direccion" style="display: none; margin-top: 20px;">
                            ${generarFormularioDireccion()}
                            <button type="submit" class="btn">Guardar Dirección</button>
                            <button type="button" id="cancelar-direccion" class="btn btn-outline">Cancelar</button>
                        </form>
                    </div>

                    <div id="pedidos" class="perfil-seccion ${seccionActiva === 'pedidos' ? 'active' : ''}">
                        <h2 class="perfil-titulo">Mis Pedidos</h2>
                        <div id="lista-pedidos">
                            ${generarPedidosHTML(pedidos)}
                        </div>
                    </div>

                    <div id="carrito" class="perfil-seccion ${seccionActiva === 'carrito' ? 'active' : ''}">
                        <h2 class="perfil-titulo">Carrito de Compras</h2>
                        <div class="carrito-grid" id="lista-carrito">
                            ${generarCarritoHTML(carrito)}
                        </div>
                        
                        ${carrito.length > 0 ? `
                        <div class="carrito-total">
                            <h3>Resumen del Pedido</h3>
                            <div class="carrito-total-linea">
                                <span>Subtotal:</span>
                                <span id="subtotal">$${calcularSubtotal(carrito).toLocaleString('es-ES')}</span>
                            </div>
                            <div class="carrito-total-linea">
                                <span>Envío:</span>
                                <span id="envio">$10.000</span>
                            </div>
                            <div class="carrito-total-final">
                                <span>Total:</span>
                                <span id="total">$${(calcularSubtotal(carrito) + 10000).toLocaleString('es-ES')}</span>
                            </div>
                            <button class="btn" id="proceder-pago" style="width: 100%; margin-top: 20px;">
                                Proceder al Pago
                            </button>
                        </div>
                        ` : ''}
                    </div>

                    <div id="seguridad" class="perfil-seccion ${seccionActiva === 'seguridad' ? 'active' : ''}">
                        <h2 class="perfil-titulo">Seguridad</h2>
                        <form id="form-cambiar-password">
                            <div class="form-group">
                                <label for="nueva-password">Nueva Contraseña</label>
                                <input type="password" id="nueva-password" required minlength="6">
                            </div>
                            <div class="form-group">
                                <label for="confirmar-password">Confirmar Nueva Contraseña</label>
                                <input type="password" id="confirmar-password" required>
                            </div>
                            <button type="submit" class="btn">Cambiar Contraseña</button>
                        </form>
                        
                        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                            <h3 style="margin-bottom: 15px;">Eliminar Cuenta</h3>
                            <p style="margin-bottom: 15px; color: #666;">Esta acción no se puede deshacer. Se eliminarán todos tus datos permanentemente.</p>
                            <button id="eliminar-cuenta" class="btn btn-danger">Eliminar Mi Cuenta</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Inicializar eventos
        inicializarEventosPerfil(user);
    }
    
    // --- Funciones de Utilidad (sin cambios estructurales) ---
    
    function generarFormularioDireccion() {
        // ... (Tu código para el formulario de dirección, solo debe ser HTML) ...
        return `
            <div class="form-row">
                <div class="form-group">
                    <label for="direccion-alias">Alias (Ej: Casa, Trabajo)</label>
                    <input type="text" id="direccion-alias" required>
                </div>
                <div class="form-group">
                    <label for="direccion-destinatario">Destinatario</label>
                    <input type="text" id="direccion-destinatario" required>
                </div>
            </div>
            <div class="form-group">
                <label for="direccion-calle">Dirección</label>
                <input type="text" id="direccion-calle" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="direccion-ciudad">Ciudad</label>
                    <input type="text" id="direccion-ciudad" required>
                </div>
                <div class="form-group">
                    <label for="direccion-departamento">Departamento</label>
                    <input type="text" id="direccion-departamento" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="direccion-codigo-postal">Código Postal</label>
                    <input type="text" id="direccion-codigo-postal">
                </div>
                <div class="form-group">
                    <label for="direccion-telefono">Teléfono de Contacto</label>
                    <input type="tel" id="direccion-telefono" required>
                </div>
            </div>
            <div class="form-group">
                <label for="direccion-instrucciones">Instrucciones de Entrega (Opcional)</label>
                <textarea id="direccion-instrucciones" rows="3"></textarea>
            </div>
        `;
    }
    
    function generarDireccionesHTML(direcciones) {
        if (direcciones.length === 0) {
            return `<div class="mensaje-vacio"><i>🏠</i><p>No tienes direcciones guardadas</p></div>`;
        }
        return direcciones.map((dir, index) => `
            <div class="pedido" style="position: relative;">
                <button class="btn btn-outline" style="position: absolute; top: 15px; right: 15px; padding: 5px 10px; font-size: 12px;" onclick="eliminarDireccion(${index})">Eliminar</button>
                <h4>${dir.alias}</h4>
                <p><strong>${dir.destinatario}</strong></p>
                <p>${dir.calle}</p>
                <p>${dir.ciudad}, ${dir.departamento}</p>
                <p>${dir.codigoPostal ? 'CP: ' + dir.codigoPostal : ''}</p>
                <p>Tel: ${dir.telefono}</p>
                ${dir.instrucciones ? `<p><em>Instrucciones: ${dir.instrucciones}</em></p>` : ''}
            </div>
        `).join('');
    }
    
    function generarPedidosHTML(pedidos) {
        if (pedidos.length === 0) {
            return `<div class="mensaje-vacio"><i>📦</i><p>No tienes pedidos realizados</p><a href="catalogo.html" class="btn" style="margin-top: 15px;">Explorar Catálogo</a></div>`;
        }
        // ... (Tu HTML de pedidos) ...
        return ''; // Retorno vacío por simplicidad
    }
    
    function generarCarritoHTML(carrito) {
        if (carrito.length === 0) {
            return `<div class="mensaje-vacio" style="grid-column: 1 / -1;"><i>🛒</i><p>Tu carrito está vacío</p><a href="catalogo.html" class="btn" style="margin-top: 15px;">Explorar Catálogo</a></div>`;
        }
        
        return carrito.map(item => `
            <div class="carrito-item">
                <img src="${item.imagen}" alt="${item.nombre}" class="carrito-img">
                <div class="carrito-content">
                    <div class="carrito-nombre">${item.nombre}</div>
                    <div class="carrito-precio">$${parseInt(item.precio.replace(/\D/g, '')).toLocaleString('es-ES')}</div>
                    
                    <div class="carrito-cantidad">
                        <button onclick="actualizarCantidad(${item.id}, -1)">-</button>
                        <input type="number" value="${item.cantidad}" min="1" onchange="actualizarCantidadInput(${item.id}, this.value)">
                        <button onclick="actualizarCantidad(${item.id}, 1)">+</button>
                    </div>
                    
                    <div class="carrito-acciones">
                        <button class="btn" onclick="comprarAhora('${item.product_id}', ${item.cantidad})">Comprar Ahora</button>
                        <button class="btn btn-outline" onclick="eliminarDelCarrito(${item.id})">Eliminar</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    function calcularSubtotal(carrito) {
        return carrito.reduce((total, producto) => {
            const precio = parseInt(producto.precio.replace(/\D/g, '')) || 0;
            return total + (precio * producto.cantidad);
        }, 0);
    }
    
    // --- Lógica de Manejo de Datos (Supabase) ---
    
    // 4. REEMPLAZO DE guardarInformacionPersonal
    async function guardarInformacionPersonal(user) {
        const full_name = document.getElementById('nombre').value;
        const phone = document.getElementById('telefono').value;
        const birthDate = document.getElementById('fecha-nacimiento').value;
        const bio = document.getElementById('bio').value;

        // Construir el nuevo objeto metadata (manteniendo las direcciones)
        const newMetadata = {
            ...user.rawProfile.metadata, // Copia todo el metadata existente
            phone: phone,
            birthDate: birthDate,
            bio: bio,
        };

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: full_name,
                metadata: newMetadata // Actualiza el campo JSONB
            })
            .eq('id', user.id);

        if (error) {
            alert('Error al guardar la información: ' + error.message);
            return;
        }

        alert('Información actualizada correctamente');
        checkAuthStatus(); // Recargar el estado
    }
    
    // 5. REEMPLAZO DE guardarDireccion
    async function guardarDireccion(user) {
        const nuevaDireccion = {
            alias: document.getElementById('direccion-alias').value,
            destinatario: document.getElementById('direccion-destinatario').value,
            calle: document.getElementById('direccion-calle').value,
            ciudad: document.getElementById('direccion-ciudad').value,
            departamento: document.getElementById('direccion-departamento').value,
            codigoPostal: document.getElementById('direccion-codigo-postal').value,
            telefono: document.getElementById('direccion-telefono').value,
            instrucciones: document.getElementById('direccion-instrucciones').value
        };
        
        const currentAddresses = user.addresses || [];
        currentAddresses.push(nuevaDireccion);

        const { error } = await supabase
            .from('profiles')
            .update({
                metadata: {
                    ...user.rawProfile.metadata,
                    addresses: currentAddresses
                }
            })
            .eq('id', user.id);

        if (error) {
            alert('Error al guardar la dirección: ' + error.message);
            return;
        }
        
        // Resetear formulario y actualizar
        document.getElementById('form-direccion').style.display = 'none';
        document.getElementById('agregar-direccion').style.display = 'inline-block';
        document.getElementById('form-direccion').reset();
        
        alert('Dirección guardada correctamente');
        checkAuthStatus(); 
    }
    
    // 6. REEMPLAZO DE cambiarPassword
    async function cambiarPassword(user) {
        // La validación de la contraseña actual NO se puede hacer en el frontend con Supabase.
        // Solo verificamos que las nuevas contraseñas coincidan.
        const nuevaPassword = document.getElementById('nueva-password').value;
        const confirmarPassword = document.getElementById('confirmar-password').value;
        
        if (nuevaPassword !== confirmarPassword) {
            alert('Las contraseñas nuevas no coinciden');
            return;
        }

        // Usamos la función de Auth para actualizar la contraseña (envía un correo de confirmación por defecto)
        const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
        
        if (error) {
            alert('Error al cambiar la contraseña. Revisa el correo de verificación si es necesario, o intenta iniciar sesión de nuevo. Error: ' + error.message);
            return;
        }

        document.getElementById('form-cambiar-password').reset();
        alert('Contraseña actualizada. Por seguridad, es posible que debas verificar tu correo o volver a iniciar sesión.');
    }
    
    // 7. REEMPLAZO DE eliminarCuenta
    async function eliminarCuenta(user) {
        // La RLS que definimos en SQL se encargará de eliminar automáticamente el perfil asociado
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        
        // NOTA: Para eliminar desde el CLIENTE (sin rol admin), usarías:
        // const { error } = await supabase.auth.deleteUser();
        // Pero esto puede requerir reautenticación. Usaremos la versión simple.

        if (error) {
             alert('Error al eliminar la cuenta: ' + error.message);
             return;
        }

        alert('Tu cuenta ha sido eliminada. Redirigiendo...');
        window.location.href = 'index.html';
    }

    // --- Funciones Globales para Carrito (Usando Supabase) ---
    
    // Las funciones globales ahora esperan el ID del ítem de la tabla 'cart_items' (no el índice local)
    window.actualizarCantidad = async function(itemId, cambio) {
        const { data: currentItem, error: fetchError } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('id', itemId)
            .single();

        if (fetchError) {
             console.error('Error al obtener ítem del carrito:', fetchError.message);
             return;
        }

        let nuevaCantidad = currentItem.quantity + cambio;
        if (nuevaCantidad < 1) nuevaCantidad = 1;

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity: nuevaCantidad })
            .eq('id', itemId);

        if (error) {
            alert('Error al actualizar cantidad: ' + error.message);
            return;
        }

        checkAuthStatus(); // Refrescar la vista
    };
    
    window.actualizarCantidadInput = async function(itemId, nuevaCantidad) {
        let quantity = Math.max(1, parseInt(nuevaCantidad) || 1);
        
        const { error } = await supabase
            .from('cart_items')
            .update({ quantity: quantity })
            .eq('id', itemId);
        
        if (error) {
            alert('Error al actualizar cantidad: ' + error.message);
            return;
        }
        checkAuthStatus();
    };
    
    window.eliminarDelCarrito = async function(itemId) {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId);

        if (error) {
            alert('Error al eliminar del carrito: ' + error.message);
            return;
        }
        checkAuthStatus();
    };
    
    // --- Funciones Globales para Direcciones (Usando Supabase) ---
    
    window.eliminarDireccion = async function(index) {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('metadata').eq('id', user.id).single();
        if (!profile || !profile.metadata || !profile.metadata.addresses) return;

        let currentAddresses = profile.metadata.addresses;
        currentAddresses.splice(index, 1);
        
        const { error } = await supabase
            .from('profiles')
            .update({
                metadata: {
                    ...profile.metadata,
                    addresses: currentAddresses
                }
            })
            .eq('id', user.id);

        if (error) {
            alert('Error al eliminar la dirección: ' + error.message);
            return;
        }

        checkAuthStatus();
    };
    
    // --- Inicialización y Eventos ---
    
    function inicializarEventosPerfil(user) {
        // Navegación entre secciones (sin cambios)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const target = this.getAttribute('href').substring(1);
                seccionActiva = target;
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.perfil-seccion').forEach(seccion => {
                    seccion.classList.remove('active');
                });
                document.getElementById(target).classList.add('active');
            });
        });
        
        // Formularios (usan las nuevas funciones Supabase)
        document.getElementById('form-info-personal').addEventListener('submit', function(e) {
            e.preventDefault();
            guardarInformacionPersonal(user);
        });
        
        document.getElementById('form-direccion').addEventListener('submit', function(e) {
            e.preventDefault();
            guardarDireccion(user);
        });
        
        document.getElementById('form-cambiar-password').addEventListener('submit', function(e) {
            e.preventDefault();
            cambiarPassword(user);
        });
        
        document.getElementById('eliminar-cuenta').addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                eliminarCuenta(user);
            }
        });
        
        // Botones de mostrar/ocultar formulario de dirección (sin cambios)
        document.getElementById('agregar-direccion').addEventListener('click', function() {
            document.getElementById('form-direccion').style.display = 'block';
            this.style.display = 'none';
        });
        document.getElementById('cancelar-direccion').addEventListener('click', function() {
            document.getElementById('form-direccion').style.display = 'none';
            document.getElementById('agregar-direccion').style.display = 'inline-block';
            document.getElementById('form-direccion').reset();
        });

        // Botón de Proceder al Pago (Lógica de Supabase TBD - Por ahora solo simulación)
        const procederPagoBtn = document.getElementById('proceder-pago');
        if (procederPagoBtn) {
             procederPagoBtn.addEventListener('click', function() {
                 alert('Redirigiendo a checkout.html. ¡El proceso de pago y creación de pedidos debe implementarse usando Supabase y posiblemente Railway!');
                 window.location.href = 'checkout.html';
             });
        }
    }
    
    // Inicializar la carga de la página
    checkAuthStatus();
});