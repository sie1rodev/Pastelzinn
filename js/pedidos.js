/* =========================================
📦 PEDIDOS
========================================= */
async function loadPedidos() {
  const lista = document.getElementById("listaPedidos");
  if (!lista) return;

  const [resPedidos, resSabores] = await Promise.all([
    fetch(`${API}/pedidos`),
    fetch(`${API}/sabores`)
  ]);

  const pedidos = (await resPedidos.json()).data || [];
  sabores = (await resSabores.json()).data || [];

  lista.innerHTML = "";

  pedidos
    .filter(p => p.status !== "encerrado")
    .forEach(pedido => {

      let total = 0;

      const itensHTML = (pedido.pedido_itens || []).map(item => {

        const sabor = sabores.find(s => s.id == item.sabor_id);
        const preco = Number(sabor?.preco || 0);

        const subtotal = preco * item.quantidade;
        total += subtotal;

        return `
          <div class="item-comanda">

            <select onchange="trocarSabor('${item.id}','${item.sabor_id}',this.value,${item.quantidade})">
              ${sabores.map(s => `
                <option value="${s.id}" ${s.id == item.sabor_id ? "selected" : ""}>
                  ${s.nome}
                </option>
              `).join("")}
            </select>

            <input type="number" min="1"
              value="${item.quantidade}"
              onchange="editarQuantidade('${item.id}','${item.sabor_id}',${item.quantidade},this.value)"
            >

            <span>R$ ${subtotal.toFixed(2)}</span>

            <button class="btn-delete" onclick="deletarItem('${item.id}')">✕</button>
          </div>
        `;
      }).join("");

      const addItemHTML = `
        <div class="add-item-wrapper">

          <button class="btn-toggle" onclick="toggleAddItem('${pedido.id}')">
            ➕ Adicionar item
          </button>

          <div id="add-item-${pedido.id}" class="add-item" style="display:none;">

            <select id="select-sabor-${pedido.id}">
              ${sabores.map(s => `
                <option value="${s.id}">
                  ${s.nome} - R$ ${Number(s.preco).toFixed(2)}
                </option>
              `).join("")}
            </select>

            <input id="input-qtd-${pedido.id}" type="number" min="1" value="1">

            <button class="btn-add" onclick="adicionarItemComanda('${pedido.id}')">
              Adicionar
            </button>

          </div>

        </div>
      `;

      lista.innerHTML += `
        <div class="pedido-card">

          <div class="pedido-header">
            <h3>👤 ${pedido.nome_cliente}</h3>

            <button class="btn-close" onclick="encerrarPedido('${pedido.id}')">
              Encerrar
            </button>
          </div>

          ${itensHTML}

          ${addItemHTML}

          <h3 class="total">Total: R$ ${total.toFixed(2)}</h3>

        </div>
      `;
    });
}

/* =========================================
➕ ADICIONAR ITEM
========================================= */
async function adicionarItemComanda(pedido_id) {

  const sabor_id = document.getElementById(`select-sabor-${pedido_id}`).value;
  const quantidade = Number(document.getElementById(`input-qtd-${pedido_id}`).value);

  const sabor = sabores.find(s => s.id == sabor_id);

  if (!sabor || quantidade <= 0) return;

  if (quantidade > sabor.quantidade) {
    alert("Estoque insuficiente!");
    return;
  }

  await fetch(`${API}/itens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pedido_id,
      sabor_id,
      quantidade
    })
  });

  loadPedidos();
}

/* =========================================
✏️ EDITAR QUANTIDADE
========================================= */
async function editarQuantidade(item_id, sabor_id, antiga, nova) {

  await fetch(`${API}/itens`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: item_id,
      sabor_id,
      quantidade_antiga: antiga,
      quantidade: Number(nova)
    })
  });

  loadPedidos();
}

/* =========================================
🔁 TROCAR SABOR
========================================= */
async function trocarSabor(item_id, antigo, novo, quantidade) {

  await fetch(`${API}/itens`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: item_id,
      sabor_antigo: antigo,
      sabor_id: novo,
      quantidade
    })
  });

  loadPedidos();
}

/* =========================================
❌ DELETAR ITEM
========================================= */
async function deletarItem(id) {

  await fetch(`${API}/itens`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  loadPedidos();
}

/* =========================================
✅ ENCERRAR PEDIDO
========================================= */
async function encerrarPedido(id) {

  await fetch(`${API}/pedidos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status: "encerrado" })
  });

  loadPedidos();
}

/* =========================================
🔥 ENCERRAR TODOS
========================================= */
async function encerrarTodas() {

  const res = await fetch(`${API}/pedidos`);
  const json = await res.json();

  const pedidos = json.data || [];

  for (const p of pedidos) {
    if (p.status !== "encerrado") {
      await encerrarPedido(p.id);
    }
  }

  loadPedidos();
}

/* =========================================
🔽 TOGGLE FORM (100% BLINDADO)
========================================= */
function toggleAddItem(pedido_id) {
  const el = document.getElementById(`add-item-${pedido_id}`);
  if (!el) return;

  if (el.style.display === "none" || el.style.display === "") {
    el.style.display = "flex";
  } else {
    el.style.display = "none";
  }
}

/* =========================================
🚀 INIT
========================================= */
loadPedidos();