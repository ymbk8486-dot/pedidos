const orderForm = document.getElementById("orderForm");
const ordersContainer = document.getElementById("orders");
const summaryContainer = document.getElementById("summary");
const emptyState = document.getElementById("emptyState");
const copyButton = document.getElementById("copyButton");
const orderCount = document.getElementById("orderCount");

const state = {
  orders: [],
  selectedId: null,
};

const formatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
});

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const basePrices = {
  "Tarjetas personales": 35,
  Folletos: 28,
  Catálogos: 52,
  Etiquetas: 18,
  Revistas: 60,
  Afiches: 45,
};

const sizeMultiplier = {
  A4: 1.2,
  A5: 1,
  A6: 0.85,
  "10x15 cm": 0.7,
  Personalizado: 1.35,
};

function calculateEstimate(order) {
  const base = basePrices[order.product] ?? 30;
  const sizeFactor = sizeMultiplier[order.size] ?? 1;
  const finishFactor = order.finish === "Laminado + UV" ? 1.35 : 1.1;
  const quantity = Number(order.quantity);
  return Math.round(base * sizeFactor * finishFactor * quantity);
}

function formatSummary(order) {
  return [
    `Cliente: ${order.client}`,
    `Contacto: ${order.contact} (${order.phone})`,
    `Producto: ${order.product} | ${order.quantity} unidades`,
    `Tamaño: ${order.size} | Papel: ${order.paper}`,
    `Acabado: ${order.finish}`,
    `Entrega: ${formatter.format(order.delivery)}`,
    `Notas: ${order.notes || "Sin notas"}`,
    `Estimado: ${currency.format(order.estimate)}`,
  ].join("\n");
}

function renderOrders() {
  ordersContainer.innerHTML = "";
  orderCount.textContent = state.orders.length;
  emptyState.style.display = state.orders.length ? "none" : "block";

  state.orders.forEach((order) => {
    const card = document.createElement("article");
    card.className = "order-card";
    if (state.selectedId === order.id) {
      card.classList.add("is-active");
    }

    card.innerHTML = `
      <strong>${order.client}</strong>
      <div>${order.product}</div>
      <div class="order-card__meta">
        <span>${order.quantity} uds · ${order.size}</span>
        <span>${formatter.format(order.delivery)}</span>
      </div>
    `;

    card.addEventListener("click", () => {
      state.selectedId = order.id;
      renderOrders();
      renderSummary();
    });

    ordersContainer.appendChild(card);
  });
}

function renderSummary() {
  const selected = state.orders.find((order) => order.id === state.selectedId);
  summaryContainer.innerHTML = "";

  if (!selected) {
    summaryContainer.innerHTML =
      '<p class="summary__placeholder">Selecciona un pedido para ver los detalles.</p>';
    return;
  }

  const details = [
    ["Cliente", selected.client],
    ["Contacto", `${selected.contact} · ${selected.phone}`],
    ["Producto", `${selected.product} (${selected.quantity} uds)`],
    ["Tamaño", selected.size],
    ["Papel", selected.paper],
    ["Acabado", selected.finish],
    ["Entrega", formatter.format(selected.delivery)],
    ["Estimado", currency.format(selected.estimate)],
  ];

  details.forEach(([label, value]) => {
    const line = document.createElement("div");
    line.className = "summary__line";
    line.innerHTML = `<span>${label}</span><div>${value}</div>`;
    summaryContainer.appendChild(line);
  });

  if (selected.notes) {
    const notes = document.createElement("p");
    notes.textContent = `Notas: ${selected.notes}`;
    summaryContainer.appendChild(notes);
  }
}

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(orderForm);
  const order = Object.fromEntries(formData.entries());

  const newOrder = {
    id: crypto.randomUUID(),
    client: order.client.trim(),
    contact: order.contact.trim(),
    phone: order.phone.trim(),
    product: order.product,
    quantity: Number(order.quantity),
    size: order.size,
    paper: order.paper,
    finish: order.finish,
    delivery: new Date(order.delivery),
    notes: order.notes.trim(),
  };

  newOrder.estimate = calculateEstimate(newOrder);
  state.orders.unshift(newOrder);
  state.selectedId = newOrder.id;

  orderForm.reset();
  orderForm.querySelector("input[name='quantity']").value = 100;
  renderOrders();
  renderSummary();
});

copyButton.addEventListener("click", async () => {
  const selected = state.orders.find((order) => order.id === state.selectedId);
  if (!selected) {
    alert("Selecciona un pedido antes de copiar el resumen.");
    return;
  }

  try {
    await navigator.clipboard.writeText(formatSummary(selected));
    copyButton.textContent = "Resumen copiado";
    setTimeout(() => {
      copyButton.textContent = "Copiar resumen";
    }, 2000);
  } catch (error) {
    console.error(error);
    alert("No se pudo copiar el resumen.");
  }
});

renderOrders();
renderSummary();
