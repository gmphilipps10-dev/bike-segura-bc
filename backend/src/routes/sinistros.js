const express = require('express');
const router = express.Router();
const Sinistro = require('../models/Sinistro');
const Bike = require('../models/Bike');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', auth, admin, async (req, res) => {
  try {
    const { status, tipo, prontaResposta, responsavel } = req.query;
    const filtro = {};
    if (status) filtro.status = status;
    if (tipo) filtro.tipo = tipo;
    if (prontaResposta) filtro.prontaResposta = prontaResposta;
    if (responsavel) filtro.responsavel = { $regex: responsavel, $options: 'i' };
    const sinistros = await Sinistro.find(filtro).sort({ createdAt: -1 }).populate('bikeId', 'name brand color photo hash status').populate('userId', 'name email phone');
    res.json(sinistros);
  } catch (err) {
    console.error('Erro ao listar sinistros:', err);
    res.status(500).json({ error: 'Erro ao listar sinistros' });
  }
});

router.get('/stats', auth, admin, async (req, res) => {
  try {
    const stats = {
      abertos: await Sinistro.countDocuments({ status: 'aberto' }),
      suspensos: await Sinistro.countDocuments({ status: 'suspenso' }),
      fechados: await Sinistro.countDocuments({ status: 'fechado' }),
      total: await Sinistro.countDocuments(),
      roubos: await Sinistro.countDocuments({ tipo: 'roubo' }),
      furtos: await Sinistro.countDocuments({ tipo: 'furto' }),
      tentativas: await Sinistro.countDocuments({ tipo: 'tentativa_roubo' }),
      recuperados: await Sinistro.countDocuments({ statusRecuperacao: 'recuperado' }),
      prontaRespostaAcionada: await Sinistro.countDocuments({ prontaResposta: 'acionada' })
    };
    res.json(stats);
  } catch (err) {
    console.error('Erro nas estatísticas:', err);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { bikeId, tipo, dataOcorrencia, localOcorrencia, descricao, boletimOcorrencia, coordenadasOcorrencia } = req.body;
    const bike = await Bike.findOne({ _id: bikeId, userId: req.userId }).populate('userId');
    if (!bike) return res.status(404).json({ error: 'Bicicleta não encontrada' });
    const user = bike.userId;
    const veiculoSnapshot = {
      nome: bike.name || '', tipo: bike.type || 'bicicleta', marca: bike.brand || '', cor: bike.color || '',
      serie: bike.serie || '', hash: bike.hash || '', foto: bike.photo || ''
    };
    const proprietarioSnapshot = { nome: user.name || '', telefone: user.phone || '', email: user.email || '' };
    bike.status = 'furto'; bike.alertDate = new Date(); await bike.save();
    const sinistro = new Sinistro({
      bikeId, userId: user._id, tipo, dataOcorrencia: new Date(dataOcorrencia), localOcorrencia,
      descricao: descricao || '', boletimOcorrencia: boletimOcorrencia || '', coordenadasOcorrencia: coordenadasOcorrencia || null,
      veiculoSnapshot, proprietarioSnapshot, status: 'aberto', statusRecuperacao: 'em_andamento', prontaResposta: 'disponivel'
    });
    await sinistro.save();
    await sinistro.populate('bikeId userId');
    res.status(201).json(sinistro);
  } catch (err) {
    console.error('Erro ao criar sinistro:', err);
    res.status(500).json({ error: 'Erro ao criar sinistro' });
  }
});

router.get('/:id', auth, admin, async (req, res) => {
  try {
    const sinistro = await Sinistro.findById(req.params.id).populate('bikeId', 'name brand color photo hash status serie type').populate('userId', 'name email phone');
    if (!sinistro) return res.status(404).json({ error: 'Sinistro não encontrado' });
    res.json(sinistro);
  } catch (err) {
    console.error('Erro ao buscar sinistro:', err);
    res.status(500).json({ error: 'Erro ao buscar sinistro' });
  }
});

router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { status, statusRecuperacao, prontaResposta, responsavel, observacoes, coordenadasAtual } = req.body;
    const sinistro = await Sinistro.findById(req.params.id);
    if (!sinistro) return res.status(404).json({ error: 'Sinistro não encontrado' });
    if (status) {
      sinistro.status = status;
      if (status === 'fechado') { sinistro.dataFechamento = new Date(); sinistro.diasEmAndamento = Math.floor((Date.now() - sinistro.dataOcorrencia.getTime()) / (1000 * 60 * 60 * 24)); }
      if (status === 'suspenso') sinistro.dataSuspensao = new Date();
    }
    if (statusRecuperacao) sinistro.statusRecuperacao = statusRecuperacao;
    if (prontaResposta) sinistro.prontaResposta = prontaResposta;
    if (responsavel) sinistro.responsavel = responsavel;
    if (observacoes) sinistro.observacoes = observacoes;
    if (coordenadasAtual) sinistro.coordenadasAtual = coordenadasAtual;
    sinistro.dataAtualizacao = Date.now(); await sinistro.save();
    if (statusRecuperacao === 'recuperado') await Bike.findByIdAndUpdate(sinistro.bikeId, { status: 'recuperada', alertDate: null });
    await sinistro.populate('bikeId userId'); res.json(sinistro);
  } catch (err) {
    console.error('Erro ao atualizar sinistro:', err);
    res.status(500).json({ error: 'Erro ao atualizar sinistro' });
  }
});

router.post('/:id/pronta-resposta', auth, admin, async (req, res) => {
  try {
    const sinistro = await Sinistro.findById(req.params.id);
    if (!sinistro) return res.status(404).json({ error: 'Sinistro não encontrado' });
    sinistro.prontaResposta = 'acionada'; sinistro.statusRecuperacao = 'em_andamento'; sinistro.dataAtualizacao = Date.now();
    const obs = `Pronta resposta acionada em ${new Date().toLocaleString('pt-BR')} por ${req.user?.name || 'Admin'}`;
    sinistro.observacoes = sinistro.observacoes ? `${sinistro.observacoes}
${obs}` : obs;
    await sinistro.save();
    res.json({ success: true, message: 'Pronta resposta acionada', sinistro });
  } catch (err) {
    console.error('Erro ao acionar pronta resposta:', err);
    res.status(500).json({ error: 'Erro ao acionar pronta resposta' });
  }
});

router.post('/:id/rastreamento', auth, async (req, res) => {
  try {
    const { lat, lng, velocidade, bateria } = req.body;
    const sinistro = await Sinistro.findById(req.params.id);
    if (!sinistro) return res.status(404).json({ error: 'Sinistro não encontrado' });
    const isOwner = String(sinistro.userId) === String(req.userId);
    const isAdmin = req.isPainelAdmin || req.user?.isAdmin;
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Acesso negado' });
    const novaCoordenada = { lat, lng, timestamp: new Date(), velocidade: velocidade || 0, bateria: bateria || 100 };
    sinistro.historicoRastreamento.push(novaCoordenada);
    sinistro.coordenadasAtual = { lat, lng };
    sinistro.ultimaAtualizacaoRastreador = new Date();
    sinistro.rastreadorOnline = true; sinistro.bateriaRastreador = bateria || 100;
    sinistro.dataAtualizacao = Date.now(); await sinistro.save();
    res.json({ success: true, coordenada: novaCoordenada });
  } catch (err) {
    console.error('Erro ao registrar rastreamento:', err);
    res.status(500).json({ error: 'Erro ao registrar rastreamento' });
  }
});

router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const sinistro = await Sinistro.findById(req.params.id);
    if (!sinistro) return res.status(404).json({ error: 'Sinistro não encontrado' });
    await Bike.findByIdAndUpdate(sinistro.bikeId, { status: 'normal', alertDate: null });
    await Sinistro.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sinistro removido' });
  } catch (err) {
    console.error('Erro ao deletar sinistro:', err);
    res.status(500).json({ error: 'Erro ao deletar sinistro' });
  }
});

module.exports = router;
