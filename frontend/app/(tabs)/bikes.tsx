import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bikeAPI } from '../../utils/api';
import { Bike } from '../../types';

const getTimeAgo = (dateStr?: string): string => {
  if (!dateStr) return 'Sem dados';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `ha ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `ha ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `ha ${diffD} dia${diffD > 1 ? 's' : ''}`;
};

const isOnline = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  return diffMs < 30 * 60 * 1000; // 30 min
};

const getStatusConfig = (status: string, lastUpdate?: string) => {
  switch (status) {
    case 'Furtada':
      return { color: '#F44336', text: 'Furtada (rastreamento ativo)', icon: 'alert-circle' as const };
    case 'Ativa':
      if (isOnline(lastUpdate)) {
        return { color: '#4CAF50', text: 'Ativa (monitorando)', icon: 'shield-checkmark' as const };
      }
      return { color: '#888', text: 'Sem sinal', icon: 'cloud-offline' as const };
    case 'Offline':
      return { color: '#888', text: 'Sem sinal', icon: 'cloud-offline' as const };
    default:
      return { color: '#4CAF50', text: 'Ativa (monitorando)', icon: 'shield-checkmark' as const };
  }
};

export default function BikesScreen() {
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

  const handleTracking = (bike: Bike) => {
    if (bike.link_rastreamento) {
      Linking.openURL(bike.link_rastreamento);
    } else {
      Alert.alert('Sem rastreamento', 'Nenhum link de rastreamento cadastrado para esta bicicleta.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minhas Bicicletas</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC107" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Bicicletas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-bike')}
        >
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFC107"
            colors={['#FFC107']}
          />
        }
      >
        {bikes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>Nenhuma bicicleta cadastrada</Text>
            <Text style={styles.emptySubtext}>Toque no + para cadastrar sua primeira bike</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-bike')}
            >
              <Ionicons name="add-circle" size={20} color="#000" />
              <Text style={styles.emptyButtonText}>Cadastrar Bicicleta</Text>
            </TouchableOpacity>
          </View>
        )}

        {bikes.map((bike) => {
          const statusCfg = getStatusConfig(bike.status, bike.ultima_atualizacao);
          const online = isOnline(bike.ultima_atualizacao);
          const isFurtada = bike.status === 'Furtada';

          return (
            <TouchableOpacity
              key={bike.id}
              style={[styles.bikeCard, isFurtada && styles.bikeCardFurtada]}
              onPress={() => router.push(`/bike-details?id=${bike.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                {/* Nome e Status */}
                <View style={styles.cardTop}>
                  <Text style={styles.bikeName} numberOfLines={1}>
                    {bike.marca} {bike.modelo}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.color }]}>
                    <Ionicons name={statusCfg.icon} size={12} color="#fff" />
                    <Text style={styles.statusText} numberOfLines={1}>{statusCfg.text}</Text>
                  </View>
                </View>

                {/* Indicador de tempo real */}
                <View style={styles.updateRow}>
                  <View style={[styles.onlineDot, { backgroundColor: online ? '#4CAF50' : '#F44336' }]} />
                  <Text style={styles.updateText}>
                    {online ? 'Online' : 'Offline'} - Atualizado {getTimeAgo(bike.ultima_atualizacao)}
                  </Text>
                </View>

                {/* Botao de localizacao */}
                <TouchableOpacity
                  style={[
                    styles.trackingButton,
                    isFurtada ? styles.trackingButtonFurtada : styles.trackingButtonAtiva,
                  ]}
                  onPress={() => handleTracking(bike)}
                >
                  <Ionicons name="location" size={20} color={isFurtada ? '#fff' : '#000'} />
                  <Text style={[
                    styles.trackingButtonText,
                    isFurtada ? styles.trackingTextFurtada : styles.trackingTextAtiva,
                  ]}>
                    Ver localizacao
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: '#FFC107',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFC107' },
  addButton: {
    backgroundColor: '#FFC107', width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 48, marginTop: 64 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFC107',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 24, gap: 8,
  },
  emptyButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  bikeCard: {
    backgroundColor: '#000', marginHorizontal: 16, marginTop: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#333', overflow: 'hidden',
  },
  bikeCardFurtada: { borderColor: '#F44336', borderWidth: 2 },
  cardContent: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  bikeName: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1, marginRight: 8 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, gap: 4, flexShrink: 0,
  },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  updateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  updateText: { fontSize: 13, color: '#999' },
  trackingButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 10, gap: 8,
  },
  trackingButtonAtiva: { backgroundColor: '#FFC107' },
  trackingButtonFurtada: { backgroundColor: '#F44336' },
  trackingButtonText: { fontSize: 16, fontWeight: 'bold' },
  trackingTextAtiva: { color: '#000' },
  trackingTextFurtada: { color: '#fff' },
});
