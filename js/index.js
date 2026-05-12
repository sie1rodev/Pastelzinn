/* =========================================
🍔 SABORES (CLIENTE)
========================================= */
async function loadSaboresPedido() {

  try {

    const res = await fetch(`${API}/sabores`);
    const json = await res.json();

    sabores = json.data || [];

    const lista = document.getElementById("listaSaboresPedido");
    if (!lista) return;

    lista.innerHTML = "";

    sabores
      .filter(s => s.quantidade > 0)
      .forEach(sabor => {

        lista.innerHTML += `
          <div class="card-sabor">

            <h3>${sabor.nome}</h3>

            <p class="preco">
              R$ ${Number(sabor.preco).toFixed(2).replace(".", ",")}
            </p>

            <p class="estoque">
              ${sabor.quantidade} disponíveis
            </p>

            <div class="controls">
              <button onclick="alterarQtd('${sabor.id}', -1)">-</button>
              <span id="qtd-${sabor.id}">0</span>
              <button onclick="alterarQtd('${sabor.id}', 1)">+</button>
            </div>

          </div>
        `;
      });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar sabores");
  }
}

/* =========================================
➕➖ CARRINHO
========================================= */
function alterarQtd(id, valor) {

  const item = carrinho.find(i => i.id == id);

  if (item) {

    item.quantidade += valor;

    if (item.quantidade <= 0) {
      carrinho = carrinho.filter(i => i.id != id);
    }

  } else {

    if (valor > 0) {
      const sabor = sabores.find(s => s.id == id);

      carrinho.push({
        id: sabor.id,
        nome: sabor.nome,
        preco: Number(sabor.preco),
        quantidade: 1
      });
    }
  }

  atualizarCarrinho();
}

/* =========================================
🛒 CARRINHO
========================================= */
function atualizarCarrinho() {

  sabores.forEach(sabor => {
    const item = carrinho.find(i => i.id == sabor.id);
    const span = document.getElementById(`qtd-${sabor.id}`);

    if (span) span.innerText = item ? item.quantidade : 0;
  });

  const lista = document.getElementById("itensCarrinho");
  if (!lista) return;

  lista.innerHTML = "";

  let total = 0;

  if (carrinho.length === 0) {
    lista.innerHTML = `<p>Seu carrinho está vazio</p>`;
  }

  carrinho.forEach(item => {

    const subtotal = item.preco * item.quantidade;
    total += subtotal;

    lista.innerHTML += `
      <div class="item-carrinho">
        <span>${item.nome} x${item.quantidade}</span>
        <strong>R$ ${subtotal.toFixed(2)}</strong>
      </div>
    `;
  });

  const totalPedido = document.getElementById("totalPedido");
  if (totalPedido) {
    totalPedido.innerText = `Total: R$ ${total.toFixed(2)}`;
  }
}

/* =========================================
✅ FINALIZAR PEDIDO
========================================= */
async function finalizarPedido() {

  try {

    const nome = document.getElementById("cliente").value;

    if (!nome) return alert("Digite seu nome");
    if (carrinho.length === 0) return alert("Adicione itens");

    const pedidoRes = await fetch(`${API}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome_cliente: nome,
        para_viagem: false
      })
    });

    const pedidoJson = await pedidoRes.json();
    const pedido = pedidoJson.data?.[0];

    if (!pedido) return alert("Erro ao criar pedido");

    for (const item of carrinho) {

      await fetch(`${API}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: pedido.id,
          sabor_id: item.id,
          quantidade: item.quantidade
        })
      });
    }

    carrinho = [];
    document.getElementById("cliente").value = "";

    atualizarCarrinho();
    loadSaboresPedido();

    alert("Pedido realizado com sucesso!");

  } catch (err) {
    console.error(err);
    alert("Erro ao finalizar pedido");
  }
}

/* =========================================
🚀 INIT
========================================= */
loadSaboresPedido();