
// ====== API REST ======
async function getSabores() {
  const res = await fetch('https://api-pastelzinn.vercel.app/sabores');
  return await res.json();
}
async function salvarSabor(sabor) {
  await fetch('https://api-pastelzinn.vercel.app/sabores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sabor)
  });
}
async function removerSabor(id) {
  await fetch(`https://api-pastelzinn.vercel.app/sabores/${id}`, { method: 'DELETE' });
}
async function getPedidos() {
  const res = await fetch('https://api-pastelzinn.vercel.app/pedidos');
  return await res.json();
}
async function salvarPedido(pedido) {
  await fetch('https://api-pastelzinn.vercel.app/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido)
  });
}
async function zerarPedidos() {
  await fetch('https://api-pastelzinn.vercel.app/pedidos', { method: 'DELETE' });
}


// ====== TELA CLIENTE (API) ======
if (document.getElementById("saboresLista")) {
  const lista = document.getElementById("saboresLista");
  const confirmar = document.getElementById("confirmarPedido");
  let pedidoAtual = {};

  async function renderSaboresCliente() {
    lista.innerHTML = "";
    const sabores = (await getSabores()).filter(s => (s.qtd ?? 0) > 0);
    sabores.forEach((sabor, i) => {
      const card = document.createElement("div");
      card.className = "sabor-card";
      card.innerHTML = `
  <img src="${sabor.img}" alt="${sabor.nome}" style="width: 110px; height: 110px; object-fit: cover; border-radius: 20px; border: 3px solid #00adb5; background: #fff; box-shadow: 0 4px 18px rgba(0,173,181,0.10);">
        <div class="sabor-info">
          <h3>${sabor.nome}</h3>
          <div class="controles">
            <button class="menos">-</button>
            <span id="qtd-${i}">0</span>
            <button class="mais">+</button>
          </div>
          <div class="estoque">Disponível: <span id="estoque-${i}">${sabor.qtd ?? 0}</span></div>
        </div>
      `;
      lista.appendChild(card);

      let qtd = 0;
      function updateQtd() {
        document.getElementById(`qtd-${i}`).innerText = qtd;
        if (qtd > 0) pedidoAtual[sabor.nome] = qtd;
        else delete pedidoAtual[sabor.nome];
      }
      card.querySelector(".mais").addEventListener("click", () => {
        if ((sabor.qtd ?? 0) > qtd) {
          qtd++;
          updateQtd();
        }
      });
      card.querySelector(".menos").addEventListener("click", () => {
        if (qtd > 0) {
          qtd--;
          updateQtd();
        }
      });
    });
  }

  renderSaboresCliente();

  confirmar.addEventListener("click", async () => {
    const nome = document.getElementById("nomeCliente").value.trim();
    if (!nome) { return; }
    if (Object.keys(pedidoAtual).length === 0) { return; }

    // Verificar estoque antes de confirmar
    const saboresAtual = await getSabores();
    for (const [nomeSabor, qtdPedida] of Object.entries(pedidoAtual)) {
      const saborObj = saboresAtual.find(s => s.nome === nomeSabor);
      if (!saborObj || (saborObj.qtd ?? 0) < qtdPedida) {
        return;
      }
    }
    // Descontar estoque e atualizar na API
    for (const [nomeSabor, qtdPedida] of Object.entries(pedidoAtual)) {
      const saborObj = saboresAtual.find(s => s.nome === nomeSabor);
      if (saborObj) {
        saborObj.qtd = (saborObj.qtd ?? 0) - qtdPedida;
        await fetch(`https://api-pastelzinn.vercel.app/sabores/${saborObj.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saborObj)
        });
      }
    }
    await salvarPedido({ nome, itens: pedidoAtual });
    window.location.reload();
  });
}

// ====== TELA ADMIN (API) ======
if (document.getElementById("listaPedidos")) {
  const btnZerar = document.getElementById("zerarComandas");
  const listaPedidos = document.getElementById("listaPedidos");

  // Funções API
  async function getPedidos() {
    const res = await fetch('https://api-pastelzinn.vercel.app/pedidos');
    return await res.json();
  }
  async function getSaboresAPI() {
    const res = await fetch('https://api-pastelzinn.vercel.app/sabores');
    return await res.json();
  }
  async function zerarPedidos() {
    await fetch('https://api-pastelzinn.vercel.app/pedidos', { method: 'DELETE' });
  }

  async function renderPedidos() {
    listaPedidos.innerHTML = "";
    const [pedidos, sabores] = await Promise.all([getPedidos(), getSaboresAPI()]);
    if (!pedidos.length) {
      const li = document.createElement("li");
      li.textContent = "Nenhum pedido encontrado.";
      listaPedidos.appendChild(li);
      return;
    }
    pedidos.forEach((pedido) => {
      const li = document.createElement("li");
      li.className = "pedido";
      let itensHtml = "";
      if (pedido.itens && typeof pedido.itens === "object") {
        itensHtml = '<ul style="margin:8px 0 0 0;padding-left:18px;">' +
          Object.entries(pedido.itens).map(([sabor, qtd]) => {
            return `<li>${sabor}: ${qtd}</li>`;
          }).join("") + '</ul>';
      }
      li.innerHTML = `
        <strong style="font-size:1.18rem;color:#007b83;letter-spacing:0.5px;">${pedido.nome || "(Sem nome)"}</strong><br>
        <div style="margin:6px 0 0 0;font-size:1.05rem;color:#222831;font-weight:500;">${itensHtml}</div>
        <br>
        <button class="ok">Concluído</button>
      `;
      li.querySelector(".ok").addEventListener("click", () => {
        li.style.background = "#d4edda";
      });
      listaPedidos.appendChild(li);
    });
  }

  if (btnZerar) {
    btnZerar.addEventListener("click", async () => {
      if (confirm("Tem certeza que deseja zerar todas as comandas?")) {
        await zerarPedidos();
        renderPedidos();
      }
    });
  }

  renderPedidos();
}

// ====== TELA SABORES (API) ======
if (document.getElementById("listaSabores")) {
  const form = document.getElementById("formSabor");
  const listaSabores = document.getElementById("listaSabores");

  async function renderSaboresAdmin() {
    listaSabores.innerHTML = "";
    const sabores = await getSabores();
    sabores.forEach((sabor) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${sabor.nome} (Qtd: <input type='number' min='0' value='${sabor.qtd ?? 0}' data-editqtd='${sabor.id}' style='width:50px'>)</span>
        <button data-i="${sabor.id}">Remover</button>
      `;
      li.querySelector("button").addEventListener("click", async () => {
        await removerSabor(sabor.id);
        renderSaboresAdmin();
      });
      // Editar quantidade direto na lista
      li.querySelector("input[type='number']").addEventListener("change", async (e) => {
        const novoQtd = parseInt(e.target.value) || 0;
        const saborEditado = { ...sabor, qtd: novoQtd };
        await fetch(`https://api-pastelzinn.vercel.app/sabores/${sabor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saborEditado)
        });
      });
      listaSabores.appendChild(li);
    });
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const nome = document.getElementById("novoSabor").value;
    const img = document.getElementById("urlImagem").value;
    const qtd = parseInt(document.getElementById("qtdSabor").value) || 0;
    await salvarSabor({ nome, img, qtd });
    renderSaboresAdmin();
    form.reset();
  });

  renderSaboresAdmin();
}
