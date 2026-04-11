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
import { authAPI } from '../../utils/api';
import { User } from '../../types';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

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

  useEffect(() => {
    loadUserData();
  }, []);

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
    Alert.alert(
      'Foto de Perfil',
      'Escolha uma opcao:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const camStatus = await ImagePicker.requestCameraPermissionsAsync();
              if (camStatus.status !== 'granted') {
                Alert.alert('Permissao negada', 'Precisamos de acesso a camera.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
              });
              if (!result.canceled && result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                await saveProfilePhoto(base64Image);
              }
            } catch (error: any) {
              Alert.alert('Erro', 'Nao foi possivel abrir a camera: ' + error.message);
            }
          },
        },
        {
          text: 'Galeria',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permissao negada', 'Precisamos de acesso a galeria.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
              });
              if (!result.canceled && result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                await saveProfilePhoto(base64Image);
              }
            } catch (error: any) {
              Alert.alert('Erro', 'Nao foi possivel abrir a galeria: ' + error.message);
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const saveProfilePhoto = async (base64Image: string) => {
    setUpdatingPhoto(true);
    try {
      const updatedUser = await authAPI.updateFotoPerfil(base64Image);
      setUser(updatedUser);
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar foto');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const handleComoFunciona = () => {
    showModal(
      'Como Funciona',
      'O BIKE SEGURA BC e um aplicativo de seguranca e recuperacao de bicicletas.\n\n' +
      '1. CADASTRE sua bicicleta com fotos detalhadas (frente, traseira, laterais e numero do quadro).\n\n' +
      '2. ADICIONE o link de rastreamento do seu dispositivo (AirTag, GPS, etc.).\n\n' +
      '3. ANEXE a nota fiscal para comprovar a propriedade.\n\n' +
      '4. EM CASO DE FURTO, acione o Alerta de Furto no Dashboard. O app registra a data/hora e disponibiliza o rastreamento.\n\n' +
      '5. REGISTRE o boletim de ocorrencia na Delegacia Virtual de SC diretamente pelo app.\n\n' +
      '6. COMPARTILHE as informacoes da bicicleta para ajudar na recuperacao.'
    );
  };

  const handleAjuda = () => {
    showModal(
      'Ajuda',
      'Perguntas Frequentes:\n\n' +
      'Como cadastrar minha bike?\nVa para a aba "Bikes" e toque no botao "+". Preencha os dados e adicione as fotos.\n\n' +
      'O que e o link de rastreamento?\nE o link do seu dispositivo de rastreio (AirTag, GPS tracker). Cole o link ao cadastrar a bike.\n\n' +
      'Como acionar o Alerta de Furto?\nNo Dashboard (Home), toque no botao vermelho "Alerta de Furto" e selecione a bicicleta.\n\n' +
      'As fotos sao obrigatorias?\nSim. Sao necessarias 5 fotos: frente, traseira, lateral direita, lateral esquerda e numero do quadro.\n\n' +
      'Preciso de internet para usar o app?\nSim, o app precisa de conexao para sincronizar seus dados.'
    );
  };

  const handleTermos = () => {
    showModal(
      'Termos de Uso',
      'BIKE SEGURA BC - Termos de Uso\n\n' +
      'Ao utilizar o aplicativo BIKE SEGURA BC, voce concorda com os seguintes termos:\n\n' +
      '1. O app tem como objetivo auxiliar na seguranca e recuperacao de bicicletas furtadas na regiao de Balneario Camboriu e Santa Catarina.\n\n' +
      '2. As informacoes cadastradas sao de responsabilidade do usuario e devem ser verdadeiras.\n\n' +
      '3. O app nao substitui o registro de boletim de ocorrencia na delegacia competente.\n\n' +
      '4. Os dados sao armazenados de forma segura e nao serao compartilhados com terceiros sem autorizacao.\n\n' +
      '5. O app nao se responsabiliza pela recuperacao efetiva da bicicleta, sendo uma ferramenta de auxilio.\n\n' +
      '6. O uso do app e gratuito e sem fins lucrativos.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          {updatingPhoto ? (
            <View style={styles.avatar}>
              <ActivityIndicator size="large" color="#FFC107" />
            </View>
          ) : user?.foto_perfil ? (
            <Image source={{ uri: user.foto_perfil }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#FFC107" />
            </View>
          )}
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={pickProfilePhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={18} color="#000" />
            <Text style={styles.changePhotoText}>Alterar Foto</Text>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.nome_completo}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacoes Pessoais</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="card" size={20} color="#FFC107" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>CPF</Text>
                <Text style={styles.infoValue}>{user?.cpf}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call" size={20} color="#FFC107" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{user?.telefone}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar" size={20} color="#FFC107" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Data de Nascimento</Text>
                <Text style={styles.infoValue}>{user?.data_nascimento}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o App</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleComoFunciona}>
            <View style={styles.menuIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#FFC107" />
            </View>
            <Text style={styles.menuText}>Como Funciona</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleAjuda}>
            <View style={styles.menuIcon}>
              <Ionicons name="help-circle" size={24} color="#2196F3" />
            </View>
            <Text style={styles.menuText}>Ajuda</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTermos}>
            <View style={styles.menuIcon}>
              <Ionicons name="document-text" size={24} color="#FF9800" />
            </View>
            <Text style={styles.menuText}>Termos de Uso</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#F44336" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BIKE SEGURA BC</Text>
          <Text style={styles.footerVersion}>Versao 1.0.0</Text>
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#000',
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#FFC107',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#FFC107',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  changePhotoText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
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
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  menuItem: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuIcon: {
    width: 40,
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    margin: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F44336',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  footerVersion: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderTopWidth: 2,
    borderTopColor: '#FFC107',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  modalClose: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    padding: 20,
  },
  modalText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
    paddingBottom: 40,
  },
});
