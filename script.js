// Importa solo la 'db' y las funciones de firestore que necesitamos
import { db, collection, getDocs, query, orderBy } from './firebase-init.js';

// Ya no necesitamos esto:
// import { productosIniciales } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Inicia la carga de productos desde Firebase
    cargarProductosDesdeFirebase();

    // Lógica del menú hamburguesa (igual que antes)
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
});


// Nueva función para cargar desde Firebase
async function cargarProductosDesdeFirebase() {
    const listaProductos = document.getElementById('products-list');
    if (!listaProductos) return; // Salir si no estamos en index.html

    listaProductos.innerHTML = '<p class="loader">Cargando productos...</p>';

    try {
        // Crea una consulta para 'productos' ordenados por 'nombre'
        const q = query(collection(db, 'productos'), orderBy('nombre'));
        const snapshot = await getDocs(q);
        
        listaProductos.innerHTML = ''; // Limpiar "Cargando..."

        if (snapshot.empty) {
            listaProductos.innerHTML = '<p class="loader">No hay productos disponibles en este momento.</p>';
            return;
        }

        // Itera sobre los documentos y crea las tarjetas
        snapshot.forEach(doc => {
            const producto = doc.data();
            producto.id = doc.id; // El ID de Firestore
            
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // Misma plantilla de tarjeta que tenías
            productCard.innerHTML = `
                <img src="${producto.imagen}" 
                     alt="${producto.nombre}" 
                     class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
                <div class="product-info">
                    <h3 class="product-title">${producto.nombre}</h3>
                    <p class="product-description">${producto.descripcion}</p>
                    <span class="product-price">${producto.precio}</span>
                    <a href="${producto.whatsapp}" class="btn-whatsapp" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-whatsapp"></i> Pedir
                    </a>
                </div>
            `;
            listaProductos.appendChild(productCard);
        });

    } catch (error) {
        console.error("Error cargando productos:", error);
        listaProductos.innerHTML = '<p class="loader">No se pudieron cargar los productos. Intenta de nuevo más tarde.</p>';
    }
}