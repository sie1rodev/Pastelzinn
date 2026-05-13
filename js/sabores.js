/* =========================================
🌮 LISTAR SABORES
========================================= */
async function loadSabores() {

  const lista = document.getElementById("listaSabores");
  if (!lista) return;

  const res = await fetch(`${API}/sabores`);
  const json = await res.json();

  const data = json.data || [];

  lista.innerHTML = "";

  data.forEach(s => {

    lista.innerHTML += `
      <div class="card">

        <div class="card-header">
          <h3>${s.nome}</h3>
          <button class="btn-delete" onclick="deleteSabor('${s.id}')">✕</button>
        </div>

        <p>Estoque: ${s.quantidade}</p>
        <p>R$ ${Number(s.preco).toFixed(2)}</p>

      </div>
    `;
  });
}

/* =========================================
➕ ADICIONAR SABOR
========================================= */
async function addSabor() {

  const nome = document.getElementById("nome").value;
  const quantidade = Number(document.getElementById("qtd").value);
  const preco = Number(document.getElementById("preco").value);

  if (!nome || quantidade < 0 || preco < 0) {
    alert("Preencha corretamente!");
    return;
  }

  await fetch(`${API}/sabores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome,
      quantidade,
      preco
    })
  });

  document.getElementById("nome").value = "";
  document.getElementById("qtd").value = "";
  document.getElementById("preco").value = "";

  loadSabores();
}

/* =========================================
❌ DELETAR SABOR
========================================= */
async function deleteSabor(id) {
  await fetch(`${API}/sabores?id=${id}`, {
    method: "DELETE"
  });

  loadSabores();
}

/* =========================================
🚀 INIT
========================================= */
loadSabores();