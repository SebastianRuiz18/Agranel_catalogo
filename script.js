// Importa las funciones de firestore que necesitamos
import { db, collection, getDocs, query, orderBy, where } from './firebase-init.js';

// --- NÚMERO DE WHATSAPP DEL NEGOCIO ---
//
// ¡¡¡IMPORTANTE!!!
// Reemplaza esto con el número de WhatsApp de tu cliente.
// Debe incluir el código de país (ej: 521XXXXXXXXXX para México).
// ¡SIN el símbolo '+' ni espacios ni guiones!
//
const WHATSAPP_NUMBER = "5216641122626";
//
// ------------------------------------

// Cache global para categorías (ID -> Nombre)
const categoriasCache = new Map();


document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Cargar las categorías (esto crea los filtros Y llena el cache)
    cargarCategoriasYFiltros();
    
    // 2. Cargar los productos DESTACADOS
    cargarProductosDestacados();

    // 3. Cargar TODOS los productos al inicio
    cargarProductosDelCatalogo(null); // 'null' significa "Todos"

    // Lógica del menú hamburguesa
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
});


// --- LÓGICA DE CARGA DE DATOS ---

async function cargarCategoriasYFiltros() {
    const filtersContainer = document.getElementById('category-filters');
    if (!filtersContainer) return;

    try {
        const q = query(collection(db, 'categorias'), orderBy('nombre'));
        const snapshot = await getDocs(q);
        
        // Limpiar cache y filtros
        categoriasCache.clear();
        filtersContainer.innerHTML = '';
        
        // Botón "Todos" por defecto
        const btnTodos = document.createElement('button');
        btnTodos.className = 'filter-button active';
        btnTodos.textContent = 'Todos';
        btnTodos.onclick = () => {
            cargarProductosDelCatalogo(null);
            setActiveFilter(btnTodos);
        };
        filtersContainer.appendChild(btnTodos);

        // Crear un botón por cada categoría
        snapshot.forEach(doc => {
            const categoria = doc.data();
            const categoriaId = doc.id;
            
            // Llenar cache
            categoriasCache.set(categoriaId, categoria.nombre);
            
            const btn = document.createElement('button');
            btn.className = 'filter-button';
            btn.textContent = categoria.nombre;
            btn.onclick = () => {
                cargarProductosDelCatalogo(categoriaId);
                setActiveFilter(btn);
            };
            filtersContainer.appendChild(btn);
        });

    } catch (error) {
        console.error("Error cargando categorías:", error);
        filtersContainer.innerHTML = '<p>No se pudieron cargar las categorías.</p>';
    }
}

// ¡NUEVO! Cargar solo productos destacados
async function cargarProductosDestacados() {
    const featuredSection = document.getElementById('featured-section');
    const featuredList = document.getElementById('featured-products-list');
    if (!featuredList || !featuredSection) return;

    try {
        const q = query(collection(db, 'productos'), 
                      where("destacado", "==", true), 
                      orderBy('nombre'));
        
        const snapshot = await getDocs(q);
        
        featuredList.innerHTML = ''; // Limpiar

        if (snapshot.empty) {
            featuredSection.style.display = 'none'; // Ocultar la sección si no hay nada
            return;
        }

        featuredSection.style.display = 'block'; // Mostrar la sección
        
        snapshot.forEach(doc => {
            const producto = doc.data();
            producto.id = doc.id;
            const productCard = createProductCard(producto); // Reutilizar la función
            featuredList.appendChild(productCard);
        });

    } catch (error) {
        console.error("Error cargando productos destacados:", error);
        // Este es el error que probablemente ves por el índice:
        if (error.code === 'failed-precondition') {
            featuredSection.style.display = 'block';
            featuredList.innerHTML = '<p class="loader">Error: La base de datos necesita un índice para "Destacados". Abre F12 y sigue las instrucciones del error en la consola.</p>';
        } else {
            featuredList.innerHTML = '<p class="loader">No se pudieron cargar los productos.</p>';
        }
    }
}


// Cargar productos del catálogo principal (filtrados)
async function cargarProductosDelCatalogo(filtroCategoriaId) {
    const listaProductos = document.getElementById('products-list');
    if (!listaProductos) return;

    listaProductos.innerHTML = '<p class="loader">Cargando productos...</p>';

    try {
        let q;
        if (filtroCategoriaId) {
            // Filtrar por categoría
            q = query(collection(db, 'productos'), 
                      where("categoriaId", "==", filtroCategoriaId), 
                      orderBy('nombre'));
        } else {
            // "Todos": Trae todos, ordenados por nombre
            q = query(collection(db, 'productos'), 
                      orderBy('nombre'));
        }

        const snapshot = await getDocs(q);
        
        listaProductos.innerHTML = ''; // Limpiar "Cargando..."

        if (snapshot.empty) {
            listaProductos.innerHTML = '<p class="loader">No hay productos en esta categoría.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const producto = doc.data();
            producto.id = doc.id;
            const productCard = createProductCard(producto); // Reutilizar la función
            listaProductos.appendChild(productCard);
        });

    } catch (error) {
        console.error("Error cargando productos del catálogo:", error);
        // Este es el error que probablemente ves por el índice de categorías:
        if (error.code === 'failed-precondition') {
            listaProductos.innerHTML = '<p class="loader">Error: La base de datos necesita un índice para "Categorías". Abre F12 y sigue las instrucciones del error en la consola.</p>';
        } else {
            listaProductos.innerHTML = '<p class="loader">No se pudieron cargar los productos. Intenta de nuevo más tarde.</p>';
        }
    }
}

// --- FUNCIONES DE AYUDA ---

// ¡NUEVO! Función centralizada para crear tarjetas de producto
function createProductCard(producto) {
    // Validar el número de WhatsApp
    if (WHATSAPP_NUMBER === "TU_NUMERO_AQUI_CON_CODIGO_DE_PAIS") {
        console.error("Error: Falta configurar el número de WhatsApp en script.js");
        // No crees la tarjeta si falta el número.
        return document.createElement('div'); // Devuelve un div vacío
    }
    
    // Construir el link de WhatsApp dinámicamente
    const mensajeWhatsApp = encodeURIComponent(`¡Hola! Me interesa el producto: ${producto.nombre}`);
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeWhatsApp}`;
    
    const productCard = document.createElement('div');
    productCard.className = 'product-card';

    // --- ¡NUEVO! Lógica de "Agotado" ---
    let whatsappButtonHTML = '';
    if (producto.agotado) {
        productCard.classList.add('agotado'); // Añade clase para CSS
        whatsappButtonHTML = `
            <a class="btn-whatsapp" disabled>
                <i class="fas fa-times-circle"></i> Agotado
            </a>
        `;
    } else {
        whatsappButtonHTML = `
            <a href="${whatsappLink}" class="btn-whatsapp" target="_blank" rel="noopener noreferrer">
                <i class="fab fa-whatsapp"></i> Pedir
            </a>
        `;
    }
    
    // Plantilla de tarjeta
    productCard.innerHTML = `
        <img src="${producto.imagen}" 
             alt="${producto.nombre}" 
             class="product-image" 
             onerror="this.src='https://placehold.co/300x200/f8f5f1/ccc?text=Sin+Imagen'">
        <div class="product-info">
            <h3 class="product-title">${producto.nombre}</h3>
            <p class="product-description">${producto.descripcion}</p>
            <span class="product-price">${producto.precio}</span>
            ${whatsappButtonHTML}
        </div>
    `;
    return productCard;
}

// ¡NUEVO! Función para manejar la clase 'active' en los filtros
function setActiveFilter(button) {
    // Quita 'active' de todos
    document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
    // Añade 'active' al botón presionado
    button.classList.add('active');
}