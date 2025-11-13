// Importa las funciones y servicios de nuestro archivo init
import { 
    auth, db, 
    GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
    collection, getDocs, doc, setDoc, addDoc, deleteDoc, getDoc, orderBy, query
} from './firebase-init.js';

// --- ATENCIÓN ---
// Email autorizado para administrar.
const ADMIN_EMAIL = "seruci93@gmail.com";
// ----------------

// Variables globales
let productoEditando = null;

// --- INICIO DE LÓGICA DE AUTENTICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    
    const btnLogin = document.getElementById('btnLoginGoogle');
    const btnLogout = document.getElementById('btnLogout');
    const adminPanel = document.getElementById('adminPanel');
    const loginContainer = document.getElementById('loginContainer');
    
    // Si algún elemento no existe (p.ej. en index.html), no hagas nada
    if (!btnLogin || !adminPanel || !loginContainer) return;

    // Escucha cambios en el estado de autenticación
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario está logueado
            if (user.email === ADMIN_EMAIL) {
                // Usuario es EL ADMIN
                console.log('Admin conectado:', user.displayName);
                document.body.classList.remove('login-page-body'); // Quita fondo centrado
                adminPanel.style.display = 'block';
                loginContainer.style.display = 'none';
                // Ahora que sabemos que es admin, cargamos los productos
                cargarProductosAdmin();
            } else {
                // Usuario logueado, pero no es admin
                mostrarMensaje('No tienes permisos para acceder a este panel.', 'error');
                signOut(auth); // Lo desconectamos
            }
        } else {
            // Usuario no está logueado
            console.log('Usuario desconectado.');
            document.body.classList.add('login-page-body'); // Pone fondo centrado
            adminPanel.style.display = 'none';
            loginContainer.style.display = 'block';
        }
    });

    // Manejador del botón de Login
    btnLogin.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .catch((error) => console.error('Error en login:', error));
    });

    // Manejador del botón de Logout
    if(btnLogout) {
        btnLogout.addEventListener('click', () => {
            signOut(auth);
        });
    }

    // Manejador del formulario
    document.getElementById('productForm').addEventListener('submit', manejarSubmitFormulario);
});
// --- FIN DE LÓGICA DE AUTENTICACIÓN ---


// Cargar productos en el panel admin (VERSIÓN FIREBASE)
async function cargarProductosAdmin() {
    const lista = document.getElementById('adminProductsList');
    lista.innerHTML = '<p style="text-align: center; color: var(--text-dark); padding: 2rem;">Cargando productos...</p>';
    
    try {
        const q = query(collection(db, 'productos'), orderBy('nombre'));
        const snapshot = await getDocs(q);
        
        lista.innerHTML = ''; // Limpiar "Cargando..."
        
        if (snapshot.empty) {
            lista.innerHTML = '<p style="text-align: center; color: var(--text-dark); padding: 2rem;">No hay productos. Agrega el primero!</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const producto = doc.data();
            producto.id = doc.id;
            
            const item = document.createElement('div');
            item.className = 'admin-product-item';
            
            item.innerHTML = `
                <img src="${producto.imagen}" 
                     alt="${producto.nombre}" 
                     class="admin-product-image"
                     onerror="this.src='https://via.placeholder.com/120x100?text=Sin+Imagen'">
                <div class="admin-product-info">
                    <h4>${producto.nombre}</h4>
                    <p>${producto.descripcion}</p>
                    <div class="admin-product-price">${producto.precio}</div>
                </div>
                <div class="admin-product-actions">
                    <button class="btn-edit" data-id="${producto.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" data-id="${producto.id}" data-nombre="${producto.nombre.replace(/'/g, "\\'")}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
            lista.appendChild(item);
        });

        // Añadir event listeners a los botones creados
        lista.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editarProducto(btn.dataset.id));
        });
        lista.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => confirmarEliminar(btn.dataset.id, btn.dataset.nombre));
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
        lista.innerHTML = '<p style="text-align: center; color: var(--text-dark); padding: 2rem;">Error al cargar productos.</p>';
    }
}

// Manejar el envío del formulario (VERSIÓN FIREBASE)
async function manejarSubmitFormulario(e) {
    e.preventDefault();
    
    // Objeto producto ya no incluye 'whatsapp'
    const producto = {
        nombre: document.getElementById('productName').value.trim(),
        descripcion: document.getElementById('productDescription').value.trim(),
        precio: document.getElementById('productPrice').value.trim(),
        imagen: document.getElementById('productImage').value.trim()
    };
    
    // Validación (ya no incluye 'whatsapp')
    if (!producto.nombre || !producto.precio || !producto.imagen) {
        mostrarMensaje('Por favor, completa nombre, precio e imagen.', 'error');
        return;
    }

    try {
        if (productoEditando) {
            // Actualizar producto existente
            const docRef = doc(db, 'productos', productoEditando);
            await setDoc(docRef, producto);
            mostrarMensaje('Producto actualizado correctamente', 'success');
        } else {
            // Agregar nuevo producto
            await addDoc(collection(db, 'productos'), producto);
            mostrarMensaje('Producto agregado correctamente', 'success');
        }
        
        cargarProductosAdmin();
        limpiarFormulario();

    } catch (error) {
        console.error("Error al guardar:", error);
        mostrarMensaje('Error al guardar el producto', 'error');
    }
}

// Editar producto (VERSIÓN FIREBASE)
async function editarProducto(id) {
    try {
        const docRef = doc(db, 'productos', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            mostrarMensaje('Error: No se encontró el producto.', 'error');
            return;
        }
        
        const producto = docSnap.data();
        
        productoEditando = id;
        
        document.getElementById('productName').value = producto.nombre;
        document.getElementById('productDescription').value = producto.descripcion;
        document.getElementById('productPrice').value = producto.precio;
        document.getElementById('productImage').value = producto.imagen;
        // document.getElementById('productWhatsapp').value = producto.whatsapp; // ELIMINADO
        
        document.getElementById('formTitle').textContent = 'Editar Producto';
        document.querySelector('.btn-cancel').style.display = 'inline-flex';
        
        document.querySelector('.admin-form-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    
    } catch (error) {
        console.error("Error al obtener producto:", error);
        mostrarMensaje('Error al cargar el producto para editar.', 'error');
    }
}

// Confirmar eliminación
function confirmarEliminar(id, nombre) {
    // Usamos un modal personalizado en lugar de confirm()
    mostrarConfirmacion(`¿Estás seguro de eliminar "${nombre}"?`, () => {
        eliminarProducto(id);
    });
}

// Eliminar producto (VERSIÓN FIREBASE)
async function eliminarProducto(id) {
    try {
        await deleteDoc(doc(db, 'productos', id));
        mostrarMensaje('Producto eliminado correctamente', 'success');
        cargarProductosAdmin();
    } catch (error) {
        console.error("Error al eliminar:", error);
        mostrarMensaje('Error al eliminar el producto', 'error');
    }
}

// Cancelar edición (expuesto globalmente)
window.cancelarEdicion = function() {
    limpiarFormulario();
}

// Limpiar formulario
function limpiarFormulario() {
    productoEditando = null;
    document.getElementById('productForm').reset();
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
    document.querySelector('.btn-cancel').style.display = 'none';
}

// Mostrar mensaje temporal
function mostrarMensaje(texto, tipo) {
    const mensaje = document.createElement('div');
    mensaje.textContent = texto;
    mensaje.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${tipo === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1050;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => mensaje.remove(), 300);
    }, 3000);
}

// Mostrar modal de confirmación (reemplazo de confirm())
function mostrarConfirmacion(texto, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 1010;
        display: flex; align-items: center; justify-content: center;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white; padding: 2rem; border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2); max-width: 400px;
        text-align: center; font-family: var(--font-body);
    `;
    
    const p = document.createElement('p');
    p.textContent = texto;
    p.style.cssText = 'font-size: 1.1rem; color: #333; margin-bottom: 1.5rem;';
    
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 1rem; justify-content: center;';
    
    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Eliminar';
    btnConfirm.className = 'btn-delete'; // Reusa tu clase de botón
    btnConfirm.style.cssText = 'background-color: #d9534f; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: var(--font-body); font-size: 0.9rem;';
    
    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancelar';
    btnCancel.className = 'btn-cancel'; // Reusa tu clase de botón
    btnCancel.style.cssText = 'background-color: #999; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: var(--font-body); font-size: 0.9rem;';
    
    btnConfirm.onclick = () => {
        onConfirm();
        document.body.removeChild(overlay);
    };
    
    btnCancel.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    actions.appendChild(btnCancel);
    actions.appendChild(btnConfirm);
    modal.appendChild(p);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Agregar animaciones CSS (si no están en styles.css)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .btn-cancel {
        display: none; /* Oculta el de cancelar por defecto */
    }
    .form-actions .btn-cancel {
        display: inline-flex; /* Muestra el del formulario */
    }
`;
document.head.appendChild(style);