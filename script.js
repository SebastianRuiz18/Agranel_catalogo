// Productos iniciales por defecto
const productosIniciales = [
    {
        id: 1,
        nombre: "Cajita de Mixito",
        descripcion: "Cajita de arándano, mango y fresa deshidratados, 150 gramos.",
        precio: "$55.00",
        imagen: "https://scontent.ftij1-3.fna.fbcdn.net/v/t39.30808-6/471991157_18364225666139318_1021640595118084011_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHa0IPL9gcp_JB9VDEN1KK88T6WE25t5gvxPpYTbm3mC6vRkh5ULQAapfBqSQFA0r0CPmefI1-tF8If44GBm55w&_nc_ohc=_Rm_pxEWP2QQ7kNvwGVm5Pu&_nc_oc=AdkZRuOHSMKUodMBxVpqqKrbzBeY3OpaJTWwtH3YwpdQ0XVv4TZTsXCFTir4gHdM18o&_nc_zt=23&_nc_ht=scontent.ftij1-3.fna&_nc_gid=h8gZc5_ce_GDoMLbJ3UUAw&oh=00_AfjD0F071DJddDtbYruT5zrJXRMMiuBevJDQhdRTa09BMg&oe=69105797",
        whatsapp: "Hola! Me interesa la Cajita de Mixito"
    },
    {
        id: 2,
        nombre: "Churros: Amaranto Limón",
        descripcion: "Churros sabor amaranto con toque de limón, 500 gramos.",
        precio: "$135.00",
        imagen: "https://scontent.ftij1-3.fna.fbcdn.net/v/t39.30808-6/481216141_1111851107620098_4557484976522669637_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHZAVvjUBCOC0lTwMrB-zMqnlwLjg5f9RqeXAuODl_1Gqkaw-Yhg61GsUuUugl0wNWyaGn_VCo2xJZ0ouw524cj&_nc_ohc=7-jDzwCSeOIQ7kNvwE1e6Q_&_nc_oc=AdlCZ4oGJ-BxGZW1KkHJrkFHop0f2V1hvC48I0T1FtKRodemCoOkEPtz17plUXNzNKQ&_nc_zt=23&_nc_ht=scontent.ftij1-3.fna&_nc_gid=0DIyPm7UMDnZY0UP2ncQAg&oh=00_Afi8kkFCUNk4asevrsLfiWEyoB3ZfXpHujCPchXgAab3UQ&oe=69106063",
        whatsapp: "Hola! Me interesan los Churros: Amaranto Limón"
    }
];

// Inicializar productos si no existen
function inicializarProductos() {
    if (!localStorage.getItem('productos_agranel')) {
        localStorage.setItem('productos_agranel', JSON.stringify(productosIniciales));
    }
}

// Obtener productos desde localStorage
function obtenerProductos() {
    const productos = localStorage.getItem('productos_agranel');
    return productos ? JSON.parse(productos) : [];
}

// Cargar productos en la página
function cargarProductos() {
    const grid = document.getElementById('productsGrid');
    
    if (!grid) {
        console.error('Error: No se encontró el elemento productsGrid');
        return;
    }
    
    const productos = obtenerProductos();
    
    // Limpiar el grid
    grid.innerHTML = '';
    
    if (productos.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 3rem;">No hay productos disponibles.</p>';
        return;
    }
    
    productos.forEach(producto => {
        const card = crearTarjetaProducto(producto);
        grid.appendChild(card);
    });
}

// Crear tarjeta de producto
function crearTarjetaProducto(producto) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const numeroWhatsApp = '526641122626';
    const mensajeWhatsApp = encodeURIComponent(producto.whatsapp);
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeWhatsApp}`;
    
    card.innerHTML = `
        <img src="${producto.imagen}" 
             alt="${producto.nombre}" 
             class="product-image"
             onerror="this.src='https://via.placeholder.com/300x250?text=Imagen+No+Disponible'"
             loading="lazy">
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

// Animación suave al hacer scroll
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

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    inicializarProductos();
    cargarProductos();
});