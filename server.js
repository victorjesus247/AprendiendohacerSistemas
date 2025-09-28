// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000; // Puerto donde correrá el servidor

app.use(cors()); // Habilitar CORS para permitir peticiones desde el frontend (app.js)
app.use(express.json()); // Middleware para poder leer datos JSON enviados en el cuerpo (body) de las peticiones

// Configuración de la Conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'root', // Asegúrate de que esta contraseña sea correcta
    database: 'prueba' // Nombre de la base de datos
});

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        // En caso de error de conexión (ej: MySQL apagado), muestra el error y termina
        console.error('Error al conectar con la base de datos:', err);
        return;
    }
    console.log('Conexión a MySQL establecida correctamente.');
});


// ===============================================
// RUTA 1: LEER TODOS LOS PRODUCTOS (R - Read)
// ===============================================
app.get('/api/productos', (req, res) => {
    // Lee los datos y ordena por idproductos (ya que confirmamos que se llama así)
    const sql = "SELECT idproductos, nombre, cantidad, precio FROM productos ORDER BY idproductos DESC";

    db.query(sql, (err, resultados) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json(resultados);
    });
});


// ===============================================
// RUTA 2: CREAR UN NUEVO PRODUCTO (C - Create)
// ===============================================
app.post('/api/productos', (req, res) => {
    // La ruta es /api/productos, y el método es POST
    const { nombre, cantidad, precio } = req.body; 

    const sql = "INSERT INTO productos (nombre, cantidad, precio) VALUES (?, ?, ?)";

    db.query(sql, [nombre, cantidad, precio], (err, resultado) => {
        if (err) {
            console.error('Error al insertar producto:', err);
            // Devuelve 500 si hay un error SQL
            return res.status(500).json({ error: 'Error al registrar el producto.' });
        }
        
        // Devuelve 201 Created si es exitoso
        res.status(201).json({ 
            mensaje: 'Producto agregado exitosamente', 
            id: resultado.insertId 
        });
    });
});


// ===============================================
// RUTA 3: ELIMINAR UN PRODUCTO (D - Delete)
// ===============================================
app.delete('/api/productos/:idproductos', (req, res) => {
    // El método es DELETE y recibe el ID como parámetro en la URL
    const idProductoAEliminar = req.params.idproductos; 

    // Asegúrate de usar WHERE idproductos = ?
    const sql = "DELETE FROM productos WHERE idproductos = ?";

    db.query(sql, [idProductoAEliminar], (err, resultado) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).json({ error: 'Error al eliminar el producto.' });
        }
        
        if (resultado.affectedRows === 0) {
            // Devuelve 404 si el ID no existe
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }

        res.status(200).json({ 
            mensaje: `Producto con ID ${idProductoAEliminar} eliminado exitosamente` 
        });
    });
});


// ===============================================
// RUTA 4: ACTUALIZAR UN PRODUCTO (U - Update)
// ===============================================
app.put('/api/productos/:idproductos', (req, res) => { 
    // El método es PUT y recibe el ID como parámetro en la URL
    const idProductoAActualizar = req.params.idproductos; 

    // Obtener los nuevos datos desde el cuerpo (body)
    const { nombre, cantidad, precio } = req.body;

    // Asegúrate de que los ? se mapeen correctamente al orden de las variables
    const sql = "UPDATE productos SET nombre = ?, cantidad = ?, precio = ? WHERE idproductos = ?";

    db.query(sql, [nombre, cantidad, precio, idProductoAActualizar], (err, resultado) => {
        if (err) {
            console.error('Error al actualizar producto:', err);
            return res.status(500).json({ error: 'Error al actualizar el producto.' });
        }
        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado para actualizar.' });
        }

        res.status(200).json({ 
            mensaje: `Producto con ID ${idProductoAActualizar} actualizado exitosamente` 
        });
    });
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${port}`);
});