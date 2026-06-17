const crypto = require('crypto');
const PrePrintedQR = require('../models/PrePrintedQR');
const Bike = require('../models/Bike');

if (!process.env.QR_SALT) {
  throw new Error('QR_SALT nao configurada');
}

const SALT = process.env.QR_SALT;

function generateStickerNumber(prefixo, sequencia) {
  return `${prefixo}-${String(sequencia).padStart(4, '0')}`;
}

function generateHash(stickerNumber) {
  return crypto.createHash('sha256')
    .update(stickerNumber + SALT + Date.now() + Math.random())
    .digest('hex')
    .slice(0, 12);
}

async function gerarLote(quantidade = 100, prefixo = 'BSBC') {
  const ultimo = await PrePrintedQR.findOne({ stickerNumber: new RegExp(`^${prefixo}-`) })
    .sort({ stickerNumber: -1 })
    .select('stickerNumber');

  let sequencia = 1;
  if (ultimo) {
    const match = ultimo.stickerNumber.match(/-(\d+)$/);
    if (match) sequencia = parseInt(match[1]) + 1;
  }

  const docs = [];
  for (let i = 0; i < quantidade; i++) {
    const stickerNumber = generateStickerNumber(prefixo, sequencia + i);
    const hash = generateHash(stickerNumber);
    docs.push({ stickerNumber, hash, lote: 'auto', status: 'disponivel' });
  }

  await PrePrintedQR.insertMany(docs, { ordered: false }).catch(err => {
    if (err.code !== 11000) throw err;
  });

  console.log(`[QR-Lote] ${quantidade} adesivos gerados: ${docs[0].stickerNumber} ate ${docs[docs.length - 1].stickerNumber}`);
  return docs;
}

async function vincularProximoQR(bikeId, userId) {
  let qr = await PrePrintedQR.findOneAndUpdate(
    { status: 'disponivel' },
    { status: 'vinculado', bikeId, userId, vinculadoAt: new Date() },
    { sort: { stickerNumber: 1 }, new: true }
  );

  if (!qr) {
    console.log('[QR-Auto] Estoque vazio. Gerando 100 novos...');
    await gerarLote(100, 'BSBC');
    qr = await PrePrintedQR.findOneAndUpdate(
      { status: 'disponivel' },
      { status: 'vinculado', bikeId, userId, vinculadoAt: new Date() },
      { sort: { stickerNumber: 1 }, new: true }
    );
  }

  if (!qr) return { hash: null, stickerNumber: null };

  await Bike.findByIdAndUpdate(bikeId, { hash: qr.hash });
  return { hash: qr.hash, stickerNumber: qr.stickerNumber };
}

module.exports = { gerarLote, vincularProximoQR, generateHash };
