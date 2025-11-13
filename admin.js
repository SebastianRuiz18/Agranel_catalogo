// Importa las funciones y servicios de nuestro archivo init
import { 
    auth, db, 
    GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
    collection, getDocs, doc, setDoc, addDoc, deleteDoc, getDoc, orderBy, query
} from './firebase-init.js';

// --- ATENCIÓN ---
// Pon aquí el email de la persona que podrá administrar
// Puedes agregar más separándolos con comas
const ADMIN_EMAIL = "email-de-tu-cliente@gmail.com";
// ----------------

// Variables globales
let productoEditando = null;

// --- INICIO DE LÓGICA DE AUTENTICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    
    const btnLogin = document.getElementById('btnLoginGoogle');
    const btnLogout = document.getElementById('btnLogout');
    const adminPanel = document.getElementById('adminPanel');
    const loginContainer = document.getElementById('loginContainer');

    // Escucha cambios en el estado de autenticación
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario está logueado
            if (user.email === ADMIN_EMAIL) {
                // Usuario es EL ADMIN
                console.log('Admin conectado:', user.displayName);
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
    btnLogout.addEventListener('click', () => {
        signOut(auth);
    });

    // Manejador del formulario (movido aquí)
    document.getElementById('productForm').addEventListener('submit', manejarSubmitFormulario);
});
// --- FIN DE LÓGICA DE AUTENTICACIÓN ---


// Cargar productos en el panel admin (VERSIÓN FIREBASE)
async function cargarProductosAdmin() {
    const lista = document.getElementById('adminProductsList');
    lista.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Cargando productos...</p>';
    
    try {
        const q = query(collection(db, 'productos'), orderBy('nombre'));
        const snapshot = await getDocs(q);
        
        lista.innerHTML = ''; // Limpiar "Cargando..."
        
        if (snapshot.empty) {
            lista.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No hay productos. Agrega el primero!</p>';
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
        lista.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Error al cargar productos.</p>';
    }
}

// Manejar el envío del formulario (VERSIÓN FIREBASE)
async function manejarSubmitFormulario(e) {
    e.preventDefault();
    
    const producto = {
        nombre: document.getElementById('productName').value.trim(),
        descripcion: document.getElementById('productDescription').value.trim(),
        precio: document.getElementById('productPrice').value.trim(),
        imagen: document.getElementById('productImage').value.trim(),
        whatsapp: document.getElementById('productWhatsapp').value.trim()
    };
    
    // Validación simple
    if (!producto.nombre || !producto.precio || !producto.imagen || !producto.whatsapp) {
        mostrarMensaje('Por favor, completa todos los campos requeridos.', 'error');
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
        document.getElementById('productWhatsapp').value = producto.whatsapp;
        
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
    if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
        eliminarProducto(id);
    }
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
    mensaje.className = `admin-message ${tipo}`; // Usa clases de styles.css si existen, o aplica estilos
    mensaje.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${tipo === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => mensaje.remove(), 300);
    }, 3000);
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
        display: none;
    }
`;
document.head.appendChild(style);