// ==============================
// GESTIÓN DE MESA Y PAX
// ==============================

// Guarda mesa y número de comensales (pax) en localStorage y bloquea los campos
function aceptarMesaYPax() {
  const mesa = document.getElementById("mesa");
  const pax = document.getElementById("pax");

  if (!mesa.disabled && mesa.value) {
    localStorage.setItem("mesaSeleccionada", mesa.value);
    localStorage.setItem("mesaBloqueada", "true");
    mesa.disabled = true;

    // Muestra tooltip si está bloqueada
    mesa.setAttribute("data-bs-toggle", "tooltip");
    mesa.setAttribute("data-bs-placement", "top");
    mesa.setAttribute("title", "Avise al personal para modificarla.");
    new bootstrap.Tooltip(mesa);
  }

  if (!pax.disabled && pax.value) {
    localStorage.setItem("paxSeleccionado", pax.value);
    localStorage.setItem("paxBloqueado", "true");

    actualizarPrecio();

    pax.disabled = true;
    pax.setAttribute("data-bs-toggle", "tooltip");
    pax.setAttribute("data-bs-placement", "top");
    pax.setAttribute("title", "Avise al personal para modificarla.");
    new bootstrap.Tooltip(pax);
  }

  alert("Datos guardados correctamente.");
}

// Permite desbloquear los campos mesa y pax si se introduce el código del personal
function solicitarCodigoMesa() {
  const codigo = prompt("Introduce el código del personal:");
  const codigoCorrecto = "1234";
  const mesa = document.getElementById("mesa");
  const pax = document.getElementById("pax");

  if (codigo === codigoCorrecto) {
    mesa.disabled = false;
    pax.disabled = false;

    localStorage.removeItem("mesaBloqueada");
    localStorage.removeItem("paxBloqueado");

    // Eliminar tooltips
    const tooltipMesa = bootstrap.Tooltip.getInstance(mesa);
    if (tooltipMesa) tooltipMesa.dispose();
    mesa.removeAttribute("data-bs-toggle");
    mesa.removeAttribute("data-bs-placement");
    mesa.removeAttribute("title");

    const tooltipPax = bootstrap.Tooltip.getInstance(pax);
    if (tooltipPax) tooltipPax.dispose();
    pax.removeAttribute("data-bs-toggle");
    pax.removeAttribute("data-bs-placement");
    pax.removeAttribute("title");

    alert("Ahora puedes modificar mesa y pax.");
  } else {
    alert("Código incorrecto. Solo el personal puede cambiar la mesa.");
  }
}

const mapaPlatos = {}; // nombre → id_plato

// Función para obtener el id_plato a partir del nombre
function obtenerIdPlatoPorNombre(nombre) {
  return mapaPlatos[nombre.trim().toLowerCase()] || 0; // Devuelve 0 si no se encuentra
}

// ==============================
// CARGAR ELEMENTOS AL CARGAR LA PÁGINA
// ==============================
window.addEventListener("DOMContentLoaded", () => {
  const mesa = document.getElementById("mesa");
  const pax = document.getElementById("pax");

  // Cargar valores guardados
  const mesaGuardada = localStorage.getItem("mesaSeleccionada");
  const paxGuardado = localStorage.getItem("paxSeleccionado");
  const mesaBloqueada = localStorage.getItem("mesaBloqueada");
  const paxBloqueada = localStorage.getItem("paxBloqueado");

  if (mesaGuardada && mesaBloqueada) {
    mesa.value = mesaGuardada;
    mesa.disabled = true;
    mesa.setAttribute("data-bs-toggle", "tooltip");
    mesa.setAttribute("data-bs-placement", "top");
    mesa.setAttribute("title", "Avise al personal para modificarla.");
    new bootstrap.Tooltip(mesa);
  }

  if (paxGuardado && paxBloqueada) {
    pax.value = paxGuardado;
    pax.disabled = true;
    pax.setAttribute("data-bs-toggle", "tooltip");
    pax.setAttribute("data-bs-placement", "top");
    pax.setAttribute("title", "Avise al personal para modificarla.");
    new bootstrap.Tooltip(pax);
  }

  actualizarPrecio();

  // CARGAR PLATOS (nombre → id) desde el servidor
  fetch("http://localhost:3000/platos")
    .then(res => res.json())
    .then(data => {
      data.forEach(plato => {
        const nombreNormalizado = plato.nombre_plato.trim().toLowerCase();
        mapaPlatos[nombreNormalizado] = plato.id_plato;
      });
    })
});

// ==============================
// FUNCIONES DEL CARRITO
// ==============================

// Función para añadir un plato al carrito
function anadirPlato(nombre) {
  const idUnico = crypto.randomUUID();
  const carrito = document.getElementById('contenido-carrito');

  const item = document.createElement('div');
  item.className = 'mb-3 p-2 border border-light rounded bg-dark text-white';
  item.id = `carrito-item-${idUnico}`;
  item.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div><strong>${nombre}</strong></div>
      <button class="btn btn-sm btn-danger fw-bold" onclick="eliminarPlato('${idUnico}')">🗑️</button>
    </div>
  `;

  carrito.appendChild(item);
  mostrarToast();
}

// Función para eliminar un plato del carrito
function eliminarPlato(id) {
  const item = document.getElementById(`carrito-item-${id}`);
  if (item) {
    item.remove();
    mostrarToast("Plato eliminado", "danger");
  }
}

// Funcion para enviar la información del pedido al servidor
function finalizarPedido() {
  const items = document.querySelectorAll('[id^="carrito-item-"]');
  if (items.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  // Obtener los platos del carrito
  const platos = Array.from(items).map(item => {
    const nombre = item.querySelector("strong")?.textContent.trim();
    const detallesHtml = item.querySelector("p")?.innerHTML || "";
    const detalles_modificaciones = detallesHtml.replace(/<br>/g, ", ");
    const modificaciones = detalles_modificaciones ? "Sí" : "No";
    // Si no hay detalles, se asigna un string vacío

    // Obtener el id_plato a partir del nombre
    const id_plato = obtenerIdPlatoPorNombre(nombre);
    return {
      id_plato,
      modificaciones,
      detalles_modificaciones,
    };
  });

  const pedido = {
    id_mesa: parseInt(document.getElementById("mesa").value),
    hora_pedido: new Date().toLocaleTimeString("es-ES"),
    estado_pedido: "Pendiente",
    platosPedido: platos
  };

  // Enviar el pedido al servidor
  fetch("http://localhost:3000/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido)
  })
    .then(res => res.json())
    .then(data => {
      alert("Pedido finalizado correctamente.");
      items.forEach(item => item.remove());
    })
    .catch(err => {
      console.error("Error al enviar el pedido:", err);
      alert("Hubo un error al finalizar el pedido.");
    });
}


// ==============================
// PERSONALIZACIÓN DE PLATOS
// ==============================

// Ingredientes por defecto según plato
const ingredientesPorPlato = {
  "Tortilla de patatas": ["Cebolla"],
  "Patatas Bravas Mixtas": ["Salsa Brava", "Alioli"],
  "Pimientos Rellenos de Carne": ["Carne", "Queso", "Cebolla"],
  "Pabellón Venezolano": ["Arroz", "Caraotas", "Plátano frito"],
  "Lomo de Cerdo y Puré de Patata": ["Puré"],
  "Estofado de Ternera": ["Zanahoria", "Patatas"],
  "Quesillo Venezolano": ["Caramelo"],
  "Tarta de Santiago": ["Nata"],
  "Flan de Almendras y Panela": ["Almendras"],
  "Agua": ["Hielo"],
  "Sangria": ["Canela"],
  "Cerveza Polar": ["Vaso"]
};

let platoActual = "";

// Muestra el modal (popup) para personalizar un plato
function personalizarPlato(nombrePlato) {
  platoActual = nombrePlato;
  const form = document.getElementById("formIngredientes");
  form.innerHTML = "";

  const ingredientes = ingredientesPorPlato[nombrePlato] || [];

  ingredientes.forEach((ing, i) => {
    const solo01 = ["Agua", "Cerveza Polar"].includes(nombrePlato);
    const valorInicial = 1;

    form.innerHTML += `
      <div class="d-flex align-items-center justify-content-between text-white">
        <label class="me-3">${ing}</label>
        <div class="d-flex align-items-center">
          <button type="button" class="btn btn-sm btn-outline-light me-2" onclick="cambiarCantidad('ing${i}', -1, ${solo01})">−</button>
          <span id="ing${i}" data-ingrediente="${ing}" data-cantidad="${valorInicial}">${valorInicial}</span>
          <button type="button" class="btn btn-sm btn-outline-light ms-2" onclick="cambiarCantidad('ing${i}', 1, ${solo01})">+</button>
        </div>
      </div>
    `;
  });

  const modal = new bootstrap.Modal(document.getElementById('modalPersonalizar'));
  modal.show();
}

// Modifica las cantidades de los ingredientes (0=sin, 1=normal, 2=extra)
function cambiarCantidad(id, cambio, solo01) {
  const span = document.getElementById(id);
  let valor = parseInt(span.dataset.cantidad);

  if (solo01) {
    valor = Math.max(0, Math.min(1, valor + cambio));
  } else {
    valor = Math.max(0, Math.min(2, valor + cambio));
  }

  span.dataset.cantidad = valor;
  span.textContent = valor;
}

// Guarda la personalización y añade al carrito
function guardarPersonalizacion() {
  const form = document.getElementById("formIngredientes");
  const spans = form.querySelectorAll("span[data-ingrediente]");
  const detalles = [];

  spans.forEach(span => {
    const ing = span.dataset.ingrediente;
    const cantidad = parseInt(span.dataset.cantidad);

    if (cantidad !== 1) {
      if (cantidad === 0) detalles.push(`Sin ${ing}`);
      else if (cantidad === 2) detalles.push(`Extra ${ing}`);
    }
  });

  const idUnico = crypto.randomUUID();
  const carrito = document.getElementById("contenido-carrito");

  const item = document.createElement("div");
  item.className = "mb-3 p-2 border border-light rounded bg-dark text-white";
  item.id = `carrito-item-${idUnico}`;

  const infoHTML = detalles.length > 0
    ? `<div class="mt-2"><p class="mb-0" style="font-size: 0.9rem;">${detalles.join("<br>")}</p></div>`
    : "";
  item.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <strong>${platoActual}</strong>
        ${infoHTML}
      </div>
      <button class="btn btn-sm btn-danger fw-bold" onclick="eliminarPlato('${idUnico}')">🗑️</button>
    </div>
  `;

  carrito.appendChild(item);
  bootstrap.Modal.getInstance(document.getElementById("modalPersonalizar")).hide();
  mostrarToast();
}

// ==============================
// ALERTAS DE PLATO AÑADIDO
// ==============================
function mostrarToast(mensaje = "Plato añadido correctamente", tipo = "success") {
  const toastElement = document.getElementById('mensajeToast');
  const toastBody = toastElement.querySelector('.toast-body');

  toastElement.classList.remove('bg-success', 'bg-danger');

  // Asignar clase según tipo
  if (tipo === "success") {
    toastElement.classList.add('bg-success');
  } else if (tipo === "danger") {
    toastElement.classList.add('bg-danger');
  }

  // Establecer mensaje y mostrar
  toastBody.textContent = mensaje;
  toastElement.style.display = 'block';

  setTimeout(() => {
    toastElement.style.display = 'none';
  }, 2000);
}
// Ocultar el Toast (X)
function ocultarToast() {
  const toastElement = document.getElementById('mensajeToast');
  toastElement.style.display = 'none';
}

// ==============================
// PRECIO
// ==============================
// Calcula el precio total según el número de comensales
function actualizarPrecio() {
  const pax = parseInt(document.getElementById("pax").value) || 1;
  const precioTotal = pax * 20;

  const divPrecio = document.getElementById("precio-total");
  divPrecio.textContent = `Total: ${precioTotal} €`;
}