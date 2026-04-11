import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bikeAPI } from '../utils/api';
import { Bike } from '../types';

const TIPOS_BIKE = ['Mountain Bike', 'Speed/Road', 'Urbana', 'BMX', 'Eletrica', 'Gravel', 'Dobravel', 'Infantil', 'Outra'];

export default function EditBikeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bike, setBike] = useState<Bike | null>(null);

  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [tipo, setTipo] = useState('');
  const [caracteristicas, setCaracteristicas] = useState('');
  const [linkRastreamento, setLinkRastreamento] = useState('');

  useEffect(() => {
    loadBike();
  }, [id]);

  const loadBike = async () => {
    try {
      const data = await bikeAPI.getOne(id as string);
      setBike(data);
      setMarca(data.marca || '');
      setModelo(data.modelo || '');
      setCor(data.cor || '');
      setNumeroSerie(data.numero_serie || '');
      setTipo(data.tipo || '');
      setCaracteristicas(data.caracteristicas || '');
      setLinkRastreamento(data.link_rastreamento || '');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!marca.trim() || !modelo.trim() || !cor.trim()) {
      Alert.alert('Campos obrigatorios', 'Marca, Modelo e Cor sao obrigatorios.');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        marca: marca.trim(),
        modelo: modelo.trim(),
        cor: cor.trim(),
        numero_serie: numeroSerie.trim(),
        tipo: tipo || 'Outra',
        caracteristicas: caracteristicas.trim() || null,
        link_rastreamento: linkRastreamento.trim() || null,
      };

      await bikeAPI.update(id as string, updateData);
      Alert.alert('Salvo!', 'Dados da bicicleta atualizados com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC107" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Bicicleta</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Marca */}
          <View style={styles.field}>
            <Text style={styles.label}>Marca *</Text>
            <TextInput
              style={styles.input}
              value={marca}
              onChangeText={setMarca}
              placeholder="Ex: Caloi, Specialized..."
              placeholderTextColor="#666"
            />
          </View>

          {/* Modelo */}
          <View style={styles.field}>
            <Text style={styles.label}>Modelo *</Text>
            <TextInput
              style={styles.input}
              value={modelo}
              onChangeText={setModelo}
              placeholder="Ex: Elite, Tarmac..."
              placeholderTextColor="#666"
            />
          </View>

          {/* Cor */}
          <View style={styles.field}>
            <Text style={styles.label}>Cor *</Text>
            <TextInput
              style={styles.input}
              value={cor}
              onChangeText={setCor}
              placeholder="Ex: Preta, Vermelha..."
              placeholderTextColor="#666"
            />
          </View>

          {/* Numero de Serie */}
          <View style={styles.field}>
            <Text style={styles.label}>Numero de Serie</Text>
            <TextInput
              style={styles.input}
              value={numeroSerie}
              onChangeText={setNumeroSerie}
              placeholder="Numero gravado no quadro"
              placeholderTextColor="#666"
            />
          </View>

          {/* Tipo */}
          <View style={styles.field}>
            <Text style={styles.label}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tipoContainer}>
                {TIPOS_BIKE.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tipoChip, tipo === t && styles.tipoChipActive]}
                    onPress={() => setTipo(t)}
                  >
                    <Text style={[styles.tipoChipText, tipo === t && styles.tipoChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Caracteristicas */}
          <View style={styles.field}>
            <Text style={styles.label}>Caracteristicas / Observacoes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={caracteristicas}
              onChangeText={setCaracteristicas}
              placeholder="Acessorios, modificacoes, detalhes unicos..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Link Rastreamento */}
          <View style={styles.field}>
            <Text style={styles.label}>Link de Rastreamento</Text>
            <TextInput
              style={styles.input}
              value={linkRastreamento}
              onChangeText={setLinkRastreamento}
              placeholder="https://..."
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.hint}>URL do rastreador GPS (Apple AirTag, Samsung SmartTag, etc.)</Text>
          </View>

          {/* Botao Salvar */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#000" />
                <Text style={styles.saveButtonText}>SALVAR ALTERACOES</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: '#FFC107',
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#FFC107', marginBottom: 8 },
  input: {
    backgroundColor: '#000', borderWidth: 1, borderColor: '#333', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#fff',
  },
  textArea: { minHeight: 100 },
  hint: { fontSize: 12, color: '#666', marginTop: 6 },
  tipoContainer: { flexDirection: 'row', gap: 8 },
  tipoChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#000', borderWidth: 1, borderColor: '#333',
  },
  tipoChipActive: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
  tipoChipText: { color: '#999', fontSize: 13, fontWeight: '600' },
  tipoChipTextActive: { color: '#000' },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFC107', padding: 18, borderRadius: 12, gap: 10, marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
