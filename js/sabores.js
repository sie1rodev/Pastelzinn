/* =========================================
🌮 SABORES ADMIN
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

        <h3>${s.nome}</h3>
        <p>Estoque: ${s.quantidade}</p>
        <p>R$ ${Number(s.preco).toFixed(2)}</p>

      </div>
    `;
  });
}

/* =========================================
🚀 INIT
========================================= */
loadSabores();