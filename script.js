const API_URL = "https://api-pastelzinn.vercel.app";

// ---------- Inicialização ----------
document.addEventListener("DOMContentLoaded", () => {
  // Cliente
  if (document.getElementById("saboresLista")) {
    carregarSaboresCliente();
    document.getElementById("confirmarPedido").addEventListener("click", enviarPedido);
  }

  // Admin Comandas
  if (document.getElementById("listaPedidos")) {
    carregarPedidos();
    document.getElementById("zerarComandas").addEventListener("click", zerarComandas);
  }

  // Admin Sabores
  if (document.getElementById("listaSabores")) {
    carregarSaboresAdmin();
    document.getElementById("formSabor").addEventListener("submit", adicionarSabor);
  }
});

// ---------- CLIENTE ----------
async function carregarSaboresCliente() {
  const res = await fetch(`${API_URL}/sabores`);
  const sabores = await res.json();
  const lista = document.getElementById("saboresLista");
  lista.innerHTML = "";

  sabores.forEach(sabor => {
    const preco = sabor.preco ?? 12.00;
    const div = document.createElement("div");
    div.className = "sabor-card";
    div.innerHTML = `
      <span>${sabor.nome}</span>
      <small>Estoque: ${sabor.quantidade || 0}</small>
      <small>R$ ${preco.toFixed(2)}</small>
      <div class="qtd-container">
        <button class="menos">-</button>
        <input type="number" min="0" value="0" id="qtd-${sabor._id}">
        <button class="mais">+</button>
      </div>
    `;
    lista.appendChild(div);

    const input = div.querySelector("input");
    div.querySelector(".mais").addEventListener("click", () => {
      const max = sabor.quantidade || 99;
      if (parseInt(input.value) < max) input.value = parseInt(input.value) + 1;
    });
    div.querySelector(".menos").addEventListener("click", () => {
      if (parseInt(input.value) > 0) input.value = parseInt(input.value) - 1;
    });
  });
}

async function enviarPedido() {
  const nomeCliente = document.getElementById("nomeCliente").value.trim();
  if (!nomeCliente) { alert("Digite seu nome!"); return; }

  const resSabores = await fetch(`${API_URL}/sabores`);
  const sabores = await resSabores.json();

  const pedido = sabores.map(s => {
    const qtd = parseInt(document.getElementById(`qtd-${s._id}`).value);
    return qtd > 0 ? { saborId: s._id, quantidade: qtd, preco: s.preco ?? 12.00 } : null;
  }).filter(Boolean);

  if (pedido.length === 0) { alert("Selecione pelo menos um sabor!"); return; }

  const total = pedido.reduce((sum, item) => sum + item.quantidade * item.preco, 0);

  const res = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomeCliente, pedido })
  });

  const data = await res.json();
  if (res.ok) { 
    alert(`Pedido realizado! Total: R$ ${total.toFixed(2)}`);
    carregarSaboresCliente(); 
    document.getElementById("nomeCliente").value = "";
  } else {
    alert(data.error || "Erro ao enviar pedido.");
  }
}

// ---------- ADMIN - COMANDAS ----------
async function carregarPedidos() {
  const resPedidos = await fetch(`${API_URL}/pedidos`);
  const pedidos = await resPedidos.json();
  const resSabores = await fetch(`${API_URL}/sabores`);
  const sabores = await resSabores.json();
  const lista = document.getElementById("listaPedidos");
  lista.innerHTML = "";

  pedidos.forEach(p => {
    const li = document.createElement("li");

    // Botão concluir
    const btnConcluir = document.createElement("button");
    btnConcluir.textContent = "Concluir comanda";
    btnConcluir.className = "btn-danger btn-concluir";
    btnConcluir.addEventListener("click", async () => {
      if (!confirm("Deseja concluir esta comanda?")) return;
      await fetch(`${API_URL}/pedidos/${p._id}`, { method: "DELETE" });
      carregarPedidos();
    });

    li.innerHTML = `<strong>${p.nomeCliente}</strong>`;
    
    const ul = document.createElement("ul");
    p.pedido.forEach(item => {
      const sabor = sabores.find(s => s._id === item.saborId);
      const nomeSabor = sabor ? sabor.nome : "Sabor removido";
      const precoSabor = sabor?.preco ?? item.preco ?? 12.00;
      const liSabor = document.createElement("li");
      liSabor.innerHTML = `<span class="sabor-quantidade">${item.quantidade}x</span> <span class="sabor-nome">${nomeSabor}</span> - R$ ${(item.quantidade * precoSabor).toFixed(2)}`;
      ul.appendChild(liSabor);
    });

    li.appendChild(ul);

    const total = p.pedido.reduce((sum, item) => {
      const sabor = sabores.find(s => s._id === item.saborId);
      const precoSabor = sabor?.preco ?? item.preco ?? 12.00;
      return sum + item.quantidade * precoSabor;
    }, 0);
    const totalP = document.createElement("p");
    totalP.className = "total";
    totalP.innerHTML = `<strong>Total: R$ ${total.toFixed(2)}</strong>`;
    li.appendChild(totalP);

    li.appendChild(btnConcluir);

    lista.appendChild(li);
  });
}

async function zerarComandas() {
  if (!confirm("Tem certeza que deseja zerar todas as comandas?")) return;
  await fetch(`${API_URL}/pedidos`, { method: "DELETE" });
  carregarPedidos();
}

// ---------- ADMIN - SABORES ----------
async function carregarSaboresAdmin() {
  const res = await fetch(`${API_URL}/sabores`);
  const sabores = await res.json();
  const lista = document.getElementById("listaSabores");
  lista.innerHTML = "";

  sabores.forEach(s => {
    const preco = s.preco ?? 12;
    const li = document.createElement("li");
    li.innerHTML = `${s.nome} - Estoque: ${s.quantidade || 0} - R$ ${preco.toFixed(2)}
      <button class="btn-delete" onclick="removerSabor('${s._id}')">Excluir</button>`;
    lista.appendChild(li);
  });
}

async function adicionarSabor(e) {
  e.preventDefault();

  const nomeInput = document.getElementById("nomeSabor");
  const quantidadeInput = document.getElementById("quantidadeSabor");

  if (!nomeInput || !quantidadeInput) {
    alert("Campos do formulário não encontrados!");
    return;
  }

  const nome = nomeInput.value.trim();
  const quantidade = parseInt(quantidadeInput.value);

  if (!nome || isNaN(quantidade)) {
    alert("Preencha todos os campos corretamente!");
    return;
  }


  const preco = 12.00;

  const res = await fetch(`${API_URL}/sabores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, quantidade, preco })
  });

  const data = await res.json();
  if (!res.ok) alert(data.error || "Erro ao adicionar sabor.");

  document.getElementById("formSabor").reset();
  carregarSaboresAdmin();
}


async function removerSabor(id) {
  if (!confirm("Deseja remover este sabor?")) return;
  await fetch(`${API_URL}/sabores/${id}`, { method: "DELETE" });
  carregarSaboresAdmin();
}
