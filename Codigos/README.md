# My E-Rest

Este proyecto permite realizar pedidos desde una interfaz web, conectada a un servidor Node.js con base de datos SQLite. Los pedidos se guardan y luego se exportan automáticamente a un fichero `.json` sincronizado con OneDrive, para ser utilizados por la cocina
## ⚙️ Requisitos previos

- Tener instalado:
  - **Node.js** (versión 16 o superior recomendada)
    - Puedes descargarlo desde  [https://nodejs.org/es]
  - **npm** (incluido con Node.js)

- Comprobar instalación ejecutando en terminal:
  node --version
  npm --version

## 🚀 Pasos para ejecutar el proyecto

1. Abre la consola y accede al directorio del backend:
   
   cd /ruta/a/tu/proyecto/Backend

2. Instala las dependencias:
   npm install

3. Inicia el servidor:
   node server.js

   El servidor se iniciará en: [http://localhost:3000]

4. Abre el fichero `Cliente/index.html` en el navegador para usar la interfaz de cliente.

## 🗃️ Base de datos

La base de datos `database.db` (SQLite) contiene tres tablas principales:

- `Pedidos`: ID, número de mesa, hora, estado (Pendiente, Completado, etc.)
- `Platos`: ID, nombre del plato, tipo (Primero, Segundo, Postre, Bebida)
- `PlatosPedidos`: representa los platos individuales dentro de cada pedido, con posibles modificaciones (sin cebolla, extra salsa, etc.)

## 📤 Exportación automática a JSON

Cada vez que se realiza un pedido, se actualiza automáticamente el fichero:

``` comandas.json ```

Este fichero contiene **todos los pedidos/comandas**, y se guarda directamente en:

``` C:/ruta/al/fichero/en/OneDrive ```


El JSON se sincroniza en tiempo real con OneDrive para que otros sistemas (como la interfaz de cocina) puedan acceder a los pedidos sin tocar la base de datos.


**De momento para realizar la comprobación del flujo de datos entre el Backend y la Cocina, utilizaremos el fichero JSON que está dentro del directorio Cocina**

## 🧪 Prueba rápida

1. En la web del cliente, selecciona una mesa y añade platos al carrito
2. Personaliza un plato
3. Finaliza el pedido
4. Verifica que el fichero `cocina.json` se actualizó con el nuevo pedido