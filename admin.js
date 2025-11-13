// Variables globales
let productoEditando = null;

// Obtener productos
function obtenerProductos() {
    const productos = localStorage.getItem('productos_agranel');
    return productos ? JSON.parse(productos) : [];
}

// Guardar productos
function guardarProductos(productos) {
    localStorage.setItem('productos_agranel', JSON.stringify(productos));
}

// Generar ID único
function generarId() {
    const productos = obtenerProductos();
    if (productos.length === 0) return 1;
    const maxId = Math.max(...productos.map(p => p.id));
    return maxId + 1;
}

// Cargar productos en el panel admin
function cargarProductosAdmin() {
    const lista = document.getElementById('adminProductsList');
    const productos = obtenerProductos();
    
    lista.innerHTML = '';
    
    if (productos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No hay productos. Agrega el primero!</p>';
        return;
    }
    
    productos.forEach(producto => {
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
                <button class="btn-edit" onclick="editarProducto(${producto.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete" onclick="confirmarEliminar(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        lista.appendChild(item);
    });
}

// Manejar el envío del formulario
document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const producto = {
        id: productoEditando || generarId(),
        nombre: document.getElementById('productName').value.trim(),
        descripcion: document.getElementById('productDescription').value.trim(),
        precio: document.getElementById('productPrice').value.trim(),
        imagen: document.getElementById('productImage').value.trim(),
        whatsapp: document.getElementById('productWhatsapp').value.trim()
    };
    
    let productos = obtenerProductos();
    
    if (productoEditando) {
        // Actualizar producto existente
        const index = productos.findIndex(p => p.id === productoEditando);
        if (index !== -1) {
            productos[index] = producto;
            mostrarMensaje('Producto actualizado correctamente', 'success');
        }
    } else {
        // Agregar nuevo producto
        productos.push(producto);
        mostrarMensaje('Producto agregado correctamente', 'success');
    }
    
    guardarProductos(productos);
    cargarProductosAdmin();
    limpiarFormulario();
});

// Editar producto
function editarProducto(id) {
    const productos = obtenerProductos();
    const producto = productos.find(p => p.id === id);
    
    if (!producto) return;
    
    productoEditando = id;
    
    document.getElementById('productId').value = producto.id;
    document.getElementById('productName').value = producto.nombre;
    document.getElementById('productDescription').value = producto.descripcion;
    document.getElementById('productPrice').value = producto.precio;
    document.getElementById('productImage').value = producto.imagen;
    document.getElementById('productWhatsapp').value = producto.whatsapp;
    
    document.getElementById('formTitle').textContent = 'Editar Producto';
    document.querySelector('.btn-cancel').style.display = 'inline-flex';
    
    // Scroll al formulario
    document.querySelector('.admin-form-container').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Confirmar eliminación
function confirmarEliminar(id, nombre) {
    if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
        eliminarProducto(id);
    }
}

// Eliminar producto
function eliminarProducto(id) {
    let productos = obtenerProductos();
    productos = productos.filter(p => p.id !== id);
    
    guardarProductos(productos);
    cargarProductosAdmin();
    mostrarMensaje('Producto eliminado correctamente', 'success');
}

// Cancelar edición
function cancelarEdicion() {
    limpiarFormulario();
}

// Limpiar formulario
function limpiarFormulario() {
    productoEditando = null;
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
    document.querySelector('.btn-cancel').style.display = 'none';
}

// Mostrar mensaje temporal
function mostrarMensaje(texto, tipo) {
    // Crear elemento de mensaje
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
        z-index: 1000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(mensaje);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        mensaje.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => mensaje.remove(), 300);
    }, 3000);
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .btn-cancel {
        display: none;
    }
`;
document.head.appendChild(style);

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarProductosAdmin();
});