let transactions = JSON.parse(localStorage.getItem("ledgerlite_tx") || "null") || [
  { id: 1, date: "2026-11-10", desc: "Domain & Hosting Renewal", category: "Software", amount: 64.00 },
  { id: 2, date: "2026-11-14", desc: "Client Lunch Meeting", category: "Food & Dining", amount: 48.50 },
  { id: 3, date: "2026-11-18", desc: "Local Transit & Fuel", category: "Travel", amount: 112.00 },
];
let budget = Number(localStorage.getItem("ledgerlite_budget") || 2500);
const budgetInput = document.getElementById("budgetInput");
budgetInput.value = budget;

function save() {
  localStorage.setItem("ledgerlite_tx", JSON.stringify(transactions));
  localStorage.setItem("ledgerlite_budget", String(budget));
}

function render() {
  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const remaining = budget - total;
  const pct = budget ? Math.min(100, Math.round((total / budget) * 100)) : 0;

  document.getElementById("summaryCards").innerHTML = `
    <div class="metric"><span>Total Spent</span><strong>$${total.toFixed(2)}</strong></div>
    <div class="metric ${remaining < 0 ? "over" : ""}"><span>Remaining Budget</span><strong>$${remaining.toFixed(2)}</strong></div>
    <div class="metric"><span>Budget Used</span><strong>${pct}%</strong></div>
    <div class="metric"><span>Transactions</span><strong>${transactions.length}</strong></div>
  `;

  const byCat = {};
  transactions.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount); });
  const bars = document.getElementById("categoryBars");
  bars.innerHTML = "";
  Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([cat, val]) => {
    const share = total ? Math.round((val / total) * 100) : 0;
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-label"><span>${cat}</span><span>$${val.toFixed(2)} (${share}%)</span></div>
      <div class="bar-bg"><div class="bar-fg" style="width:${share}%"></div></div>
    `;
    bars.appendChild(row);
  });

  const tbody = document.getElementById("txBody");
  tbody.innerHTML = "";
  transactions.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${t.date}</td><td></td><td>${t.category}</td><td>$${Number(t.amount).toFixed(2)}</td><td><button class="rm">✕</button></td>`;
    tr.children[1].textContent = t.desc;
    tr.querySelector(".rm").onclick = () => {
      transactions = transactions.filter((x) => x.id !== t.id);
      save(); render();
    };
    tbody.appendChild(tr);
  });
}

document.getElementById("txForm").addEventListener("submit", (e) => {
  e.preventDefault();
  transactions.unshift({
    id: Date.now(),
    desc: document.getElementById("txDesc").value.trim(),
    amount: Number(document.getElementById("txAmount").value),
    category: document.getElementById("txCategory").value,
    date: document.getElementById("txDate").value,
  });
  save(); e.target.reset(); render();
});

budgetInput.addEventListener("input", () => {
  budget = Number(budgetInput.value) || 0;
  save(); render();
});

document.getElementById("csvBtn").addEventListener("click", () => {
  const rows = [["Date", "Description", "Category", "Amount"], ...transactions.map((t) => [t.date, t.desc, t.category, t.amount])];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "ledgerlite-expenses.csv";
  a.click();
});

render();
