import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { bikeAPI } from '../../utils/api';
import { Bike } from '../../types';

const isOnline = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  const now = new Date();
  const date = new Date(dateStr);
  return (now.getTime() - date.getTime()) < 30 * 60 * 1000;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBikes = async () => {
    try {
      const data = await bikeAPI.getAll();
      setBikes(data);
    } catch (error) {
      console.error('Erro ao carregar bikes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBikes();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBikes();
  };

  const totalBikes = bikes.length;
  const monitorando = bikes.filter((b) => b.status === 'Ativa' && isOnline(b.ultima_atualizacao)).length;
  const furtadas = bikes.filter((b) => b.status === 'Furtada').length;
  const offline = bikes.filter((b) => b.status !== 'Furtada' && !isOnline(b.ultima_atualizacao)).length;

  const handleAlertaFurto = () => {
    const bikesAtivas = bikes.filter((b) => b.status === 'Ativa');
    if (bikesAtivas.length === 0) {
      Alert.alert('Sem bikes ativas', 'Nenhuma bicicleta ativa para acionar alerta.');
      return;
    }
    if (bikesAtivas.length === 1) {
      confirmAlerta(bikesAtivas[0]);
      return;
    }
    Alert.alert(
      'Selecione a bicicleta furtada',
      '',
      [
        ...bikesAtivas.map((b) => ({
          text: `${b.marca} ${b.modelo}`,
          onPress: () => confirmAlerta(b),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    );
  };

  const buildWhatsAppMessage = (bike: Bike): string => {
    const linkRastreamento = bike.link_rastreamento || 'Nao cadastrado';
    const msg = `🚨 ALERTA DE FURTO 🚨\n\nBike: ${bike.marca} ${bike.modelo}\nMarca/Modelo: ${bike.marca} ${bike.modelo}\nCor: ${bike.cor}\nSerie: ${bike.numero_serie}\n\nUltima localizacao:\n${linkRastreamento}\n\nBike cadastrada no sistema Bike Segura BC.\nSolicito apoio para verificacao.`;
    return msg;
  };

  const openWhatsApp = (bike: Bike) => {
    const message = buildWhatsAppMessage(bike);
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/5547992458380?text=${encoded}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir o WhatsApp. Verifique se esta instalado.');
    });
  };

  const confirmAlerta = (bike: Bike) => {
    Alert.alert(
      'CONFIRMAR ALERTA DE FURTO',
      `Deseja marcar a bicicleta "${bike.marca} ${bike.modelo}" como furtada e enviar alerta via WhatsApp?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              await bikeAPI.alertFurto(bike.id);
              loadBikes();
              openWhatsApp(bike);
            } catch (error: any) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC107" colors={['#FFC107']} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.greeting}>Ola, {user?.nome_completo?.split(' ')[0]}!</Text>
          <Text style={styles.subtitle}>Central de Monitoramento</Text>
        </View>

        {/* Indicador de monitoramento ativo */}
        {totalBikes > 0 && (
          <View style={styles.monitorBar}>
            <View style={styles.pulseContainer}>
              <View style={styles.pulseDot} />
            </View>
            <Text style={styles.monitorText}>
              {monitorando > 0
                ? `${monitorando} bike${monitorando > 1 ? 's' : ''} sendo monitorada${monitorando > 1 ? 's' : ''}`
                : 'Nenhuma bike online no momento'}
            </Text>
          </View>
        )}

        {/* Metricas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="bicycle" size={28} color="#FFC107" />
            <Text style={styles.statNumber}>{totalBikes}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={[styles.statCard, monitorando > 0 && styles.statCardActive]}>
            <Ionicons name="shield-checkmark" size={28} color="#4CAF50" />
            <Text style={styles.statNumber}>{monitorando}</Text>
            <Text style={styles.statLabel}>Monitorando</Text>
          </View>

          {furtadas > 0 && (
            <View style={[styles.statCard, styles.statCardDanger]}>
              <Ionicons name="alert-circle" size={28} color="#F44336" />
              <Text style={styles.statNumber}>{furtadas}</Text>
              <Text style={styles.statLabel}>Furtadas</Text>
            </View>
          )}

          {offline > 0 && furtadas === 0 && (
            <View style={styles.statCard}>
              <Ionicons name="cloud-offline" size={28} color="#888" />
              <Text style={styles.statNumber}>{offline}</Text>
              <Text style={styles.statLabel}>Offline</Text>
            </View>
          )}
        </View>

        {/* Cadastrar primeira bike */}
        {totalBikes === 0 && (
          <TouchableOpacity style={styles.mainActionButton} onPress={() => router.push('/add-bike')}>
            <Ionicons name="add-circle" size={48} color="#FFC107" />
            <Text style={styles.mainActionTitle}>Cadastre sua Primeira Bike</Text>
            <Text style={styles.mainActionSubtitle}>Proteja sua bicicleta agora</Text>
          </TouchableOpacity>
        )}

        {/* BOTAO ALERTA DE FURTO */}
        {totalBikes > 0 && (
          <TouchableOpacity style={styles.alertFurtoBtn} onPress={handleAlertaFurto}>
            <Ionicons name="alert-circle" size={28} color="#fff" />
            <View style={styles.alertFurtoBtnContent}>
              <Text style={styles.alertFurtoBtnTitle}>ALERTAR FURTO</Text>
              <Text style={styles.alertFurtoBtnSub}>Alerta via WhatsApp + Rastreamento</Text>
            </View>
            <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ALERTA ATIVO DE FURTO */}
        {furtadas > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color="#F44336" />
              <Text style={styles.alertTitle}>RASTREAMENTO ATIVO</Text>
            </View>
            <Text style={styles.alertText}>
              {furtadas} {furtadas === 1 ? 'bicicleta furtada' : 'bicicletas furtadas'}.
              Acesse a localizacao para rastrear.
            </Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => router.push('/(tabs)/bikes')}>
              <Ionicons name="location" size={20} color="#fff" />
              <Text style={styles.alertButtonText}>Ver Localizacao</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Acoes Rapidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso Rapido</Text>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/bikes')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFC107' }]}>
              <Ionicons name="bicycle" size={24} color="#000" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Minhas Bicicletas</Text>
              <Text style={styles.actionSubtitle}>Ver e rastrear bikes cadastradas</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => Linking.openURL('https://delegaciavirtual.sc.gov.br/')}>
            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Delegacia Virtual SC</Text>
              <Text style={styles.actionSubtitle}>Registrar boletim de ocorrencia</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {totalBikes > 0 && (
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-bike')}>
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="add-circle" size={24} color="#fff" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Cadastrar Nova Bike</Text>
                <Text style={styles.actionSubtitle}>Adicionar outra bicicleta</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dicas de Seguranca</Text>
          <View style={styles.tipCard}>
            <Ionicons name="location" size={20} color="#FFC107" />
            <Text style={styles.tipText}>Cadastre o link do rastreador para acesso rapido</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="camera" size={20} color="#FFC107" />
            <Text style={styles.tipText}>Tire fotos de todos os angulos da sua bike</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="key" size={20} color="#FFC107" />
            <Text style={styles.tipText}>Anote o numero de serie em local seguro</Text>
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  scrollContent: { paddingBottom: 100 },
  header: { backgroundColor: '#000', padding: 24, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FFC107' },
  logo: { width: 200, height: 140, marginBottom: 8 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#FFC107', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#fff', marginTop: 4 },
  monitorBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a0a',
    paddingVertical: 12, paddingHorizontal: 16, gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#1a3a1a',
  },
  pulseContainer: { width: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },
  monitorText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#000', padding: 14, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#333',
  },
  statCardActive: { borderColor: '#4CAF50' },
  statCardDanger: { borderColor: '#F44336', backgroundColor: '#2a1a1a' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#FFC107', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'center' },
  mainActionButton: {
    backgroundColor: '#000', margin: 16, padding: 32, borderRadius: 16,
    alignItems: 'center', borderWidth: 2, borderColor: '#FFC107', borderStyle: 'dashed',
  },
  mainActionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFC107', marginTop: 16 },
  mainActionSubtitle: { fontSize: 14, color: '#999', marginTop: 8 },
  alertFurtoBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F44336',
    marginHorizontal: 16, marginTop: 4, marginBottom: 8, padding: 16,
    borderRadius: 12, gap: 12,
  },
  alertFurtoBtnContent: { flex: 1 },
  alertFurtoBtnTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  alertFurtoBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  alertSection: {
    margin: 16, backgroundColor: '#2a1a1a', padding: 20, borderRadius: 12,
    borderWidth: 2, borderColor: '#F44336',
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#F44336' },
  alertText: { fontSize: 14, color: '#fff', marginBottom: 8, lineHeight: 20 },
  alertButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F44336', padding: 14, borderRadius: 8, marginTop: 8, gap: 8,
  },
  alertButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFC107', marginBottom: 16 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#000',
    padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#333',
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  actionSubtitle: { fontSize: 13, color: '#999', marginTop: 4 },
  tipCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#000',
    padding: 12, borderRadius: 8, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#333',
  },
  tipText: { flex: 1, fontSize: 14, color: '#fff' },
  footer: { height: 24 },
});
