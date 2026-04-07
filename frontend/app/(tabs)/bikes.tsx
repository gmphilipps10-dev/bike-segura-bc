import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bikeAPI } from '../../utils/api';
import { Bike } from '../../types';

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

  useEffect(() => {
    loadBikes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBikes();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa':
        return '#4CAF50';
      case 'Furtada':
        return '#F44336';
      case 'Recuperada':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  const getBikeThumbnail = (bike: Bike): string | null => {
    if (bike.fotos && typeof bike.fotos === 'object') {
      return bike.fotos.frente || bike.fotos.lateral_direita || bike.fotos.numero_quadro || null;
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minhas Bicicletas</Text>
          <View style={{ width: 40 }} />
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
            <Text style={styles.emptySubtext}>
              Toque no botao + para cadastrar sua primeira bike
            </Text>
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
          const thumbnail = getBikeThumbnail(bike);
          return (
            <TouchableOpacity
              key={bike.id}
              style={styles.bikeCard}
              onPress={() => router.push(`/bike-details?id=${bike.id}`)}
            >
              {thumbnail ? (
                <Image
                  source={{ uri: thumbnail }}
                  style={styles.bikeImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.bikeImagePlaceholder}>
                  <Ionicons name="bicycle" size={48} color="#333" />
                  <Text style={styles.noPhotoText}>Sem foto</Text>
                </View>
              )}
              <View style={styles.bikeContent}>
                <View style={styles.bikeHeader}>
                  <Text style={styles.bikeName}>
                    {bike.marca} {bike.modelo}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(bike.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{bike.status}</Text>
                  </View>
                </View>
                <Text style={styles.bikeDetail}>Cor: {bike.cor}</Text>
                <Text style={styles.bikeDetail}>Serie: {bike.numero_serie}</Text>
                <View style={styles.bikeFooter}>
                  <View style={styles.bikeType}>
                    <Ionicons name="bicycle" size={16} color="#FFC107" />
                    <Text style={styles.bikeTypeText}>{bike.tipo}</Text>
                  </View>
                  {bike.link_rastreamento && (
                    <View style={styles.trackingIndicator}>
                      <Ionicons name="location" size={16} color="#4CAF50" />
                      <Text style={styles.trackingText}>Rastreamento</Text>
                    </View>
                  )}
                </View>
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
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#FFC107',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  addButton: {
    backgroundColor: '#FFC107',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bikeCard: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  bikeImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#111',
  },
  bikeImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
  },
  bikeContent: {
    padding: 16,
  },
  bikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bikeDetail: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  bikeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  bikeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bikeTypeText: {
    fontSize: 14,
    color: '#FFC107',
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
});
