import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { bikeAPI } from '../../utils/api';
import { Bike } from '../../types';

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

  const handleAlertaFurto = (bike: Bike) => {
    Alert.alert(
      '⚠️ ALERTA DE FURTO',
      `Confirma que a bicicleta ${bike.marca} ${bike.modelo} foi furtada?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar Furto',
          style: 'destructive',
          onPress: async () => {
            try {
              await bikeAPI.alertFurto(bike.id);
              Alert.alert(
                'Alerta Acionado',
                'Sua bicicleta foi marcada como FURTADA. Acesse o rastreamento agora.',
                [
                  {
                    text: 'Ver Rastreamento',
                    onPress: () => {
                      if (bike.link_rastreamento) {
                        Linking.openURL(bike.link_rastreamento);
                      } else {
                        Alert.alert(
                          'Link não cadastrado',
                          'Cadastre o link de rastreamento desta bike.'
                        );
                      }
                    },
                  },
                  { text: 'OK' },
                ]
              );
              loadBikes();
            } catch (error: any) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

  const activeBikes = bikes.filter((b) => b.status === 'Ativa');
  const stolenBikes = bikes.filter((b) => b.status === 'Furtada');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {user?.nome_completo?.split(' ')[0]}!</Text>
          <Text style={styles.subtitle}>Suas bicicletas estão protegidas</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="bicycle" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{activeBikes.length}</Text>
            <Text style={styles.statLabel}>Ativas</Text>
          </View>
          <View style={[styles.statCard, styles.statCardDanger]}>
            <Ionicons name="alert-circle" size={32} color="#F44336" />
            <Text style={styles.statNumber}>{stolenBikes.length}</Text>
            <Text style={styles.statLabel}>Furtadas</Text>
          </View>
        </View>

        {stolenBikes.length > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color="#F44336" />
              <Text style={styles.alertTitle}>BICICLETAS FURTADAS</Text>
            </View>
            {stolenBikes.map((bike) => (
              <View key={bike.id} style={styles.alertCard}>
                <View style={styles.alertCardHeader}>
                  <Text style={styles.alertCardTitle}>
                    {bike.marca} {bike.modelo}
                  </Text>
                  <Text style={styles.alertCardDate}>
                    {bike.data_furto
                      ? new Date(bike.data_furto).toLocaleDateString('pt-BR')
                      : ''}
                  </Text>
                </View>
                {bike.link_rastreamento && (
                  <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => Linking.openURL(bike.link_rastreamento!)}
                  >
                    <Ionicons name="location" size={20} color="#fff" />
                    <Text style={styles.trackButtonText}>Ver Rastreamento</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {activeBikes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            {activeBikes.map((bike) => (
              <View key={bike.id} style={styles.bikeCard}>
                <View style={styles.bikeInfo}>
                  <Text style={styles.bikeName}>
                    {bike.marca} {bike.modelo}
                  </Text>
                  <Text style={styles.bikeDetail}>{bike.cor}</Text>
                </View>
                <TouchableOpacity
                  style={styles.alertButton}
                  onPress={() => handleAlertaFurto(bike)}
                >
                  <Ionicons name="alert-circle" size={24} color="#fff" />
                  <Text style={styles.alertButtonText}>FURTO</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {bikes.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma bicicleta cadastrada</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(tabs)/bikes')}
            >
              <Text style={styles.addButtonText}>Cadastrar Primeira Bike</Text>
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: '#4CAF50',
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardDanger: {
    backgroundColor: '#FFEBEE',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  alertSection: {
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alertCardDate: {
    fontSize: 12,
    color: '#666',
  },
  trackButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bikeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bikeDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  alertButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});