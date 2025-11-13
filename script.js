// Importa las funciones de firestore que necesitamos
import { db, collection, getDocs, query, orderBy, where } from './firebase-init.js';

// --- NÚMERO DE WHATSAPP DEL NEGOCIO ---
//
// ¡¡¡IMPORTANTE!!!
// Reemplaza esto con el número de WhatsApp de tu cliente.
// Debe incluir el código de país (ej: 521XXXXXXXXXX para México).
// ¡SIN el símbolo '+' ni espacios ni guiones!
//
const WHATSAPP_NUMBER = "TU_NUMERO_AQUI_CON_CODIGO_DE_PAIS";
//
// ------------------------------------


document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Cargar las categorías (esto crea los botones de filtro)
    cargarCategoriasYFiltros();
    
    // 2. Cargar TODOS los productos al inicio
    cargarProductosDesdeFirebase(null); // 'null' significa "Todos"

    // Lógica del menú hamburguesa
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
});

// NUEVA FUNCIÓN para crear los filtros
async function cargarCategoriasYFiltros() {
    const filtersContainer = document.getElementById('category-filters');
    if (!filtersContainer) return;

    try {
        const q = query(collection(db, 'categorias'), orderBy('nombre'));
        const snapshot = await getDocs(q);
        
        // Botón "Todos" por defecto
        const btnTodos = document.createElement('button');
        btnTodos.className = 'filter-button active';
        btnTodos.textContent = 'Todos';
        btnTodos.onclick = () => {
            // Cargar productos sin filtro
            cargarProductosDesdeFirebase(null);
            // Manejar clase activa
            document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
            btnTodos.classList.add('active');
        };
        filtersContainer.appendChild(btnTodos);

        // Crear un botón por cada categoría
        snapshot.forEach(doc => {
            const categoria = doc.data();
            const categoriaId = doc.id; // <-- OBTENER EL ID
            
            const btn = document.createElement('button');
            btn.className = 'filter-button';
            btn.textContent = categoria.nombre;
            btn.onclick = () => {
                // Cargar productos filtrados por ID
                cargarProductosDesdeFirebase(categoriaId); // <-- PASAR EL ID
                // Manejar clase activa
                document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            filtersContainer.appendChild(btn);
        });

    } catch (error) {
        console.error("Error cargando categorías:", error);
        filtersContainer.innerHTML = '<p>No se pudieron cargar las categorías.</p>';
    }
}


// FUNCIÓN MODIFICADA para cargar productos (ahora filtra por categoriaId)
async function cargarProductosDesdeFirebase(filtroCategoriaId) {
    const listaProductos = document.getElementById('products-list');
    if (!listaProductos) return;

    // Validar que el número de WhatsApp esté puesto
    if (WHATSAPP_NUMBER === "TU_NUMERO_AQUI_CON_CODIGO_DE_PAIS") {
        console.error("Error: Falta configurar el número de WhatsApp en script.js");
        listaProductos.innerHTML = '<p class="loader">Error de configuración. Contacta al administrador.</p>';
        return;
    }

    listaProductos.innerHTML = '<p class="loader">Cargando productos...</p>';

    try {
        // --- LÓGICA DE FILTRADO (AHORA USA categoriaId) ---
        let q;
        if (filtroCategoriaId) {
            // Si hay un filtro, crea una consulta con 'where'
            q = query(collection(db, 'productos'), 
                      where("categoriaId", "==", filtroCategoriaId), // <-- CAMBIO
                      orderBy('nombre'));
        } else {
            // Si no hay filtro, trae todos
            q = query(collection(db, 'productos'), 
                      orderBy('nombre'));
        }
        // -------------------------

        const snapshot = await getDocs(q);
        
        listaProductos.innerHTML = ''; // Limpiar "Cargando..."

        if (snapshot.empty) {
            listaProductos.innerHTML = '<p class="loader">No hay productos en esta categoría.</p>';
            return;
        }

        // Itera sobre los documentos y crea las tarjetas
        snapshot.forEach(doc => {
            const producto = doc.data();
            producto.id = doc.id;
            
            // Construir el link de WhatsApp dinámicamente
            const mensajeWhatsApp = encodeURIComponent(`¡Hola! Me interesa el producto: ${producto.nombre}`);
            const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeWhatsApp}`;
            
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // Plantilla de tarjeta con el link dinámico
            productCard.innerHTML = `
                <img src="${producto.imagen}" 
                     alt="${producto.nombre}" 
                     class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
                <div class="product-info">
                    <h3 class="product-title">${producto.nombre}</h3>
                    <p class="product-description">${producto.descripcion}</p>
                    <span class="product-price">${producto.precio}</span>
                    <a href="${whatsappLink}" class="btn-whatsapp" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-whatsapp"></i> Pedir
                    </a>
                </div>
            `;
            listaProductos.appendChild(productCard);
        });

    } catch (error) {
        console.error("Error cargando productos:", error);
        // Este es el error que probablemente ves por el índice:
        if (error.code === 'failed-precondition') {
            listaProductos.innerHTML = '<p class="loader">Error: La base de datos necesita un índice. Abre F12 y sigue las instrucciones del error en la consola.</p>';
        } else {
            listaProductos.innerHTML = '<p class="loader">No se pudieron cargar los productos. Intenta de nuevo más tarde.</p>';
        }
    }
}