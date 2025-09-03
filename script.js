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

    li.innerHTML = `<strong>${p.nomeCliente}</strong>`;

    const ul = document.createElement("ul");
    p.pedido.forEach(item => {
      const sabor = sabores.find(s => s._id === item.saborId);
      const nomeSabor = sabor ? sabor.nome : "Sabor removido";
      const precoSabor = sabor?.preco ?? item.preco ?? 12.00;
      const liSabor = document.createElement("li");
      liSabor.innerHTML = `<span class="sabor-quantidade">${item.quantidade}x</span> <span class="sabor-nome">${nomeSabor}</span> <br/> <span>R$ ${(item.quantidade * precoSabor).toFixed(2)}</span>`;
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

    // Botão concluir
    const btnConcluir = document.createElement("button");
    btnConcluir.textContent = "Concluir comanda";
    btnConcluir.className = "btn-danger btn-concluir";
    btnConcluir.addEventListener("click", async () => {
      if (!confirm("Deseja concluir esta comanda?")) return;
      await fetch(`${API_URL}/pedidos/${p._id}`, { method: "DELETE" });
      carregarPedidos();
    });

    // Botão editar
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar comanda";
    btnEditar.className = "btn-primary btn-editar";
    btnEditar.addEventListener("click", () => entrarModoEdicao(li, p, sabores));

    li.appendChild(btnConcluir);
    li.appendChild(btnEditar);

    lista.appendChild(li);
  });
}

async function zerarComandas() {
  if (!confirm("Tem certeza que deseja zerar todas as comandas?")) return;
  await fetch(`${API_URL}/pedidos`, { method: "DELETE" });
  carregarPedidos();
}

// ---------- EDITAR PEDIDO ----------
function entrarModoEdicao(li, pedido, sabores) {
  li.innerHTML = ""; 

  const titulo = document.createElement("h3");
  titulo.textContent = `Editando: ${pedido.nomeCliente}`;
  li.appendChild(titulo);

  const form = document.createElement("div");
  form.classList.add("form-edicao");

  // Sabores já no pedido
  pedido.pedido.forEach(item => {
    const sabor = sabores.find(s => s._id === item.saborId);
    if (!sabor) return;

    const linha = document.createElement("div");
    linha.classList.add("linha-edicao");

    const label = document.createElement("span");
    label.textContent = `${sabor.nome} (estoque: ${sabor.quantidade})`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.value = item.quantidade;
    input.dataset.saborId = sabor._id;
    input.dataset.preco = sabor.preco ?? 12;

    linha.appendChild(label);
    linha.appendChild(input);
    form.appendChild(linha);
  });

  // Adicionar novos sabores disponíveis
  const novosSabores = document.createElement("div");
  novosSabores.classList.add("novos-sabores");
  sabores.forEach(sabor => {
    if (pedido.pedido.some(i => i.saborId === sabor._id)) return; // já está no pedido

    const linha = document.createElement("div");
    linha.classList.add("linha-edicao");

    const label = document.createElement("span");
    label.textContent = `${sabor.nome} (estoque: ${sabor.quantidade})`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.value = 0;
    input.dataset.saborId = sabor._id;
    input.dataset.preco = sabor.preco ?? 12;

    linha.appendChild(label);
    linha.appendChild(input);
    novosSabores.appendChild(linha);
  });

  form.appendChild(novosSabores);
  li.appendChild(form);

  const actions = document.createElement("div");
  actions.classList.add("acoes-edicao");

  const btnSalvar = document.createElement("button");
  btnSalvar.textContent = "Salvar alterações";
  btnSalvar.className = "btn-success";
  btnSalvar.addEventListener("click", async () => {
    const novoPedido = [];
    form.querySelectorAll("input").forEach(input => {
      const qtd = parseInt(input.value);
      if (!isNaN(qtd) && qtd > 0) {
        novoPedido.push({
          saborId: input.dataset.saborId,
          quantidade: qtd,
          preco: parseFloat(input.dataset.preco)
        });
      }
    });

    const res = await fetch(`${API_URL}/pedidos/${pedido._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeCliente: pedido.nomeCliente, pedido: novoPedido })
    });

    const data = await res.json();
    if (res.ok) {
      alert("Comanda atualizada!");
      carregarPedidos();
    } else {
      alert(data.error || "Erro ao atualizar comanda.");
    }
  });

  const btnCancelar = document.createElement("button");
  btnCancelar.textContent = "Cancelar";
  btnCancelar.className = "btn-secondary";
  btnCancelar.addEventListener("click", carregarPedidos);

  actions.appendChild(btnSalvar);
  actions.appendChild(btnCancelar);

  li.appendChild(actions);
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
    li.innerHTML = `${s.nome} <br/>  Estoque: ${s.quantidade || 0} <br/> R$ ${preco.toFixed(2)}
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
