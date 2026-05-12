/* =========================================
📊 DASHBOARD
========================================= */
async function loadDashboard() {

  const res = await fetch(`${API}/dashboard`);
  const json = await res.json();

  const vendas = document.getElementById("vendas");
  if (!vendas) return;

  vendas.innerHTML = `
    <div class="card">
      <h2>Vendas Semanais</h2>
      <h1>${json.vendas_semana || 0}</h1>
    </div>
  `;
}

/* =========================================
🚀 INIT
========================================= */
loadDashboard();