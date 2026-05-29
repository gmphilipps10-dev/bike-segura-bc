// ===== CONFIG =====
const API = '/bike-segura-bc-backend/api';

let token = '';
let todosClientes = [];
let todosEquips = [];
let todosAdesivos = [];

// ===== LOGIN =====
document.getElementById('btn-login').addEventListener('click', fazerLogin);
document.getElementById('senha').addEventListener('keypress', e => { if (e.key === 'Enter') fazerLogin(); });

async function fazerLogin() {
  const senha = document.getElementById('senha').value;
  const erro = document.getElementById('erro');
  erro.textContent = '';

  try {
    const res = await fetch(`${API}/auth/painel-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    });
    const data = await res.json();

    if (res.ok && data.token) {
      token = data.token;
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('dashboard').style.display = '';
      carregarTudo();
    } else {
      erro.textContent = data.message || 'Senha incorreta';
    }
  } catch {
    erro.textContent = 'Erro de conexao com o servidor';
  }
}

function sair() {
  token = '';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-page').style.display = '';
  document.getElementById('senha').value = '';
}

// ===== NAVEGACAO =====
document.querySelectorAll('.sidebar-menu li').forEach(li => {
  li.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-menu li').forEach(l => l.classList.remove('active'));
    li.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + li.dataset.page).classList.add('active');
  });
});

// ===== FILTROS =====
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderEquips(btn.dataset.filter);
  });
});

document.querySelectorAll('.filter-adesivo').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-adesivo').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAdesivos(btn.dataset.afil);
  });
});

// ===== BUSCA =====
document.getElementById('busca-clientes').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const f = q ? todosClientes.filter(c =>
    (c.name && c.name.toLowerCase().includes(q)) ||
    (c.email && c.email.toLowerCase().includes(q)) ||
    (c.phone && c.phone.includes(q))
  ) : todosClientes;
  renderClientes(f);
});

// ===== GERAR LOTE =====
document.getElementById('btn-gerar').addEventListener('click', async () => {
  const btn = document.getElementById('btn-gerar');
  btn.textContent = 'Gerando...';
  try {
    await fetch(`${API}/preprinted/gerar-lote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ quantidade: 100 }),
    });
    await carregarAdesivos();
    await carregarDashboard();
    btn.textContent = 'Gerar Lote (+100)';
    alert('100 novos adesivos gerados!');
  } catch {
    btn.textContent = 'Gerar Lote (+100)';
    alert('Erro ao gerar lote');
  }
});

// ===== CARREGAR DADOS =====
async function carregarTudo() {
  await Promise.all([carregarDashboard(), carregarClientes(), carregarEquips(), carregarAdesivos()]);
}

async function carregarDashboard() {
  try {
    const [users, bikes, qr] = await Promise.all([
      fetch(`${API}/auth/users`, { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/bikes/all`, { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/preprinted`, { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : {}),
    ]);

    const u = Array.isArray(users) ? users : [];
    const b = Array.isArray(bikes) ? bikes : [];

    document.getElementById('d-clientes').textContent = u.length;
    document.getElementById('d-equips').textContent = b.length;
    document.getElementById('d-protegidos').textContent = b.filter(x => x.protected).length;
    document.getElementById('d-furtos').textContent = b.filter(x => x.status === 'furto').length;
    document.getElementById('d-adesivos-disp').textContent = qr.disponiveis || 0;
    document.getElementById('d-adesivos-usados').textContent = qr.vinculados || 0;
  } catch {}
}

async function carregarClientes() {
  try {
    const res = await fetch(`${API}/auth/users`, { headers: { Authorization: 'Bearer ' + token } });
    todosClientes = res.ok ? await res.json() : [];
    renderClientes(todosClientes);
  } catch { renderClientes([]); }
}

function renderClientes(lista) {
  const tbody = document.getElementById('t-clientes');
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#64748b;padding:24px;">Nenhum cliente</td></tr>'; return; }
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.email)}</td>
      <td>${esc(c.phone)}</td>
      <td>${c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
    </tr>
  `).join('');
}

async function carregarEquips() {
  try {
    const res = await fetch(`${API}/bikes/all`, { headers: { Authorization: 'Bearer ' + token } });
    todosEquips = res.ok ? await res.json() : [];
    renderEquips('todos');
  } catch { renderEquips('todos'); }
}

function renderEquips(filtro) {
  let f = todosEquips;
  if (filtro !== 'todos') f = f.filter(e => e.status === filtro);
  const tbody = document.getElementById('t-equips');
  if (!f.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:24px;">Nenhum equipamento</td></tr>'; return; }
  tbody.innerHTML = f.map(e => {
    const statusClass = e.status === 'furto' ? 'badge-furto' : e.protected ? 'badge-protegido' : 'badge-normal';
    const statusText = e.status === 'furto' ? 'FURTADO' : e.protected ? 'PROTEGIDO' : 'ATIVO';
    return `<tr>
      <td><strong>${esc(e.name || e.brand)}</strong></td>
      <td>${esc(e.brand)}</td>
      <td><code style="font-size:11px;color:#64748b;">${esc(e.serie)}</code></td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>${e.stickerNumber ? `<code style="color:#f59e0b;font-size:11px;">${esc(e.stickerNumber)}</code>` : '-'}</td>
    </tr>`;
  }).join('');
}

async function carregarAdesivos() {
  try {
    const res = await fetch(`${API}/preprinted?limit=200`, { headers: { Authorization: 'Bearer ' + token } });
    const data = res.ok ? await res.json() : {};
    todosAdesivos = data.items || [];
    renderAdesivos('disponivel');
    renderPrintArea();
  } catch { renderAdesivos('disponivel'); }
}

function renderAdesivos(filtro) {
  let f = todosAdesivos;
  if (filtro !== 'todos') f = f.filter(a => a.status === filtro);
  const grid = document.getElementById('grid-adesivos');
  if (!f.length) { grid.innerHTML = '<p style="color:#64748b;text-align:center;padding:24px;">Nenhum adesivo</p>'; return; }
  grid.innerHTML = f.map(a => `
    <div class="ad-item">
      <div class="num">${esc(a.stickerNumber)}</div>
      <div class="hash">${(a.hash || '').toUpperCase().slice(0, 10)}</div>
      <span class="status ${a.status === 'disponivel' ? 'status-disp' : 'status-usado'}">${a.status === 'disponivel' ? 'LIVRE' : 'USADO'}</span>
    </div>
  `).join('');
}

function renderPrintArea() {
  const disp = todosAdesivos.filter(a => a.status === 'disponivel');
  const grid = document.getElementById('print-grid');
  const baseUrl = window.location.origin;
  grid.innerHTML = disp.slice(0, 30).map(a => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(baseUrl + '/qr/' + a.hash)}`;
    return `<div class="print-item">
      <img src="${qrUrl}" alt="">
      <div class="pn">${esc(a.stickerNumber)}</div>
    </div>`;
  }).join('');
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
