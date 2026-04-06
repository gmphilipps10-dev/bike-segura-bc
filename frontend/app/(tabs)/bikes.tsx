import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
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
      console.error(error);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Bicicletas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-bike')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {bikes.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma bicicleta cadastrada</Text>
            <Text style={styles.emptySubtext}>
              Toque no botão + para cadastrar sua primeira bike
            </Text>
          </View>
        )}

        {bikes.map((bike) => (
          <TouchableOpacity
            key={bike.id}
            style={styles.bikeCard}
            onPress={() => router.push(`/bike-details?id=${bike.id}`)}
          >
            {bike.fotos && bike.fotos[0] && (
              <Image
                source={{ uri: bike.fotos[0] }}
                style={styles.bikeImage}
                resizeMode="cover"
              />
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
              <Text style={styles.bikeDetail}>{bike.cor}</Text>
              <Text style={styles.bikeDetail}>Série: {bike.numero_serie}</Text>
              <View style={styles.bikeFooter}>
                <View style={styles.bikeType}>
                  <Ionicons name="bicycle" size={16} color="#666" />
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
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
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
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  bikeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bikeImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
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
    color: '#333',
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
    color: '#666',
    marginTop: 4,
  },
  bikeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bikeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bikeTypeText: {
    fontSize: 14,
    color: '#666',
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