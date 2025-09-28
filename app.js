// Variable global para DataTables
let tabla;

// Variables para la modal (deben ser definidas al inicio o al cargarse el DOM)



// ===========================================
// FUNCIONES DE LECTURA Y DATA TABLES (READ)
// ===========================================

function inicializarDataTables(data) {
    // 1. Destruye la tabla si ya existe
    if ($.fn.DataTable.isDataTable('#tablaInventario')) {
        tabla.destroy();
    }

    // 2. Inicializa DataTables
    tabla = $('#tablaInventario').DataTable({
        data: data, 
        columns: [
            { data: 'idproductos' },
            { data: 'nombre' },
            { data: 'cantidad' },
            { 
                data: 'precio', 
                render: function(data, type, row) {
                    return `$${parseFloat(data).toFixed(2)}`;
                }
            },
            {
                data: null, 
                render: function(data, type, row) {
                    return `
                        <button class="btn-editar" data-id="${row.idproductos}">Editar</button>
                        <button class="btn-eliminar" data-id="${row.idproductos}">Eliminar</button>
                    `;
                }
            }
        ],
        language: {
             // 3. Asegura que la URL use HTTPS para evitar errores CORS
             url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/es-ES.json'
        }
    });
}

function obtenerYMostrarProductos() {
    // 4. Petición GET al servidor Node.js
    fetch('http://localhost:3000/api/productos') 
        .then(response => {
            if (!response.ok) {
                throw new Error('Problema con la respuesta del servidor Node.');
            }
            return response.json();
        })
        .then(data => {
            inicializarDataTables(data);
        })
        .catch(error => {
            console.error('Error al obtener productos:', error);
            const tbody = document.getElementById('listaProductos');
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: Asegúrate de que el servidor Node.js (server.js) esté corriendo en el puerto 3000.</td></tr>`;
        });
}


// ===========================================
// FUNCIONES DE CREACIÓN (CREATE)
// ===========================================

function agregarProducto(e) {
    e.preventDefault(); 

    const nombre = document.getElementById('nombre').value;
    const cantidad = document.getElementById('cantidad').value;
    const precio = document.getElementById('precio').value;

    const nuevoProducto = {
        nombre: nombre,
        cantidad: parseInt(cantidad),
        precio: parseFloat(precio)
    };

    fetch('http://localhost:3000/api/productos', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoProducto)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al guardar el producto.');
        }
        return response.json();
    })
    .then(data => {
        console.log('Respuesta del servidor:', data.mensaje);
        document.getElementById('formAgregar').reset();
        obtenerYMostrarProductos(); 
        alert('Producto ' + nombre + ' agregado con éxito!');
    })
    .catch(error => {
        console.error('Error al agregar el producto:', error);
        alert('Hubo un error al agregar el producto. Revisa la consola.');
    });
}


// ===========================================
// FUNCIONES DE ELIMINACIÓN (DELETE)
// ===========================================

function eliminarProducto(idProducto) {
    fetch(`http://localhost:3000/api/productos/${idProducto}`, {
        method: 'DELETE' 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al eliminar el producto.');
        }
        return response.json();
    })
    .then(data => {
        console.log('Respuesta del servidor:', data.mensaje);
        alert(data.mensaje);
        obtenerYMostrarProductos();
    })
    .catch(error => {
        console.error('Error al eliminar el producto:', error);
        alert('Hubo un error al eliminar el producto. Revisa la consola.');
    });
}


// ===========================================
// FUNCIONES DE ACTUALIZACIÓN (UPDATE) <-- ¡ENFÓCATE EN ESTAS!
// ===========================================

// 5. Muestra la modal y carga los datos del producto
function mostrarModalEdicion(producto) {
    document.getElementById('edit-idproductos').value = producto.idproductos;
    document.getElementById('edit-nombre').value = producto.nombre;
    document.getElementById('edit-cantidad').value = producto.cantidad;
    document.getElementById('edit-precio').value = parseFloat(producto.precio).toFixed(2); 
    
    modal.style.display = 'block';
}

// 6. Envía la petición PUT cuando se presiona "Guardar Cambios"
function guardarCambios(e) {
    e.preventDefault(); // <-- ¡CLAVE! Evita la recarga de la página
    
    // Obtener los datos de la modal
    const id = document.getElementById('edit-idproductos').value;
    const nombre = document.getElementById('edit-nombre').value;
    const cantidad = document.getElementById('edit-cantidad').value;
    const precio = document.getElementById('edit-precio').value;

    const datosActualizados = {
        nombre: nombre,
        cantidad: parseInt(cantidad),
        precio: parseFloat(precio)
    };

    // Petición PUT al servidor Node.js
    fetch(`http://localhost:3000/api/productos/${id}`, {
        method: 'PUT', // <-- Método de actualización
        headers: {
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(datosActualizados)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al actualizar el producto.');
        }
        return response.json();
    })
    .then(data => {
        console.log('Respuesta del servidor:', data.mensaje);
        alert(data.mensaje);
        
        modal.style.display = 'none';
        obtenerYMostrarProductos(); // Recarga la tabla
    })
    .catch(error => {
        console.error('Error al actualizar el producto:', error);
        alert('Hubo un error al actualizar el producto. Revisa la consola.');
    });
}

// 7. Configura los listeners para los botones Editar/Eliminar
function configurarListenersTabla() {
    const listaProductos = document.getElementById('listaProductos');

    // Usamos delegación de eventos en el cuerpo de la tabla
    listaProductos.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.getAttribute('data-id');
        
        if (target.classList.contains('btn-eliminar')) {
            if (confirm(`¿Estás seguro de que quieres eliminar el producto con ID ${id}?`)) {
                eliminarProducto(id);
            }
        } 
        
        else if (target.classList.contains('btn-editar')) {
            // Usa DataTables API para obtener los datos de la fila
            const fila = target.closest('tr');
            const dataProducto = $('#tablaInventario').DataTable().row(fila).data(); 
            
            mostrarModalEdicion(dataProducto);
        }
    });
}


// ===========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. DECLARA LAS VARIABLES AQUÍ, DENTRO DEL BLOQUE
    const modal = document.getElementById('modalEdicion');
    const spanCerrar = document.getElementsByClassName('cerrar-modal')[0];
    const formEditar = document.getElementById('formEditar'); 

    // 2. Carga inicial de datos
    obtenerYMostrarProductos(); 
    
    // 3. Listener para el formulario de CREACIÓN
    const formAgregar = document.getElementById('formAgregar');
    formAgregar.addEventListener('submit', agregarProducto);
    
    // 4. Listener para el formulario de EDICIÓN (¡Ahora ya no será null!)
    if (formEditar) { // Añadimos una verificación de seguridad
        formEditar.addEventListener('submit', guardarCambios); 
    }

    // 5. Configurar listeners de la tabla (Editar/Eliminar)
    configurarListenersTabla();

    // 6. Listeners para cerrar la modal (también deben ser verificados)
    if (spanCerrar && modal) {
        spanCerrar.onclick = function() {
            modal.style.display = 'none';
        }
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    }
});