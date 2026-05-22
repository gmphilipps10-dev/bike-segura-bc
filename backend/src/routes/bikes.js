const express = require('express');
const Bike = require('../models/Bike');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Todas as rotas precisam de autenticacao
router.use(authMiddleware);

// Listar bikes do usuario
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find({ userId: req.userId });
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar bikes.' });
  }
});

// Criar bike
router.post('/', async (req, res) => {
  try {
    const { name, type, brand, serie, color, value, photo, rastreamento, plataformaTag, caracteristicas } = req.body;

    if (!name || !brand || !serie || !color) {
      return res.status(400).json({ message: 'Preencha os campos obrigatorios.' });
    }

    const bike = new Bike({
      userId: req.userId,
      name,
      type: type || 'Nao informado',
      brand,
      serie,
      color,
      value: value || '',
      photo: photo || null,
      rastreamento: rastreamento || '',
      plataformaTag: plataformaTag || '',
      caracteristicas: caracteristicas || '',
    });

    await bike.save();
    res.status(201).json(bike);
  } catch (error) {
    console.error('Create bike error:', error);
    res.status(500).json({ message: 'Erro ao cadastrar bike.' });
  }
});

// Atualizar bike
router.put('/:id', async (req, res) => {
  try {
    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!bike) return res.status(404).json({ message: 'Bike nao encontrada.' });
    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar bike.' });
  }
});

// Deletar bike
router.delete('/:id', async (req, res) => {
  try {
    const bike = await Bike.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!bike) return res.status(404).json({ message: 'Bike nao encontrada.' });
    res.json({ message: 'Bike removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover bike.' });
  }
});

module.exports = router;
