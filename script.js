// ====== SABORES (Mock via localStorage) ======
if (!localStorage.getItem("sabores")) {
  const iniciais = [
    { nome: "Carne", img: "https://picsum.photos/100?1", qtd: 10 },
    { nome: "Carne com Queijo", img: "https://picsum.photos/100?2", qtd: 10 },
    { nome: "Frango com Catupiry", img: "https://picsum.photos/100?3", qtd: 10 },
    { nome: "Queijo", img: "https://picsum.photos/100?4", qtd: 10 },
    { nome: "Pizza", img: "https://picsum.photos/100?5", qtd: 10 }
  ];
  localStorage.setItem("sabores", JSON.stringify(iniciais));
}

function getSabores() {
  return JSON.parse(localStorage.getItem("sabores")) || [];
}

function salvarSabores(sabores) {
  localStorage.setItem("sabores", JSON.stringify(sabores));
}


// ====== TELA CLIENTE ======
if (document.getElementById("saboresLista")) {
  const lista = document.getElementById("saboresLista");
  const confirmar = document.getElementById("confirmarPedido");
  let pedidoAtual = {};
  // Exibir apenas sabores com estoque > 0
  const sabores = getSabores().filter(s => (s.qtd ?? 0) > 0);

  sabores.forEach((sabor, i) => {
    const card = document.createElement("div");
    card.className = "sabor-card";
    card.innerHTML = `
      <img src="${sabor.img}" alt="${sabor.nome}">
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
      } else {
        // Nenhum alerta
      }
    });
    card.querySelector(".menos").addEventListener("click", () => {
      if (qtd > 0) {
        qtd--;
        updateQtd();
      }
    });
  });

  confirmar.addEventListener("click", () => {
    const nome = document.getElementById("nomeCliente").value.trim();
  if (!nome) { return; }
  if (Object.keys(pedidoAtual).length === 0) { return; }

    // Verificar estoque antes de confirmar
    const saboresAtual = getSabores();
    for (const [nomeSabor, qtdPedida] of Object.entries(pedidoAtual)) {
      const saborObj = saboresAtual.find(s => s.nome === nomeSabor);
      if (!saborObj || (saborObj.qtd ?? 0) < qtdPedida) {
        return;
      }
    }
    // Descontar estoque
    for (const [nomeSabor, qtdPedida] of Object.entries(pedidoAtual)) {
      const saborObj = saboresAtual.find(s => s.nome === nomeSabor);
      saborObj.qtd = (saborObj.qtd ?? 0) - qtdPedida;
    }
    salvarSabores(saboresAtual);

    const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
    pedidos.push({ nome, itens: pedidoAtual });
    localStorage.setItem("pedidos", JSON.stringify(pedidos));

  // Nenhum alerta de pedido enviado
    window.location.reload();
  });
}

// ====== TELA ADMIN ======
if (document.getElementById("listaPedidos")) {
  const btnZerar = document.getElementById("zerarComandas");
  if (btnZerar) {
    btnZerar.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja zerar todas as comandas?")) {
        localStorage.removeItem("pedidos");
        window.location.reload();
      }
    });
  }
  const listaPedidos = document.getElementById("listaPedidos");
  let pedidos = [];
  try {
    pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
    if (!Array.isArray(pedidos)) pedidos = [];
  } catch (e) {
    pedidos = [];
  }
  let sabores = [];
  try {
    sabores = getSabores();
    if (!Array.isArray(sabores)) sabores = [];
  } catch (e) {
    sabores = [];
  }

  listaPedidos.innerHTML = "";
  if (pedidos.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nenhum pedido encontrado.";
    listaPedidos.appendChild(li);
  } else {
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
}

// ====== TELA SABORES ======
if (document.getElementById("listaSabores")) {
  const form = document.getElementById("formSabor");
  const listaSabores = document.getElementById("listaSabores");

  function renderSabores() {
    listaSabores.innerHTML = "";
    getSabores().forEach((sabor, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${sabor.nome} (Qtd: <input type='number' min='0' value='${sabor.qtd ?? 0}' data-editqtd='${i}' style='width:50px'>)</span>
        <button data-i="${i}">Remover</button>
      `;
      li.querySelector("button").addEventListener("click", () => {
        const sabores = getSabores();
        sabores.splice(i, 1);
        salvarSabores(sabores);
        renderSabores();
      });
      // Editar quantidade direto na lista
      li.querySelector("input[type='number']").addEventListener("change", (e) => {
        const sabores = getSabores();
        sabores[i].qtd = parseInt(e.target.value) || 0;
        salvarSabores(sabores);
      });
      listaSabores.appendChild(li);
    });
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const nome = document.getElementById("novoSabor").value;
    const img = document.getElementById("urlImagem").value;
    const qtd = parseInt(document.getElementById("qtdSabor").value) || 0;
    const sabores = getSabores();
    sabores.push({ nome, img, qtd });
    salvarSabores(sabores);
    renderSabores();
    form.reset();
  });

  renderSabores();
}
