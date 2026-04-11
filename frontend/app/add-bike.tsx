import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { bikeAPI } from '../utils/api';
import { BikePhotos } from '../types';

type PhotoKey = keyof BikePhotos;

interface PhotoSlot {
  key: PhotoKey;
  label: string;
  icon: string;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  { key: 'frente', label: 'Frente', icon: 'bicycle' },
  { key: 'tras', label: 'Traseira', icon: 'bicycle-outline' },
  { key: 'lateral_direita', label: 'Lateral Direita', icon: 'arrow-forward-circle' },
  { key: 'lateral_esquerda', label: 'Lateral Esquerda', icon: 'arrow-back-circle' },
  { key: 'numero_quadro', label: 'N. do Quadro', icon: 'barcode' },
];

export default function AddBikeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    cor: '',
    numero_serie: '',
    tipo: 'Urbana',
    caracteristicas: '',
    link_rastreamento: '',
  });
  const [fotos, setFotos] = useState<BikePhotos>({});
  const [notaFiscal, setNotaFiscal] = useState<string | null>(null);
  const [notaFiscalType, setNotaFiscalType] = useState<'image' | 'pdf'>('image');

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickPhoto = async (key: PhotoKey) => {
    if (Platform.OS === 'web') {
      // No web, abrir galeria direto (sem Alert com múltiplos botões)
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });
        if (!result.canceled && result.assets[0]) {
          if (result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setFotos((prev) => ({ ...prev, [key]: base64Image }));
          } else if (result.assets[0].uri) {
            // Fallback: usar URI diretamente
            setFotos((prev) => ({ ...prev, [key]: result.assets[0].uri }));
          }
        }
      } catch (e: any) {
        Alert.alert('Erro', 'Nao foi possivel selecionar a foto.');
      }
      return;
    }

    // Mobile: mostrar opções Camera/Galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao negada', 'Precisamos de acesso a galeria para adicionar fotos.');
      return;
    }

    Alert.alert(
      'Adicionar Foto',
      'Escolha uma opcao:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const camStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (camStatus.status !== 'granted') {
              Alert.alert('Permissao negada', 'Precisamos de acesso a camera.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: false,
              quality: 0.7,
              base64: true,
            });
            if (!result.canceled && result.assets[0].base64) {
              const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
              setFotos((prev) => ({ ...prev, [key]: base64Image }));
            }
          },
        },
        {
          text: 'Galeria',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: 'images',
              allowsEditing: false,
              quality: 0.7,
              base64: true,
            });
            if (!result.canceled && result.assets[0].base64) {
              const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
              setFotos((prev) => ({ ...prev, [key]: base64Image }));
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const pickNotaFiscal = async () => {
    if (Platform.OS === 'web') {
      // No web, abrir galeria direto
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });
        if (!result.canceled && result.assets[0]) {
          if (result.assets[0].base64) {
            setNotaFiscal(`data:image/jpeg;base64,${result.assets[0].base64}`);
          } else if (result.assets[0].uri) {
            setNotaFiscal(result.assets[0].uri);
          }
          setNotaFiscalType('image');
        }
      } catch (e: any) {
        Alert.alert('Erro', 'Nao foi possivel selecionar o arquivo.');
      }
      return;
    }

    // Mobile: mostrar opções
    Alert.alert(
      'Nota Fiscal',
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
                allowsEditing: false,
                quality: 0.7,
                base64: true,
              });
              if (!result.canceled && result.assets[0].base64) {
                setNotaFiscal(`data:image/jpeg;base64,${result.assets[0].base64}`);
                setNotaFiscalType('image');
              }
            } catch (error: any) {
              Alert.alert('Erro', error.message);
            }
          },
        },
        {
          text: 'Galeria (Foto)',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permissao negada', 'Precisamos de acesso a galeria.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: false,
                quality: 0.7,
                base64: true,
              });
              if (!result.canceled && result.assets[0].base64) {
                setNotaFiscal(`data:image/jpeg;base64,${result.assets[0].base64}`);
                setNotaFiscalType('image');
              }
            } catch (error: any) {
              Alert.alert('Erro', error.message);
            }
          },
        },
        {
          text: 'Arquivo (PDF)',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
              });
              if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const fileBase64 = await FileSystem.readAsStringAsync(asset.uri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                const mimeType = asset.mimeType || 'application/pdf';
                setNotaFiscal(`data:${mimeType};base64,${fileBase64}`);
                setNotaFiscalType(mimeType.includes('pdf') ? 'pdf' : 'image');
              }
            } catch (error: any) {
              Alert.alert('Erro', error.message);
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const removePhoto = (key: PhotoKey) => {
    setFotos((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const countPhotos = () => {
    return PHOTO_SLOTS.filter((slot) => fotos[slot.key]).length;
  };

  const handleSubmit = async () => {
    const { marca, modelo, cor, numero_serie, tipo } = formData;

    if (!marca.trim()) {
      Alert.alert('Campo obrigatorio', 'Preencha a Marca');
      return;
    }
    if (!modelo.trim()) {
      Alert.alert('Campo obrigatorio', 'Preencha o Modelo');
      return;
    }
    if (!cor.trim()) {
      Alert.alert('Campo obrigatorio', 'Preencha a Cor');
      return;
    }
    if (!numero_serie.trim()) {
      Alert.alert('Campo obrigatorio', 'Preencha o Numero de Serie');
      return;
    }

    // Verificar se todas as 5 fotos foram adicionadas
    const missingPhotos = PHOTO_SLOTS.filter((slot) => !fotos[slot.key]);
    if (missingPhotos.length > 0 && countPhotos() > 0) {
      Alert.alert(
        'Fotos incompletas',
        `Faltam as fotos: ${missingPhotos.map((p) => p.label).join(', ')}.\n\nAdicione todas as 5 fotos ou nenhuma.`
      );
      return;
    }

    setLoading(true);
    try {
      await bikeAPI.create({
        marca: marca.trim(),
        modelo: modelo.trim(),
        cor: cor.trim(),
        numero_serie: numero_serie.trim(),
        fotos: fotos,
        tipo,
        caracteristicas: formData.caracteristicas.trim() || undefined,
        link_rastreamento: formData.link_rastreamento.trim() || undefined,
        nota_fiscal: notaFiscal || undefined,
      });

      Alert.alert('Sucesso', 'Bicicleta cadastrada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao cadastrar bicicleta');
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoSlot = (slot: PhotoSlot) => {
    const photo = fotos[slot.key];
    return (
      <View key={slot.key} style={styles.photoSlot}>
        <Text style={styles.photoLabel}>{slot.label}</Text>
        {photo ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo }} style={styles.photoImage} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removePhotoBtn}
              onPress={() => removePhoto(slot.key)}
            >
              <Ionicons name="close-circle" size={28} color="#F44336" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoPickerBtn} onPress={() => pickPhoto(slot.key)}>
            <Ionicons name={slot.icon as any} size={28} color="#FFC107" />
            <Text style={styles.photoPickerText}>Tirar / Escolher</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cadastrar Bicicleta</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* FOTOS DA BICICLETA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotos da Bicicleta</Text>
            <Text style={styles.sectionSubtitle}>
              Adicione fotos de todos os angulos ({countPhotos()}/5)
            </Text>

            <View style={styles.photosGrid}>
              {PHOTO_SLOTS.map(renderPhotoSlot)}
            </View>
          </View>

          {/* INFORMACOES BASICAS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacoes Basicas</Text>

            <Text style={styles.label}>Marca *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Caloi, Specialized, Trek"
              value={formData.marca}
              onChangeText={(text) => updateField('marca', text)}
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Modelo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Elite 30, Rockhopper"
              value={formData.modelo}
              onChangeText={(text) => updateField('modelo', text)}
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Cor *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Vermelha, Preta, Azul"
              value={formData.cor}
              onChangeText={(text) => updateField('cor', text)}
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Numero de Serie *</Text>
            <TextInput
              style={styles.input}
              placeholder="Numero gravado no quadro"
              value={formData.numero_serie}
              onChangeText={(text) => updateField('numero_serie', text)}
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Categoria *</Text>
            <Text style={[styles.sectionSubtitle, { marginBottom: 8 }]}>Bicicletas</Text>
            <View style={styles.typeButtons}>
              {['Urbana', 'MTB', 'Speed/Road', 'BMX', 'Gravel', 'Dobravel', 'Infantil'].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.typeButton,
                    formData.tipo === tipo && styles.typeButtonActive,
                  ]}
                  onPress={() => updateField('tipo', tipo)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.tipo === tipo && styles.typeButtonTextActive,
                    ]}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.sectionSubtitle, { marginBottom: 8, marginTop: 12 }]}>Eletricas e Motorizados</Text>
            <View style={styles.typeButtons}>
              {['Bike Eletrica', 'Patinete Eletrico', 'Monociclo', 'Ciclomotor/Scooter'].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.typeButton,
                    formData.tipo === tipo && styles.typeButtonActive,
                  ]}
                  onPress={() => updateField('tipo', tipo)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.tipo === tipo && styles.typeButtonTextActive,
                    ]}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.sectionSubtitle, { marginBottom: 8, marginTop: 12 }]}>Outro</Text>
            <View style={styles.typeButtons}>
              {['Outra'].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.typeButton,
                    formData.tipo === tipo && styles.typeButtonActive,
                  ]}
                  onPress={() => updateField('tipo', tipo)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.tipo === tipo && styles.typeButtonTextActive,
                    ]}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* NOTA FISCAL */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nota Fiscal (Opcional)</Text>
            <Text style={styles.sectionSubtitle}>
              Anexe uma foto ou PDF da nota fiscal
            </Text>

            {notaFiscal ? (
              <View style={styles.nfPreview}>
                {notaFiscalType === 'pdf' ? (
                  <View style={styles.nfPdfPreview}>
                    <Ionicons name="document-text" size={48} color="#FFC107" />
                    <Text style={styles.nfPdfText}>PDF anexado</Text>
                  </View>
                ) : (
                  <Image source={{ uri: notaFiscal }} style={styles.nfImage} resizeMode="contain" />
                )}
                <TouchableOpacity
                  style={styles.nfRemoveBtn}
                  onPress={() => { setNotaFiscal(null); setNotaFiscalType('image'); }}
                >
                  <Ionicons name="trash" size={20} color="#F44336" />
                  <Text style={styles.nfRemoveText}>Remover</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.nfPickerBtn} onPress={pickNotaFiscal}>
                <Ionicons name="document-text" size={32} color="#FFC107" />
                <Text style={styles.nfPickerText}>Fotografar ou Escolher Nota Fiscal</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* INFORMACOES ADICIONAIS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacoes Adicionais</Text>

            <Text style={styles.label}>Caracteristicas Unicas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Adesivos, marcas, detalhes que identificam sua bike"
              value={formData.caracteristicas}
              onChangeText={(text) => updateField('caracteristicas', text)}
              multiline
              numberOfLines={4}
              placeholderTextColor="#666"
            />
          </View>

          {/* RASTREAMENTO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rastreamento</Text>

            <Text style={styles.label}>Link de Rastreamento (Opcional)</Text>
            <Text style={styles.helperText}>
              Cole aqui o link do rastreador (AirTag, GPS, Find My Device, etc.)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={formData.link_rastreamento}
              onChangeText={(text) => updateField('link_rastreamento', text)}
              autoCapitalize="none"
              keyboardType="url"
              placeholderTextColor="#666"
            />
          </View>

          {/* BOTAO CADASTRAR */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#000" />
                <Text style={styles.submitButtonText}>Cadastrar Bicicleta</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  flex: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  photosGrid: {
    gap: 12,
  },
  photoSlot: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  photoPreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
  },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
    borderStyle: 'dashed',
    gap: 10,
  },
  photoPickerText: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#000',
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#000',
  },
  typeButtonActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#000',
  },
  nfPreview: {
    alignItems: 'center',
    gap: 12,
  },
  nfImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  nfPdfPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 32,
    borderRadius: 8,
    gap: 8,
  },
  nfPdfText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '600',
  },
  nfRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  nfRemoveText: {
    color: '#F44336',
    fontWeight: '600',
  },
  nfPickerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFC107',
    borderStyle: 'dashed',
    gap: 8,
  },
  nfPickerText: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: '500',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#FFC107',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
