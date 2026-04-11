import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, adminAPI } from '../../utils/api';
import { User } from '../../types';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [showCpf, setShowCpf] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const loadUserData = async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUserData(); }, []);

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const showModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalVisible(true);
  };

  const pickProfilePhoto = async () => {
    Alert.alert('Foto de Perfil', 'Escolha uma opcao:', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const s = await ImagePicker.requestCameraPermissionsAsync();
            if (s.status !== 'granted') { Alert.alert('Permissao negada'); return; }
            const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true });
            if (!r.canceled && r.assets[0].base64) await saveProfilePhoto(`data:image/jpeg;base64,${r.assets[0].base64}`);
          } catch (e: any) { Alert.alert('Erro', e.message); }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          try {
            const s = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (s.status !== 'granted') { Alert.alert('Permissao negada'); return; }
            const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true });
            if (!r.canceled && r.assets[0].base64) await saveProfilePhoto(`data:image/jpeg;base64,${r.assets[0].base64}`);
          } catch (e: any) { Alert.alert('Erro', e.message); }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const saveProfilePhoto = async (base64Image: string) => {
    setUpdatingPhoto(true);
    try {
      const updated = await authAPI.updateFotoPerfil(base64Image);
      setUser(updated);
      Alert.alert('Sucesso', 'Foto atualizada!');
    } catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setUpdatingPhoto(false); }
  };

  const maskCpf = (cpf: string) => {
    if (!cpf || cpf.length < 4) return cpf;
    return '***.***.***-' + cpf.slice(-2);
  };

  const handleLogoTap = async () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount >= 5) {
      setAdminTapCount(0);
      try {
        const stats = await adminAPI.getStats();
        if (stats) {
          setAdminStats(stats);
          setShowAdminPanel(true);
        } else {
          Alert.alert('Acesso negado', 'Voce nao tem permissao de administrador.');
        }
      } catch (e) {
        Alert.alert('Acesso negado', 'Voce nao tem permissao de administrador.');
      }
    }
  };

  // Reset tap counter after 3 seconds
  useEffect(() => {
    if (adminTapCount > 0 && adminTapCount < 5) {
      const timer = setTimeout(() => setAdminTapCount(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [adminTapCount]);

  const handleComoFunciona = () => showModal('Como Funciona',
    'O BIKE SEGURA BC e um aplicativo de seguranca e recuperacao de bicicletas.\n\n' +
    '1. CADASTRE sua bicicleta com fotos detalhadas.\n\n' +
    '2. ADICIONE o link de rastreamento (AirTag, GPS, etc.).\n\n' +
    '3. MONITORE o status em tempo real.\n\n' +
    '4. EM CASO DE FURTO, acione o Alerta. O rastreamento e ativado imediatamente.\n\n' +
    '5. REGISTRE o B.O. na Delegacia Virtual de SC pelo app.\n\n' +
    '6. COMPARTILHE as informacoes para ajudar na recuperacao.'
  );

  const handleAjuda = () => showModal('Ajuda',
    'Perguntas Frequentes:\n\n' +
    'Como cadastrar minha bike?\nVa em "Minhas Bikes" e toque no +.\n\n' +
    'O que e o link de rastreamento?\nE o link do seu dispositivo de rastreio (AirTag, GPS). Cole ao cadastrar.\n\n' +
    'Como acionar o Alerta de Furto?\nNa Home ou nos detalhes da bike, toque no botao vermelho.\n\n' +
    'O que significa Online/Offline?\nOnline = atualizado recentemente. Offline = sem sinal.'
  );

  const handleTermos = () => showModal('Termos de Uso',
    'BIKE SEGURA BC - Termos de Uso\n\n' +
    '1. O app auxilia na seguranca de bicicletas em SC.\n\n' +
    '2. As informacoes sao de responsabilidade do usuario.\n\n' +
    '3. Nao substitui o registro de B.O.\n\n' +
    '4. Dados armazenados de forma segura.\n\n' +
    '5. Uso gratuito e sem fins lucrativos.'
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          {updatingPhoto ? (
            <View style={styles.avatar}><ActivityIndicator size="large" color="#FFC107" /></View>
          ) : user?.foto_perfil ? (
            <Image source={{ uri: user.foto_perfil }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}><Ionicons name="person" size={48} color="#FFC107" /></View>
          )}
          <TouchableOpacity style={styles.changePhotoButton} onPress={pickProfilePhoto} activeOpacity={0.7}>
            <Ionicons name="camera" size={18} color="#000" />
            <Text style={styles.changePhotoText}>Alterar Foto</Text>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.nome_completo}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* INFORMACOES PESSOAIS - CPF mascarado, sem data nascimento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacoes Pessoais</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="card" size={20} color="#FFC107" /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>CPF</Text>
                <View style={styles.cpfRow}>
                  <Text style={styles.infoValue}>{showCpf ? user?.cpf : maskCpf(user?.cpf || '')}</Text>
                  <TouchableOpacity onPress={() => setShowCpf(!showCpf)} style={styles.cpfToggle}>
                    <Ionicons name={showCpf ? 'eye-off' : 'eye'} size={20} color="#FFC107" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="call" size={20} color="#FFC107" /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{user?.telefone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SOBRE O APP */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o App</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleComoFunciona}>
            <View style={styles.menuIcon}><Ionicons name="shield-checkmark" size={24} color="#FFC107" /></View>
            <Text style={styles.menuText}>Como Funciona</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleAjuda}>
            <View style={styles.menuIcon}><Ionicons name="help-circle" size={24} color="#2196F3" /></View>
            <Text style={styles.menuText}>Ajuda</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleTermos}>
            <View style={styles.menuIcon}><Ionicons name="document-text" size={24} color="#FF9800" /></View>
            <Text style={styles.menuText}>Termos de Uso</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#F44336" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        {/* LOGO COM ACESSO OCULTO ADMIN - 5 toques */}
        <TouchableOpacity style={styles.footer} onPress={handleLogoTap} activeOpacity={0.8}>
          <Text style={styles.footerText}>BIKE SEGURA BC</Text>
          <Text style={styles.footerVersion}>Versao 1.0.0</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL INFO */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>{modalContent}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL ADMIN */}
      <Modal animationType="slide" transparent visible={showAdminPanel} onRequestClose={() => setShowAdminPanel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.adminHeaderRow}>
                <Ionicons name="shield" size={20} color="#FFC107" />
                <Text style={styles.modalTitle}>Painel Admin</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAdminPanel(false)} style={styles.modalClose}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {adminStats && (
                <View>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Text style={styles.statNumber}>{adminStats.total_users}</Text>
                      <Text style={styles.statLabel}>Usuarios</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statNumber}>{adminStats.total_bikes}</Text>
                      <Text style={styles.statLabel}>Bikes</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardGreen]}>
                      <Text style={styles.statNumber}>{adminStats.bikes_ativas}</Text>
                      <Text style={styles.statLabel}>Ativas</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardRed]}>
                      <Text style={styles.statNumber}>{adminStats.bikes_furtadas}</Text>
                      <Text style={styles.statLabel}>Furtadas</Text>
                    </View>
                  </View>
                  {adminStats.recent_users && adminStats.recent_users.length > 0 && (
                    <View style={styles.recentSection}>
                      <Text style={styles.recentTitle}>Ultimos cadastros</Text>
                      {adminStats.recent_users.map((u: any, i: number) => (
                        <View key={i} style={styles.recentRow}>
                          <Ionicons name="person-circle" size={20} color="#FFC107" />
                          <View style={styles.recentInfo}>
                            <Text style={styles.recentName}>{u.nome}</Text>
                            <Text style={styles.recentEmail}>{u.email}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { padding: 16, backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: '#FFC107' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFC107' },
  scrollView: { flex: 1 },
  profileHeader: { backgroundColor: '#000', alignItems: 'center', padding: 32, borderBottomWidth: 1, borderBottomColor: '#333' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 3, borderColor: '#FFC107' },
  avatarImage: { width: 96, height: 96, borderRadius: 48, marginBottom: 8, borderWidth: 3, borderColor: '#FFC107' },
  changePhotoButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFC107', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16, gap: 6 },
  changePhotoText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#999' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFC107', marginBottom: 12 },
  infoCard: { backgroundColor: '#000', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoIcon: { width: 40, alignItems: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#fff', fontWeight: '500' },
  cpfRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cpfToggle: { padding: 8 },
  divider: { height: 1, backgroundColor: '#333' },
  menuItem: { backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
  menuIcon: { width: 40, alignItems: 'center' },
  menuText: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', margin: 16, marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F44336', gap: 8 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#F44336' },
  footer: { alignItems: 'center', padding: 24 },
  footerText: { fontSize: 14, fontWeight: 'bold', color: '#FFC107' },
  footerVersion: { fontSize: 12, color: '#999', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', borderTopWidth: 2, borderTopColor: '#FFC107' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFC107' },
  modalClose: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  modalScroll: { padding: 20 },
  modalText: { fontSize: 15, color: '#ccc', lineHeight: 24, paddingBottom: 40 },
  adminHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#000', borderRadius: 8, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statCardGreen: { borderColor: '#4CAF50' },
  statCardRed: { borderColor: '#F44336' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  recentSection: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#333', paddingBottom: 40 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: '#FFC107', marginBottom: 12 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, color: '#fff', fontWeight: '500' },
  recentEmail: { fontSize: 12, color: '#999' },
});
