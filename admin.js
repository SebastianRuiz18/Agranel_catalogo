// Importa las funciones y servicios de nuestro archivo init
import { 
    auth, db, 
    GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
    collection, getDocs, doc, setDoc, addDoc, deleteDoc, getDoc, orderBy, query,
    where // <--- Función 'where' importada
} from './firebase-init.js';

// --- ATENCIÓN ---
// Email autorizado para administrar.
const ADMIN_EMAIL = "seruci93@gmail.com";
// ----------------

// Variables globales
let productoEditando = null;
let categoriasCache = new Map(); // Cache para tener ID y Nombre

// --- INICIO DE LÓGICA DE AUTENTICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    
    const btnLogin = document.getElementById('btnLoginGoogle');
    const btnLogout = document.getElementById('btnLogout');
    const adminPanel = document.getElementById('adminPanel');
    const loginContainer = document.getElementById('loginContainer');
    
    if (!btnLogin || !adminPanel || !loginContainer) return;

    // Escucha cambios en el estado de autenticación
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (user.email === ADMIN_EMAIL) {
                console.log('Admin conectado:', user.displayName);
                document.body.classList.remove('login-page-body');
                adminPanel.style.display = 'block';
                loginContainer.style.display = 'none';
                
                // Cargar categorías y luego productos
                cargarYMostrarCategorias(); 

            } else {
                mostrarMensaje('No tienes permisos para acceder a este panel.', 'error');
                signOut(auth);
            }
        } else {
            console.log('Usuario desconectado.');
            document.body.classList.add('login-page-body');
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

    // Manejador del formulario de PRODUCTO
    document.getElementById('productForm').addEventListener('submit', manejarSubmitFormulario);
    
    // Manejador del formulario de CATEGORÍA
    document.getElementById('categoryForm').addEventListener('submit', guardarNuevaCategoria);
});
// --- FIN DE LÓGICA DE AUTENTICACIÓN ---


// ======================================================
// === NUEVA SECCIÓN: ADMINISTRACIÓN DE CATEGORÍAS ===
// ======================================================

async function cargarYMostrarCategorias() {
    const categoryList = document.getElementById('categoryList');
    const productCategorySelect = document.getElementById('productCategory');
    
    categoryList.innerHTML = '<p>Cargando...</p>';
    
    // Guardar el valor seleccionado (si hay uno) para no perderlo
    const valorPrevio = productCategorySelect.value;
    productCategorySelect.innerHTML = '<option value="">-- Seleccionar Categoría --</option>';
    categoriasCache.clear(); // Limpiar cache

    try {
        const q = query(collection(db, 'categorias'), orderBy('nombre'));
        const snapshot = await getDocs(q);
        
        categoryList.innerHTML = ''; // Limpiar
        
        if (snapshot.empty) {
            categoryList.innerHTML = '<p>No hay categorías.</p>';
        }

        snapshot.forEach(doc => {
            const categoria = doc.data();
            const categoriaId = doc.id;
            
            // Guardar en cache
            categoriasCache.set(categoriaId, categoria.nombre);
            
            // 1. Llenar la lista de "Administrar Categorías" (CON INPUTS Y BOTONES)
            const item = document.createElement('div');
            item.className = 'category-list-item';
            item.id = `cat-item-${categoriaId}`; // ID para encontrarlo
            item.innerHTML = `
                <input type="text" value="${categoria.nombre}" class="category-input" data-id="${categoriaId}" disabled>
                
                <button class="btn-edit-category" data-id="${categoriaId}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-save-category" data-id="${categoriaId}" title="Guardar" style="display: none;">
                    <i class="fas fa-save"></i>
                </button>
                <button class="btn-delete-category" data-id="${categoriaId}" data-nombre="${categoria.nombre}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            categoryList.appendChild(item);
            
            // 2. Llenar el dropdown del formulario de productos (CON ID!)
            const option = document.createElement('option');
            option.value = categoriaId; // <-- Guardamos el ID
            option.textContent = categoria.nombre; // <-- Mostramos el Nombre
            productCategorySelect.appendChild(option);
        });

        // Añadir event listeners a los botones de la lista
        categoryList.querySelectorAll('.btn-edit-category').forEach(btn => {
            btn.addEventListener('click', () => habilitarEdicionCategoria(btn.dataset.id));
        });
        categoryList.querySelectorAll('.btn-save-category').forEach(btn => {
            btn.addEventListener('click', () => guardarEdicionCategoria(btn.dataset.id));
        });
        categoryList.querySelectorAll('.btn-delete-category').forEach(btn => {
            btn.addEventListener('click', () => confirmarEliminarCategoria(btn.dataset.id, btn.dataset.nombre));
        });

        // Restaurar el valor previo del select
        productCategorySelect.value = valorPrevio;

        // AHORA QUE TENEMOS LAS CATEGORÍAS, CARGAMOS LOS PRODUCTOS
        cargarProductosAdmin();

    } catch (error) {
        console.error("Error al cargar categorías:", error);
        mostrarMensaje('Error al cargar categorías', 'error');
    }
}

async function guardarNuevaCategoria(e) {
    e.preventDefault();
    const input = document.getElementById('categoryName');
    const nombreCategoria = input.value.trim();
    
    if (!nombreCategoria) return;

    try {
        await addDoc(collection(db, 'categorias'), {
            nombre: nombreCategoria
        });
        mostrarMensaje('Categoría agregada', 'success');
        input.value = '';
        cargarYMostrarCategorias(); // Recargar todo
    } catch (error) {
        console.error("Error guardando categoría:", error);
        mostrarMensaje('Error al guardar categoría', 'error');
    }
}

// --- NUEVAS FUNCIONES DE EDICIÓN ---
function habilitarEdicionCategoria(id) {
    const item = document.getElementById(`cat-item-${id}`);
    const input = item.querySelector('.category-input');
    
    input.disabled = false;
    input.focus();
    
    item.querySelector('.btn-edit-category').style.display = 'none';
    item.querySelector('.btn-delete-category').style.display = 'none';
    item.querySelector('.btn-save-category').style.display = 'inline-flex';
}

async function guardarEdicionCategoria(id) {
    const item = document.getElementById(`cat-item-${id}`);
    const input = item.querySelector('.category-input');
    const nuevoNombre = input.value.trim();
    
    if (!nuevoNombre) {
        mostrarMensaje('El nombre no puede estar vacío', 'error');
        return;
    }

    try {
        const docRef = doc(db, 'categorias', id);
        await setDoc(docRef, { nombre: nuevoNombre }); // setDoc actualiza o sobrescribe
        
        mostrarMensaje('Categoría actualizada', 'success');
        
        // Recargar todo para que se actualice el dropdown
        cargarYMostrarCategorias();

    } catch (error) {
        console.error("Error actualizando categoría:", error);
        mostrarMensaje('Error al actualizar', 'error');
    }
}

// --- BORRADO MÁS SEGURO ---
async function confirmarEliminarCategoria(id, nombre) {
    // Paso 1: Revisar si hay productos usando esta categoría
    try {
        const q = query(collection(db, 'productos'), where("categoriaId", "==", id));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            // Si hay productos, NO DEJAR BORRAR
            mostrarMensaje(`Error: No se puede borrar "${nombre}". Hay ${snapshot.size} productos usándola.`, 'error');
        } else {
            // Si está vacía, preguntar
            mostrarConfirmacion(`¿Seguro que quieres eliminar "${nombre}"?`, () => {
                eliminarCategoria(id);
            });
        }
    } catch (error) {
        console.error("Error al verificar productos:", error);
        mostrarMensaje('Error al verificar productos', 'error');
    }
}

async function eliminarCategoria(id) {
    try {
        await deleteDoc(doc(db, 'categorias', id));
        mostrarMensaje('Categoría eliminada', 'success');
        cargarYMostrarCategorias(); // Recargar todo
    } catch (error) {
        console.error("Error eliminando categoría:", error);
        mostrarMensaje('Error al eliminar categoría', 'error');
    }
}


// ======================================================
// === SECCIÓN: ADMINISTRACIÓN DE PRODUCTOS (REFACTORIZADO) ===
// ======================================================

// Cargar productos en el panel admin
async function cargarProductosAdmin() {
    const lista = document.getElementById('adminProductsList');
    lista.innerHTML = '<p style="text-align: center; color: var(--text-dark); padding: 2rem;">Cargando productos...</p>';
    
    try {
        const q = query(collection(db, 'productos'), orderBy('nombre'));
        const snapshot = await getDocs(q);
        
        lista.innerHTML = '';
        
        if (snapshot.empty) {
            lista.innerHTML = '<p style="text-align: center; color: var(--text-dark); padding: 2rem;">No hay productos.</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const producto = doc.data();
            producto.id = doc.id;
            
            // Usar el cache para obtener el nombre de la categoría
            const nombreCategoria = categoriasCache.get(producto.categoriaId) || 'Sin Categoría';
            
            const item = document.createElement('div');
            item.className = 'admin-product-item';
            
            item.innerHTML = `
                <img src="${producto.imagen}" 
                     alt="${producto.nombre}" 
                     class="admin-product-image"
                     onerror="this.src='https://via.placeholder.com/120x100?text=Sin+Imagen'">
                <div class="admin-product-info">
                    <h4>${producto.nombre}</h4>
                    <p class="admin-product-category">${nombreCategoria}</p>
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

        // Añadir event listeners a los botones
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

// Manejar el envío del formulario
async function manejarSubmitFormulario(e) {
    e.preventDefault();
    
    // Objeto producto AHORA USA 'categoriaId'
    const producto = {
        categoriaId: document.getElementById('productCategory').value.trim(),
        nombre: document.getElementById('productName').value.trim(),
        descripcion: document.getElementById('productDescription').value.trim(),
        precio: document.getElementById('productPrice').value.trim(),
        imagen: document.getElementById('productImage').value.trim()
    };
    
    // Validación (AHORA USA 'categoriaId')
    if (!producto.categoriaId) {
        mostrarMensaje('Por favor, selecciona una categoría.', 'error');
        return;
    }
    if (!producto.nombre || !producto.precio || !producto.imagen) {
        mostrarMensaje('Por favor, completa nombre, precio e imagen.', 'error');
        return;
    }

    try {
        if (productoEditando) {
            // Actualizar
            const docRef = doc(db, 'productos', productoEditando);
            await setDoc(docRef, producto);
            mostrarMensaje('Producto actualizado correctamente', 'success');
        } else {
            // Agregar
            await addDoc(collection(db, 'productos'), producto);
            mostrarMensaje('Producto agregado correctamente', 'success');
        }
        
        cargarProductosAdmin(); // Recargar lista de productos
        limpiarFormulario();

    } catch (error) {
        console.error("Error al guardar:", error);
        mostrarMensaje('Error al guardar el producto', 'error');
    }
}

// Editar producto
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
        
        // Llenar el formulario con los datos del producto
        document.getElementById('productCategory').value = producto.categoriaId; // <-- CAMPO USA ID
        document.getElementById('productName').value = producto.nombre;
        document.getElementById('productDescription').value = producto.descripcion;
        document.getElementById('productPrice').value = producto.precio;
        document.getElementById('productImage').value = producto.imagen;
        
        document.getElementById('formTitle').textContent = 'Editar Producto';
        document.querySelector('.btn-cancel').style.display = 'inline-flex';
        
        document.getElementById('productFormContainer').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    
    } catch (error) {
        console.error("Error al obtener producto:", error);
        mostrarMensaje('Error al cargar el producto para editar.', 'error');
    }
}

// Limpiar formulario
function limpiarFormulario() {
    productoEditando = null;
    document.getElementById('productForm').reset();
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
    document.querySelector('.btn-cancel').style.display = 'none';
}


// --- FUNCIONES DE UTILIDAD (SIN CAMBIOS) ---

// Confirmar eliminación de PRODUCTO
function confirmarEliminar(id, nombre) {
    mostrarConfirmacion(`¿Estás seguro de eliminar "${nombre}"?`, () => {
        eliminarProducto(id);
    });
}

// Eliminar producto
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

// Mostrar modal de confirmación
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
    btnConfirm.textContent = 'Confirmar'; // Texto genérico
    btnConfirm.className = 'btn-delete';
    btnConfirm.style.cssText = 'background-color: #d9534f; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: var(--font-body); font-size: 0.9rem;';
    
    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancelar';
    btnCancel.className = 'btn-cancel';
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

// Agregar animaciones CSS
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
    .form-actions .btn-cancel {
        display: inline-flex;
    }
`;
document.head.appendChild(style);