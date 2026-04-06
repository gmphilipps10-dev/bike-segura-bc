import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bikeAPI } from '../utils/api';
import { Bike } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BikeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [bike, setBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const loadBike = async () => {
    try {
      const data = await bikeAPI.getOne(id as string);
      setBike(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBike();
  }, [id]);

  const handleAlertaFurto = () => {
    if (!bike) return;

    Alert.alert(
      '⚠️ ALERTA DE FURTO',
      `Confirma que a bicicleta ${bike.marca} ${bike.modelo} foi furtada?\n\nEsta ação:
• Marcará a bike como FURTADA
• Registrará data e hora
• Dará acesso ao rastreamento`,
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
              const updatedBike = await bikeAPI.alertFurto(bike.id);
              setBike(updatedBike);
              Alert.alert(
                '✅ Alerta Acionado',
                'Sua bicicleta foi marcada como FURTADA.\n\nRecomendamos:
1. Abrir o rastreamento
2. Registrar boletim de ocorrência
3. Compartilhar com autoridades',
                [
                  {
                    text: 'Ver Rastreamento',
                    onPress: () => handleOpenTracking(),
                  },
                  { text: 'OK' },
                ]
              );
            } catch (error: any) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

  const handleOpenTracking = () => {
    if (bike?.link_rastreamento) {
      Linking.openURL(bike.link_rastreamento);
    } else {
      Alert.alert(
        'Link não cadastrado',
        'Você ainda não cadastrou um link de rastreamento para esta bicicleta.'
      );
    }
  };

  const handleShare = async () => {
    if (!bike) return;

    const message = `🚨 BICICLETA FURTADA

${bike.marca} ${bike.modelo}
Cor: ${bike.cor}
Série: ${bike.numero_serie}
${bike.data_furto ? `Data do furto: ${format(new Date(bike.data_furto), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : ''}

${bike.link_rastreamento ? `Rastreamento: ${bike.link_rastreamento}` : ''}`;

    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = () => {
    if (!bike) return;

    Alert.alert(
      'Excluir Bicicleta',
      `Tem certeza que deseja excluir ${bike.marca} ${bike.modelo}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await bikeAPI.delete(bike.id);
              Alert.alert('Sucesso', 'Bicicleta excluída com sucesso');
              router.back();
            } catch (error: any) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading || !bike) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = () => {
    switch (bike.status) {
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Bike</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {bike.fotos && bike.fotos.length > 0 && (
          <View style={styles.imageSection}>
            <Image
              source={{ uri: bike.fotos[currentPhotoIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {bike.fotos.length > 1 && (
              <View style={styles.thumbnails}>
                {bike.fotos.map((foto, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCurrentPhotoIndex(index)}
                  >
                    <Image
                      source={{ uri: foto }}
                      style={[
                        styles.thumbnail,
                        currentPhotoIndex === index && styles.thumbnailActive,
                      ]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.bikeTitle}>
              {bike.marca} {bike.modelo}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{bike.status}</Text>
            </View>
          </View>

          {bike.status === 'Furtada' && bike.data_furto && (
            <View style={styles.alertBanner}>
              <Ionicons name="alert-circle" size={24} color="#F44336" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>BICICLETA FURTADA</Text>
                <Text style={styles.alertDate}>
                  {format(new Date(bike.data_furto), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </Text>
              </View>
            </View>
          )}

          {bike.status === 'Furtada' && (
            <View style={styles.actionButtons}>
              {bike.link_rastreamento && (
                <TouchableOpacity
                  style={styles.trackingButton}
                  onPress={handleOpenTracking}
                >
                  <Ionicons name="location" size={20} color="#fff" />
                  <Text style={styles.trackingButtonText}>Ver Rastreamento</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Ionicons name="share-social" size={20} color="#2196F3" />
                <Text style={styles.shareButtonText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          )}

          {bike.status === 'Ativa' && (
            <TouchableOpacity style={styles.alertFurtoButton} onPress={handleAlertaFurto}>
              <Ionicons name="alert-circle" size={24} color="#fff" />
              <Text style={styles.alertFurtoButtonText}>ACIONAR ALERTA DE FURTO</Text>
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cor</Text>
              <Text style={styles.infoValue}>{bike.cor}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>{bike.tipo}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Número de Série</Text>
              <Text style={styles.infoValue}>{bike.numero_serie}</Text>
            </View>

            {bike.valor_estimado && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valor Estimado</Text>
                <Text style={styles.infoValue}>
                  R$ {bike.valor_estimado.toLocaleString('pt-BR')}
                </Text>
              </View>
            )}

            {bike.caracteristicas && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Características</Text>
                <Text style={styles.infoValue}>{bike.caracteristicas}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cadastrada em</Text>
              <Text style={styles.infoValue}>
                {format(new Date(bike.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </Text>
            </View>
          </View>

          {bike.link_rastreamento && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rastreamento</Text>
              <TouchableOpacity
                style={styles.trackingLinkButton}
                onPress={handleOpenTracking}
              >
                <Ionicons name="open-outline" size={20} color="#4CAF50" />
                <Text style={styles.trackingLinkText} numberOfLines={1}>
                  {bike.link_rastreamento}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    backgroundColor: '#000',
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  thumbnails: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#000',
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#4CAF50',
  },
  content: {
    padding: 16,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bikeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  alertDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  trackingButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  trackingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  shareButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 8,
  },
  shareButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 16,
  },
  alertFurtoButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  alertFurtoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  trackingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  trackingLinkText: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});