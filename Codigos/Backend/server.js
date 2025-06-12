//------------------------> Librerías que importamos <------------------------\\

// express = framework para crear servidores   
const express = require('express'); 
// cors = middleware para habilitar CORS
const cors = require('cors'); 
// sqlite3 = librería para interactuar con bases de datos SQLite
const sqlite3 = require('sqlite3').verbose(); 
// Creamos una conexión a la base de datos SQLite
const db = new sqlite3.Database('./database/database.db'); 
// Importamos la función para exportar a JSON
const { exportarPedidosPendientesJSON } = require('./utils/exportJSON'); 

// Definimos la 'app' y el puerto
const app = express();
const PORT = 3000;

// Habilitar CORS para todas las rutas
app.use(cors());
// Middleware para parsear el cuerpo de las peticiones
app.use(express.json());

// Iniciar el servidor en el puerto especificado (3000)
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

// Obtener el nombre y el id de los platos de la base de datos
// Para que el cliente pueda ver los platos disponibles
// Y poder hacer un pedido
app.get('/platos', (req, res) => {
    db.all(`SELECT id_plato, nombre_plato FROM Platos`, [], (err, rows) => {
        if (err) {
            console.error("Error al obtener los platos:", err.message);
            return res.status(500).json({ error: 'Error al obtener platos' });
        }

        res.status(200).json(rows); // devuelve un array [{ id_plato: 1, nombre_plato: "agua" }...]
    });
});

// Recibimos el pedido del cliente y lo guardamos en la base de datos
app.post('/pedidos', (req, res) => {
    const pedido = req.body;
    const { id_mesa, hora_pedido, estado_pedido, platosPedido } = pedido;

    // Validación de los datos del pedido
    if (!id_mesa || !hora_pedido || !Array.isArray(platosPedido) || platosPedido.length === 0) {
        return res.status(400).json({ mensaje: "Datos del pedido incompletos o inválidos." });
    }

    // Insertar el nuevo pedido en la tabla Pedidos sin asignar manualmente el id_pedido
    db.run(
        `INSERT INTO Pedidos (id_mesa, hora_pedido, estado_pedido) VALUES (?, ?, ?)`,
        [id_mesa, hora_pedido, estado_pedido],
        function (err) {
            if (err) {
                console.error("Error al insertar pedido:", err.message);
                return res.status(500).json({ mensaje: 'Error al guardar el pedido' });
            }

            const nuevoIdPedido = this.lastID; // SQLite asigna automáticamente el ID

            // Obtener el último id_plato_pedido y empezar desde 1000
            db.get(`SELECT MAX(id_plato_pedido) AS ultimoId FROM PlatosPedidos`, (err, row) => {
                if (err) {
                    console.error("Error al obtener el último id_plato_pedido:", err.message);
                    return res.status(500).json({ mensaje: "Error al preparar inserción de platos" });
                }

                let siguienteId = (row?.ultimoId ?? 999) + 1;

                // Insertar los platos del pedido en la tabla PlatosPedidos
                const stmt = db.prepare(`
                  INSERT INTO PlatosPedidos (id_plato_pedido, id_pedido, id_plato, modificaciones, detalles_modificaciones)
                  VALUES (?, ?, ?, ?, ?)
                `);

                platosPedido.forEach(plato => {
                    stmt.run(
                        siguienteId++,
                        nuevoIdPedido,
                        plato.id_plato,
                        plato.modificaciones || 'No',
                        plato.detalles_modificaciones || ' ',
                    );
                });

                // Finalizamos el statement
                stmt.finalize(err => {
                    if (err) {
                        console.error("Error al finalizar stmt:", err.message);
                        return res.status(500).json({ mensaje: "Error al finalizar inserción de platos" });
                    }

                    console.log("Pedido guardado:", { id_pedido: nuevoIdPedido, platosPedido });

                    exportarPedidosPendientesJSON()
                        .then(() => {
                            console.log("JSON actualizado tras nuevo pedido.");
                            res.status(200).json({ mensaje: 'Pedido guardado correctamente en SQLite' });
                        })
                        .catch(err => {
                            console.error("Error al actualizar JSON:", err);
                            res.status(500).json({ mensaje: 'Pedido guardado, pero error al exportar JSON' });
                        });
                });
            });
        }
    );
});