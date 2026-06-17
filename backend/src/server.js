const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sinistrosRouter = require('./routes/sinistros');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ========== CONSULTA PUBLICA POR QR CODE (antes de tudo!) ==========
// Estas rotas precisam vir ANTES dos arquivos estaticos e do catch-all

const Bike = require('./models/Bike');
const User = require('./models/User');
const PrePrintedQR = require('./models/PrePrintedQR');

// Consulta pelo stickerNumber (BSBC-XXXX) - mais curto e facil de ler
// ROTA SERVER-SIDE: serve HTML direto para QR Codes que apontam para /s/XXXX (sem #)
app.get('/s/:stickerNumber', async (req, res) => {
  try {
    // 1. Busca o adesivo pelo stickerNumber
    console.log('[Consulta] Buscando adesivo:', req.params.stickerNumber);
    const qr = await PrePrintedQR.findOne({ stickerNumber: req.params.stickerNumber.toUpperCase() });
    console.log('[Consulta] Resultado:', qr ? 'ENCONTRADO ' + qr.stickerNumber : 'NAO ENCONTRADO');
    
    // Se nao encontrou o adesivo, redireciona para o frontend SPA (com #) para dar melhor UX
    if (!qr) {
      console.log('[Consulta] Redirecionando para SPA /#/s/' + req.params.stickerNumber);
      return res.redirect('/#/s/' + req.params.stickerNumber);
    }

    // 2. Busca a bike vinculada a este adesivo pelo hash
    console.log('[Consulta] Buscando bike com hash:', qr.hash.slice(0, 8));
    const bike = await Bike.findOne({ hash: qr.hash });
    console.log('[Consulta] Bike:', bike ? 'ENCONTRADA ' + bike.name : 'NAO ENCONTRADA');
    
    // Se nao encontrou a bike vinculada, redireciona para o frontend SPA (com #)
    if (!bike) {
      console.log('[Consulta] Redirecionando para SPA /#/s/' + req.params.stickerNumber);
      return res.redirect('/#/s/' + req.params.stickerNumber);
    }

    const owner = await User.findById(bike.userId);
    const isFurtada = bike.status === 'furto';
    const ownerName = owner ? (isFurtada ? owner.name : owner.name.split(' ').map((n, i) => i === 0 ? n : n.charAt(0) + '.').join(' ')) : 'Usuario';
    const ownerPhone = owner ? (isFurtada ? owner.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : owner.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-****')) : '';
    const ownerEmail = (isFurtada && owner) ? owner.email : '';

    const statusHtml = isFurtada
      ? `<div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:0.75rem;padding:1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.75rem"><span style="font-size:1.5rem">🚨</span><div><p style="color:#f87171;font-weight:700;margin:0">EQUIPAMENTO FURTADO</p><p style="color:#fca5a5;font-size:0.75rem;margin:0">Nao compre. Denuncie imediatamente.</p></div></div>`
      : `<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:0.75rem;padding:1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.75rem"><span style="font-size:1.5rem">✅</span><div><p style="color:#34d399;font-weight:700;margin:0">REGISTRO ATIVO</p><p style="color:#6ee7b7;font-size:0.75rem;margin:0">Equipamento em situacao regular</p></div></div>`;

    const contactHtml = isFurtada && owner
      ? `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:0.75rem;padding:1rem;margin-bottom:1rem"><h3 style="color:#fbbf24;font-size:0.625rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.75rem">Contato do Proprietario</h3><p style="color:#fff;font-size:0.875rem;margin-bottom:0.25rem"><strong>${ownerName}</strong></p><p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:0.25rem">${ownerPhone}</p>${ownerEmail ? `<p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:0.25rem">${ownerEmail}</p>` : ''}<p style="color:#64748b;font-size:0.625rem;margin-top:0.5rem">Dados exibidos conforme LGPD (Art. 7, VII)</p></div>`
      : '';

    const photoHtml = bike.photo ? `<div style="margin-bottom:1rem;border-radius:0.75rem;overflow:hidden"><img src="${bike.photo}" style="width:100%;max-height:200px;object-fit:cover"></div>` : '';
    const boHtml = (isFurtada && bike.boNumber) ? `<p style="color:#fca5a5;font-size:0.75rem;margin-bottom:0.5rem"><strong>BO:</strong> ${bike.boNumber}</p>` : '';

    res.send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bike Segura BC - Consulta</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0c1222;color:#fff;min-height:100vh}.container{max-width:480px;margin:0 auto;padding:1.5rem 1rem}.header{display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem}.header img{width:40px;height:40px;border-radius:0.75rem;object-fit:cover}.header h1{font-size:1rem;font-weight:700}.header p{font-size:0.625rem;color:#64748b}.card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;padding:1rem;margin-bottom:1rem}.card h3{color:#fbbf24;font-size:0.625rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.75rem}.data-row{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05)}.data-row:last-child{border-bottom:0}.data-row .icon{width:32px;height:32px;border-radius:0.5rem;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:0.875rem;flex-shrink:0}.data-row .label{color:#64748b;font-size:0.625rem;text-transform:uppercase}.data-row .value{color:#fff;font-size:0.875rem;font-weight:500}.footer{text-align:center;margin-top:2rem}.footer a{color:#fbbf24;text-decoration:none;font-size:0.75rem}.whatsapp-btn{display:inline-flex;align-items:center;gap:0.5rem;background:#25d366;color:#fff;padding:0.75rem 1.5rem;border-radius:0.75rem;text-decoration:none;font-weight:600;font-size:0.875rem;margin-top:1rem}</style></head><body><div class="container"><div class="header"><img src="/logo-oficial.jpg" alt="" onerror="this.style.display='none'"><div><h1>BIKE SEGURA BC</h1><p>Consulta Publica</p></div></div>${statusHtml}${photoHtml}<div class="card"><h3>Dados do Equipamento</h3><div class="data-row"><div class="icon">🚲</div><div><p class="label">Marca / Modelo</p><p class="value">${bike.brand} ${bike.name}</p></div></div><div class="data-row"><div class="icon">🎨</div><div><p class="label">Cor</p><p class="value">${bike.color}</p></div></div><div class="data-row"><div class="icon">🏷️</div><div><p class="label">Numero de Serie</p><p class="value">${bike.serie}</p></div></div>${bike.caracteristicas ? `<div class="data-row"><div class="icon">👁</div><div><p class="label">Caracteristicas</p><p class="value">${bike.caracteristicas}</p></div></div>` : ''}</div>${contactHtml}${isFurtada ? `<div class="card" style="border-color:rgba(239,68,68,0.2)">${boHtml}<p style="color:#94a3b8;font-size:0.75rem;margin-top:0.5rem">Se voce viu esta bike, ajude o proprietario.</p><a href="https://wa.me/5547992458380?text=Denuncia%20bike%20furtada%20-%20${bike.hash}" class="whatsapp-btn" target="_blank">📱 Denunciar</a></div>` : ''}<div class="footer"><a href="/">Cadastre-se no Bike Segura BC</a></div></div></body></html>`);
  } catch (error) {
    console.error('[Consulta] Erro:', error);
    res.status(500).send('Erro ao consultar.');
  }
});

// Consulta pelo hash (fallback)
app.get('/qr/:hash', async (req, res) => {
  try {
    const bike = await Bike.findOne({ hash: req.params.hash.toLowerCase() });
    if (!bike) return res.status(404).json({ error: 'Nao encontrado' });
    res.redirect(`/s/${bike.stickerNumber || req.params.hash}`);
  } catch (error) {
    res.status(500).send('Erro');
  }
});

// ========== API ROUTES ==========
const pushModule = require('./routes/push');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bikes', require('./routes/bikes'));
app.use('/api/preprinted', require('./routes/preprinted'));
app.use('/api/ocorrencias', require('./routes/ocorrencias'));
app.use('/api/sinistros', sinistrosRouter);
app.use('/api/pagamentos', require('./routes/pagamentos'));
app.use('/api/push', pushModule.router);
app.use('/api/noticias', require('./routes/noticias'));

// ========== STATIC FILES (depois das rotas!) ==========
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Serve painel administrativo
app.use('/paineladmin', express.static(path.join(publicPath, 'paineladmin')));
app.get('/paineladmin/*', (req, res) => {
  res.sendFile(path.join(publicPath, 'paineladmin', 'index.html'));
});

// ========== FALLBACK SPA (sempre por ultimo!) ==========
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ========== MONGODB ==========
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERRO: MONGODB_URI nao definida!');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Atlas conectado!');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar MongoDB:', err.message);
    process.exit(1);
  });
