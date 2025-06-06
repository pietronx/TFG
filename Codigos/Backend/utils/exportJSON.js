// Exporta los pedidos pendientes a un archivo JSON
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta del OneDrive donde se guardará el archivo JSON
const rutaJSON = path.resolve('C:/Users/peter/OneDrive - Consejería de Educación (Comunidad de Madrid)/MyERest - Comandas/comandas.json');

// Enlace de la ruta anterior (solo pueden acceder los usuarios de la Comunidad de Madrid):
// https://educa2madrid.sharepoint.com/:u:/s/MyERest/EQ37riF9gBhBrnyH7chyjBABqrOwhBICPvms3NB6uWQxTw?e=3yBgnW

function exportarPedidosPendientesJSON() {
  const db = new sqlite3.Database('./database/database.db');

  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        p.id_pedido,
        p.id_mesa,
        p.hora_pedido,
        p.estado_pedido,
        pl.tipo_plato,
        pl.nombre_plato,
        pp.modificaciones,
        pp.detalles_modificaciones
      FROM Pedidos p
      JOIN PlatosPedidos pp ON p.id_pedido = pp.id_pedido
      JOIN Platos pl ON pl.id_plato = pp.id_plato
      WHERE p.estado_pedido = 'Pendiente'
      ORDER BY p.id_pedido ASC
      LIMIT 200
    `, [], (err, rows) => {
      if (err) {
        console.error("Error al exportar JSON:", err.message);
        reject(err);
        return;
      }

      fs.writeFileSync(rutaJSON, JSON.stringify(rows, null, 2), 'utf8');
      console.log("Archivo JSON exportado correctamente.");
      resolve();
    });
  });
}

module.exports = { exportarPedidosPendientesJSON };