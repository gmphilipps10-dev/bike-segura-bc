import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Image,
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

  const activeBikes = bikes.filter((b) => b.status === 'Ativa').length;
  const stolenBikes = bikes.filter((b) => b.status === 'Furtada').length;
  const totalBikes = bikes.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header com Logo */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.greeting}>Olá, {user?.nome_completo?.split(' ')[0]}!</Text>
          <Text style={styles.subtitle}>Central de Segurança</Text>
        </View>

        {/* Estatísticas Gerais */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="bicycle" size={32} color="#FFC107" />
            <Text style={styles.statNumber}>{totalBikes}</Text>
            <Text style={styles.statLabel}>
              {totalBikes === 1 ? 'Bicicleta' : 'Bicicletas'}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{activeBikes}</Text>
            <Text style={styles.statLabel}>Protegidas</Text>
          </View>

          {stolenBikes > 0 && (
            <View style={[styles.statCard, styles.statCardDanger]}>
              <Ionicons name="alert-circle" size={32} color="#F44336" />
              <Text style={styles.statNumber}>{stolenBikes}</Text>
              <Text style={styles.statLabel}>Furtadas</Text>
            </View>
          )}
        </View>

        {/* Botão Principal - Cadastrar Bike */}
        {totalBikes === 0 && (
          <TouchableOpacity
            style={styles.mainActionButton}
            onPress={() => router.push('/add-bike')}
          >
            <Ionicons name="add-circle" size={48} color="#FFC107" />
            <Text style={styles.mainActionTitle}>Cadastre sua Primeira Bike</Text>
            <Text style={styles.mainActionSubtitle}>
              Proteja sua bicicleta agora
            </Text>
          </TouchableOpacity>
        )}

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/bikes')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFC107' }]}>
              <Ionicons name="bicycle" size={24} color="#000" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Minhas Bicicletas</Text>
              <Text style={styles.actionSubtitle}>
                Ver e gerenciar bikes cadastradas
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Linking.openURL('https://delegaciavirtual.sc.gov.br/')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Delegacia Virtual SC</Text>
              <Text style={styles.actionSubtitle}>
                Registrar boletim de ocorrência
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {totalBikes > 0 && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/add-bike')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="add-circle" size={24} color="#fff" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Cadastrar Nova Bike</Text>
                <Text style={styles.actionSubtitle}>
                  Adicionar mais uma bicicleta
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Alertas de Furto */}
        {stolenBikes > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color="#F44336" />
              <Text style={styles.alertTitle}>ATENÇÃO!</Text>
            </View>
            <Text style={styles.alertText}>
              Você tem {stolenBikes} {stolenBikes === 1 ? 'bicicleta furtada' : 'bicicletas furtadas'}.
            </Text>
            <Text style={styles.alertText}>
              Acesse "Minhas Bikes" para ver detalhes e rastreamento.
            </Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => router.push('/(tabs)/bikes')}
            >
              <Text style={styles.alertButtonText}>Ver Bikes Furtadas</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Dicas de Segurança */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dicas de Segurança</Text>
          
          <View style={styles.tipCard}>
            <Ionicons name="location" size={20} color="#FFC107" />
            <Text style={styles.tipText}>
              Cadastre o link do rastreador para acesso rápido
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="camera" size={20} color="#FFC107" />
            <Text style={styles.tipText}>
              Tire fotos de todos os ângulos da sua bike
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="key" size={20} color="#FFC107" />
            <Text style={styles.tipText}>
              Anote o número de série em local seguro
            </Text>
          </View>
        </View>

        {/* Rodapé com espaço para tab bar */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🔒 Suas bikes estão protegidas</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 100, // Espaço para tab bar
  },
  header: {
    backgroundColor: '#000',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FFC107',
  },
  logo: {
    width: 200,
    height: 140,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFC107',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statCardDanger: {
    borderColor: '#F44336',
    backgroundColor: '#2a1a1a',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFC107',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  mainActionButton: {
    backgroundColor: '#000',
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFC107',
    borderStyle: 'dashed',
  },
  mainActionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFC107',
    marginTop: 16,
  },
  mainActionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  alertSection: {
    margin: 16,
    backgroundColor: '#2a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
  },
  alertText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 20,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});
