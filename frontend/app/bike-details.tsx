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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bikeAPI } from '../utils/api';
import { Bike } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PHOTO_LABELS: Record<string, string> = {
  frente: 'Frente',
  tras: 'Traseira',
  lateral_direita: 'Lateral Direita',
  lateral_esquerda: 'Lateral Esquerda',
  numero_quadro: 'N. do Quadro',
};

export default function BikeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [bike, setBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoLabel, setSelectedPhotoLabel] = useState<string>('');

  const loadBike = async () => {
    try {
      const data = await bikeAPI.getOne(id as string);
      setBike(data);
      // Selecionar primeira foto disponivel
      if (data.fotos && typeof data.fotos === 'object') {
        const firstKey = Object.keys(data.fotos).find(
          (k) => data.fotos[k as keyof typeof data.fotos]
        );
        if (firstKey) {
          setSelectedPhoto(data.fotos[firstKey as keyof typeof data.fotos] || null);
          setSelectedPhotoLabel(PHOTO_LABELS[firstKey] || firstKey);
        }
      }
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
      'ALERTA DE FURTO',
      `Confirma que a bicicleta ${bike.marca} ${bike.modelo} foi furtada?\n\nEsta acao:\n- Marcara a bike como FURTADA\n- Registrara data e hora\n- Dara acesso ao rastreamento`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Furto',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBike = await bikeAPI.alertFurto(bike.id);
              setBike(updatedBike);
              Alert.alert(
                'Alerta Acionado',
                'Sua bicicleta foi marcada como FURTADA.\n\nRecomendamos:\n1. Abrir o rastreamento\n2. Registrar boletim na Delegacia Virtual SC\n3. Compartilhar informacoes',
                [
                  {
                    text: 'Delegacia Virtual SC',
                    onPress: () => Linking.openURL('https://delegaciavirtual.sc.gov.br/'),
                  },
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
      Alert.alert('Link nao cadastrado', 'Voce ainda nao cadastrou um link de rastreamento para esta bicicleta.');
    }
  };

  const handleShare = async () => {
    if (!bike) return;
    const message = `BICICLETA FURTADA\n\n${bike.marca} ${bike.modelo}\nCor: ${bike.cor}\nSerie: ${bike.numero_serie}\n${bike.data_furto ? `Data do furto: ${format(new Date(bike.data_furto), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}` : ''}\n\n${bike.link_rastreamento ? `Rastreamento: ${bike.link_rastreamento}` : ''}`;
    try {
      await Share.share({ message });
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
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await bikeAPI.delete(bike.id);
              Alert.alert('Sucesso', 'Bicicleta excluida com sucesso');
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC107" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = () => {
    switch (bike.status) {
      case 'Ativa': return '#4CAF50';
      case 'Furtada': return '#F44336';
      case 'Recuperada': return '#2196F3';
      default: return '#999';
    }
  };

  // Obter fotos disponiveis
  const availablePhotos: { key: string; label: string; uri: string }[] = [];
  if (bike.fotos && typeof bike.fotos === 'object') {
    Object.entries(PHOTO_LABELS).forEach(([key, label]) => {
      const uri = bike.fotos[key as keyof typeof bike.fotos];
      if (uri) {
        availablePhotos.push({ key, label, uri });
      }
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Bike</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* FOTOS */}
        {availablePhotos.length > 0 && (
          <View style={styles.imageSection}>
            {selectedPhoto && (
              <View>
                <Image
                  source={{ uri: selectedPhoto }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
                <View style={styles.photoLabelBadge}>
                  <Text style={styles.photoLabelText}>{selectedPhotoLabel}</Text>
                </View>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailsScroll}>
              <View style={styles.thumbnails}>
                {availablePhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.key}
                    onPress={() => {
                      setSelectedPhoto(photo.uri);
                      setSelectedPhotoLabel(photo.label);
                    }}
                    style={styles.thumbnailWrapper}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={[
                        styles.thumbnail,
                        selectedPhoto === photo.uri && styles.thumbnailActive,
                      ]}
                      resizeMode="cover"
                    />
                    <Text style={[
                      styles.thumbnailLabel,
                      selectedPhoto === photo.uri && styles.thumbnailLabelActive,
                    ]}>
                      {photo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.content}>
          {/* TITULO E STATUS */}
          <View style={styles.titleSection}>
            <Text style={styles.bikeTitle}>
              {bike.marca} {bike.modelo}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{bike.status}</Text>
            </View>
          </View>

          {/* BANNER DE FURTO */}
          {bike.status === 'Furtada' && bike.data_furto && (
            <View style={styles.alertBanner}>
              <Ionicons name="alert-circle" size={24} color="#F44336" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>BICICLETA FURTADA</Text>
                <Text style={styles.alertDate}>
                  {format(new Date(bike.data_furto), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                </Text>
              </View>
            </View>
          )}

          {/* BOTOES DE ACAO - FURTADA */}
          {bike.status === 'Furtada' && (
            <View style={styles.actionButtons}>
              {bike.link_rastreamento && (
                <TouchableOpacity style={styles.trackingButton} onPress={handleOpenTracking}>
                  <Ionicons name="location" size={20} color="#000" />
                  <Text style={styles.trackingButtonText}>Ver Rastreamento</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.policeButton}
                onPress={() => Linking.openURL('https://delegaciavirtual.sc.gov.br/')}
              >
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.policeButtonText}>Delegacia Virtual SC</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Ionicons name="share-social" size={20} color="#FFC107" />
                <Text style={styles.shareButtonText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* BOTAO DE ALERTA - ATIVA */}
          {bike.status === 'Ativa' && (
            <TouchableOpacity style={styles.alertFurtoButton} onPress={handleAlertaFurto}>
              <Ionicons name="alert-circle" size={24} color="#fff" />
              <Text style={styles.alertFurtoButtonText}>ACIONAR ALERTA DE FURTO</Text>
            </TouchableOpacity>
          )}

          {/* INFORMACOES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacoes</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cor</Text>
              <Text style={styles.infoValue}>{bike.cor}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>{bike.tipo}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Numero de Serie</Text>
              <Text style={styles.infoValue}>{bike.numero_serie}</Text>
            </View>

            {bike.caracteristicas && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Caracteristicas</Text>
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

          {/* RASTREAMENTO */}
          {bike.link_rastreamento && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rastreamento</Text>
              <TouchableOpacity style={styles.trackingLinkButton} onPress={handleOpenTracking}>
                <Ionicons name="open-outline" size={20} color="#FFC107" />
                <Text style={styles.trackingLinkText} numberOfLines={1}>
                  {bike.link_rastreamento}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* NOTA FISCAL */}
          {bike.nota_fiscal && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nota Fiscal</Text>
              <Image
                source={{ uri: bike.nota_fiscal }}
                style={styles.notaFiscalImage}
                resizeMode="contain"
              />
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
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#FFC107',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  imageSection: {
    backgroundColor: '#000',
  },
  mainImage: {
    width: '100%',
    height: 280,
  },
  photoLabelBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  photoLabelText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailsScroll: {
    backgroundColor: '#000',
  },
  thumbnails: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  thumbnailWrapper: {
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#FFC107',
  },
  thumbnailLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  thumbnailLabelActive: {
    color: '#FFC107',
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
    color: '#fff',
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
    backgroundColor: '#2a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F44336',
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
    color: '#999',
    marginTop: 4,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  trackingButton: {
    backgroundColor: '#FFC107',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  trackingButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  policeButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  policeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  shareButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFC107',
    gap: 8,
  },
  shareButtonText: {
    color: '#FFC107',
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
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC107',
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
    color: '#fff',
    fontWeight: '500',
  },
  trackingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  trackingLinkText: {
    flex: 1,
    fontSize: 14,
    color: '#FFC107',
    fontWeight: '500',
  },
  notaFiscalImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#111',
  },
});
