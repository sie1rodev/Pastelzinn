const API_URL = "https://api-pastelzinn.vercel.app";

// ---------- Inicialização ----------
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("saboresLista")) {
    carregarSaboresCliente();
    document.getElementById("confirmarPedido").addEventListener("click", enviarPedido);
  }

  if (document.getElementById("listaPedidos")) {
    carregarPedidos();
    document.getElementById("zerarComandas").addEventListener("click", zerarComandas);
  }

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
    const preco = sabor.preco ?? 12.00; // fallback caso não tenha preço
    const div = document.createElement("div");
    div.className = "sabor-card";
    div.innerHTML = `
      <span>${sabor.nome} (Estoque: ${sabor.quantidade || 0}) - R$ ${preco.toFixed(2)}</span>
      <input type="number" min="0" value="0" id="qtd-${sabor._id}" style="width:60px;">
    `;
    lista.appendChild(div);
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
    li.innerHTML = `<strong>${p.nomeCliente}</strong>`;
    
    const ul = document.createElement("ul");
    p.pedido.forEach(item => {
      const sabor = sabores.find(s => s._id === item.saborId);
      const nomeSabor = sabor ? sabor.nome : "Sabor removido";
      const precoSabor = sabor?.preco ?? item.preco ?? 12.00;
      const liSabor = document.createElement("li");
      liSabor.textContent = `${item.quantidade}x ${nomeSabor} - R$ ${(item.quantidade * precoSabor).toFixed(2)}`;
      ul.appendChild(liSabor);
    });

    li.appendChild(ul);

    const total = p.pedido.reduce((sum, item) => {
      const sabor = sabores.find(s => s._id === item.saborId);
      const precoSabor = sabor?.preco ?? item.preco ?? 12.00;
      return sum + item.quantidade * precoSabor;
    }, 0);
    const totalP = document.createElement("p");
    totalP.innerHTML = `<strong>Total: R$ ${total.toFixed(2)}</strong>`;
    li.appendChild(totalP);

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
    const preco = s.preco ?? 0;
    const li = document.createElement("li");
    li.innerHTML = `${s.nome} - Estoque: ${s.quantidade || 0} - R$ ${preco.toFixed(2)}
      <button onclick="removerSabor('${s._id}')">Excluir</button>`;
    lista.appendChild(li);
  });
}

async function adicionarSabor(e) {
  e.preventDefault();
  const nome = document.getElementById("nomeSabor").value.trim();
  const quantidade = parseInt(document.getElementById("quantidadeSabor").value);
  const preco = parseFloat(document.getElementById("precoSabor").value);
  if (!nome || isNaN(quantidade) || isNaN(preco)) return;

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
