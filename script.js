// Esperar a que cargue el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que los productos existan antes de cargar
    if (window.productosData && Array.isArray(window.productosData)) {
        cargarProductos();
    } else {
        console.error('Error: No se pudieron cargar los productos. Verifica que data.js esté cargado correctamente.');
    }
});

// Función para cargar productos en la página
function cargarProductos() {
    const grid = document.getElementById('productsGrid');
    
    // Verificar que el elemento exista
    if (!grid) {
        console.error('Error: No se encontró el elemento productsGrid');
        return;
    }
    
    const productos = window.productosData;
    
    // Limpiar el grid antes de cargar (evita duplicados)
    grid.innerHTML = '';
    
    productos.forEach(producto => {
        const card = crearTarjetaProducto(producto);
        grid.appendChild(card);
    });
}

// Función para crear una tarjeta de producto
function crearTarjetaProducto(producto) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Número de WhatsApp (cambiar por el tuyo)
    const numeroWhatsApp = '526641122626';
    const mensajeWhatsApp = encodeURIComponent(producto.whatsapp);
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeWhatsApp}`;
    
    card.innerHTML = `
        <img src="${producto.imagen}" 
             alt="${producto.nombre}" 
             class="product-image"
             onerror="this.src='https://via.placeholder.com/300x250?text=Imagen+No+Disponible'">
        <div class="product-info">
            <h3 class="product-name">${producto.nombre}</h3>
            <p class="product-description">${producto.descripcion}</p>
            <div class="product-price">${producto.precio}</div>
            <a href="${urlWhatsApp}" 
               target="_blank" 
               class="product-btn">
                <i class="fab fa-whatsapp"></i> Ordenar por WhatsApp
            </a>
        </div>
    `;
    
    return card;
}

// Animación suave al hacer scroll (solo para enlaces internos)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});