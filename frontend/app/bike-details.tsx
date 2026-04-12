import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bikeAPI } from '../utils/api';
import { Bike } from '../types';
import { openExternalLink } from '../utils/linking';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PHOTO_LABELS: Record<string, string> = {
  frente: 'Frente',
  tras: 'Traseira',
  lateral_direita: 'Lateral Direita',
  lateral_esquerda: 'Lateral Esquerda',
  numero_quadro: 'N. do Quadro',
};

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
  return (now.getTime() - date.getTime()) < 30 * 60 * 1000;
};

const getStatusConfig = (status: string, lastUpdate?: string) => {
  switch (status) {
    case 'Furtada':
      return { color: '#F44336', text: 'Furtada (rastreamento ativo)', icon: 'alert-circle' as const };
    case 'Ativa':
      return { color: '#4CAF50', text: 'Ativa (monitorando)', icon: 'shield-checkmark' as const };
    default:
      return { color: '#4CAF50', text: 'Ativa', icon: 'shield-checkmark' as const };
  }
};

export default function BikeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [bike, setBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoLabel, setSelectedPhotoLabel] = useState<string>('');
  const [showRecuperar, setShowRecuperar] = useState(false);
  const [recuperarLoading, setRecuperarLoading] = useState(false);

  const loadBike = async () => {
    try {
      const data = await bikeAPI.getOne(id as string);
      setBike(data);
      if (data.fotos && typeof data.fotos === 'object') {
        const firstKey = Object.keys(data.fotos).find((k) => data.fotos[k as keyof typeof data.fotos]);
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

  useEffect(() => { loadBike(); }, [id]);

  const handleTracking = () => {
    if (bike?.link_rastreamento) {
      openExternalLink(bike.link_rastreamento);
    } else {
      Alert.alert('Sem rastreamento', 'Nenhum link de rastreamento cadastrado.');
    }
  };

  const handleAlertaFurto = () => {
    if (!bike) return;
    Alert.alert(
      'ALERTA DE FURTO',
      `Confirma que a ${bike.marca} ${bike.modelo} foi furtada?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Furto',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await bikeAPI.alertFurto(bike.id);
              setBike(updated);
              Alert.alert('Alerta Acionado', 'Bicicleta marcada como FURTADA.\nRecomendamos registrar B.O. na Delegacia Virtual.', [
                { text: 'Delegacia Virtual SC', onPress: () => openExternalLink('https://delegaciavirtual.sc.gov.br/') },
                { text: 'OK' },
              ]);
            } catch (error: any) { Alert.alert('Erro', error.message); }
          },
        },
      ]
    );
  };

  const handleRecuperar = () => {
    setShowRecuperar(true);
  };

  const doRecuperar = async () => {
    if (!bike) return;
    setRecuperarLoading(true);
    try {
      const updated = await bikeAPI.recuperar(bike.id);
      setBike(updated);
      setShowRecuperar(false);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setRecuperarLoading(false);
    }
  };

  const handleShare = async () => {
    if (!bike) return;
    const msg = `BICICLETA FURTADA\n${bike.marca} ${bike.modelo}\nCor: ${bike.cor}\nSerie: ${bike.numero_serie}\n${bike.data_furto ? `Furto: ${format(new Date(bike.data_furto), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}` : ''}\n${bike.link_rastreamento || ''}`;
    try { await Share.share({ message: msg }); } catch (e) { console.error(e); }
  };

  const handleDelete = () => {
    if (!bike) return;
    Alert.alert('Excluir Bicicleta', `Excluir ${bike.marca} ${bike.modelo}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try { await bikeAPI.delete(bike.id); router.back(); } catch (e: any) { Alert.alert('Erro', e.message); }
      }},
    ]);
  };

  if (loading || !bike) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC107" />
        </View>
      </SafeAreaView>
    );
  }

  const statusCfg = getStatusConfig(bike.status, bike.ultima_atualizacao);
  const online = isOnline(bike.ultima_atualizacao);
  const isFurtada = bike.status === 'Furtada';

  const availablePhotos: { key: string; label: string; uri: string }[] = [];
  if (bike.fotos && typeof bike.fotos === 'object') {
    Object.entries(PHOTO_LABELS).forEach(([key, label]) => {
      const uri = bike.fotos[key as keyof typeof bike.fotos];
      if (uri) availablePhotos.push({ key, label, uri });
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* FOTOS */}
        {availablePhotos.length > 0 && (
          <View style={styles.imageSection}>
            {selectedPhoto && (
              <View>
                <Image source={{ uri: selectedPhoto }} style={styles.mainImage} resizeMode="cover" />
                <View style={styles.photoLabelBadge}>
                  <Text style={styles.photoLabelText}>{selectedPhotoLabel}</Text>
                </View>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
              <View style={styles.thumbnails}>
                {availablePhotos.map((p) => (
                  <TouchableOpacity key={p.key} onPress={() => { setSelectedPhoto(p.uri); setSelectedPhotoLabel(p.label); }} style={styles.thumbWrap}>
                    <Image source={{ uri: p.uri }} style={[styles.thumb, selectedPhoto === p.uri && styles.thumbActive]} resizeMode="cover" />
                    <Text style={[styles.thumbLabel, selectedPhoto === p.uri && styles.thumbLabelActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.content}>
          {/* NOME + STATUS UNICO */}
          <View style={styles.titleRow}>
            <Text style={styles.bikeTitle}>{bike.marca} {bike.modelo}</Text>
          </View>
          <View style={[styles.statusBar, { backgroundColor: statusCfg.color + '20', borderColor: statusCfg.color }]}>
            <Ionicons name={statusCfg.icon} size={20} color={statusCfg.color} />
            <Text style={[styles.statusBarText, { color: statusCfg.color }]}>{statusCfg.text}</Text>
            <View style={styles.statusBarRight}>
              <View style={[styles.onlineDot, { backgroundColor: online ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.updateText}>{getTimeAgo(bike.ultima_atualizacao)}</Text>
            </View>
          </View>

          {/* ACAO PRINCIPAL: RASTREAMENTO */}
          <TouchableOpacity
            style={[styles.mainActionBtn, isFurtada ? styles.mainActionFurtada : styles.mainActionAtiva]}
            onPress={handleTracking}
          >
            <Ionicons name="location" size={24} color={isFurtada ? '#fff' : '#000'} />
            <Text style={[styles.mainActionText, isFurtada ? styles.mainActionTextFurtada : styles.mainActionTextAtiva]}>
              Ver localizacao
            </Text>
          </TouchableOpacity>

          {/* ACOES SECUNDARIAS SE FURTADA */}
          {isFurtada && (
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.policeBtn} onPress={() => openExternalLink('https://delegaciavirtual.sc.gov.br/')}>
                <Ionicons name="shield-checkmark" size={18} color="#fff" />
                <Text style={styles.policeBtnText}>Delegacia Virtual SC</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-social" size={18} color="#FFC107" />
                <Text style={styles.shareBtnText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RECUPERAR BIKE SE FURTADA */}
          {isFurtada && (
            <TouchableOpacity style={styles.recuperarBtn} onPress={handleRecuperar}>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.recuperarBtnText}>MARCAR COMO RECUPERADA</Text>
            </TouchableOpacity>
          )}

          {/* ALERTA DE FURTO SE ATIVA */}
          {bike.status === 'Ativa' && (
            <TouchableOpacity style={styles.alertBtn} onPress={handleAlertaFurto}>
              <Ionicons name="alert-circle" size={22} color="#fff" />
              <Text style={styles.alertBtnText}>ACIONAR ALERTA DE FURTO</Text>
            </TouchableOpacity>
          )}

          {/* DETALHES COMPLETOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cor</Text>
              <Text style={styles.infoValue}>{bike.cor}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categoria</Text>
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
              <Text style={styles.infoValue}>{format(new Date(bike.created_at), 'dd/MM/yyyy', { locale: ptBR })}</Text>
            </View>
            {bike.data_furto && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Data do furto</Text>
                <Text style={[styles.infoValue, { color: '#F44336' }]}>{format(new Date(bike.data_furto), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}</Text>
              </View>
            )}

            {/* BOTAO EDITAR DENTRO DA SECAO */}
            <TouchableOpacity
              style={styles.editBikeBtn}
              onPress={() => router.push({ pathname: '/edit-bike', params: { id: bike.id } })}
            >
              <Ionicons name="create-outline" size={22} color="#000" />
              <Text style={styles.editBikeBtnText}>EDITAR CADASTRO</Text>
            </TouchableOpacity>
          </View>

          {/* RASTREAMENTO LINK */}
          {bike.link_rastreamento && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rastreamento</Text>
              <TouchableOpacity style={styles.trackingLink} onPress={handleTracking}>
                <Ionicons name="open-outline" size={18} color="#FFC107" />
                <Text style={styles.trackingLinkText} numberOfLines={1}>{bike.link_rastreamento}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* NOTA FISCAL */}
          {bike.nota_fiscal && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nota Fiscal</Text>
              <Image source={{ uri: bike.nota_fiscal }} style={styles.nfImage} resizeMode="contain" />
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL RECUPERAR */}
      {showRecuperar && bike && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="checkmark-circle" size={40} color="#4CAF50" style={{ alignSelf: 'center' }} />
            <Text style={styles.modalTitle}>Recuperar Bicicleta</Text>
            <Text style={styles.modalDesc}>
              Confirma que "{bike.marca} {bike.modelo}" foi recuperada e deseja voltar ao status normal?
            </Text>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, recuperarLoading && { opacity: 0.6 }]}
              onPress={doRecuperar}
              disabled={recuperarLoading}
            >
              <Text style={styles.modalConfirmText}>
                {recuperarLoading ? 'Atualizando...' : 'CONFIRMAR RECUPERACAO'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowRecuperar(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  deleteButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  editBikeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFC107', padding: 16, borderRadius: 10, gap: 10, marginTop: 16,
  },
  editBikeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  imageSection: { backgroundColor: '#000' },
  mainImage: { width: '100%', height: 260 },
  photoLabelBadge: {
    position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#FFC107',
  },
  photoLabelText: { color: '#FFC107', fontSize: 12, fontWeight: '600' },
  thumbScroll: { backgroundColor: '#000' },
  thumbnails: { flexDirection: 'row', padding: 8, gap: 8 },
  thumbWrap: { alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: '#FFC107' },
  thumbLabel: { color: '#666', fontSize: 9, marginTop: 4, textAlign: 'center' },
  thumbLabelActive: { color: '#FFC107' },
  content: { padding: 16 },
  titleRow: { marginBottom: 12 },
  bikeTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10,
    borderWidth: 1, marginBottom: 16, gap: 8,
  },
  statusBarText: { fontSize: 14, fontWeight: '600', flex: 1 },
  statusBarRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  updateText: { fontSize: 12, color: '#999' },
  mainActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 18, borderRadius: 12, gap: 10, marginBottom: 12,
  },
  mainActionFurtada: { backgroundColor: '#F44336' },
  mainActionAtiva: { backgroundColor: '#FFC107' },
  mainActionText: { fontSize: 18, fontWeight: 'bold' },
  mainActionTextFurtada: { color: '#fff' },
  mainActionTextAtiva: { color: '#000' },
  secondaryActions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  policeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2196F3', padding: 14, borderRadius: 10, gap: 6,
  },
  policeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000', padding: 14, borderRadius: 10, borderWidth: 2, borderColor: '#FFC107', gap: 6,
  },
  shareBtnText: { color: '#FFC107', fontWeight: 'bold', fontSize: 13 },
  alertBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F44336', padding: 16, borderRadius: 12, gap: 8, marginBottom: 16,
  },
  alertBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  recuperarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, gap: 8, marginBottom: 16,
  },
  recuperarBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  section: {
    backgroundColor: '#000', padding: 16, borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#333',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFC107', marginBottom: 16 },
  infoRow: { marginBottom: 16 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#fff', fontWeight: '500' },
  trackingLink: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: '#1a1a1a', borderRadius: 8,
  },
  trackingLinkText: { flex: 1, fontSize: 14, color: '#FFC107', fontWeight: '500' },
  nfImage: { width: '100%', height: 280, borderRadius: 8, backgroundColor: '#111' },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center',
    padding: 24, zIndex: 100,
  },
  modalBox: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24,
    width: '100%', maxWidth: 400, borderWidth: 2, borderColor: '#4CAF50',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 12, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#ccc', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalConfirmBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, marginBottom: 8,
  },
  modalConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalCancelBtn: {
    alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#333',
  },
  modalCancelText: { color: '#999', fontSize: 14, fontWeight: '600' },
});
