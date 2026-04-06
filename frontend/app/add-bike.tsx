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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { bikeAPI } from '../utils/api';

export default function AddBikeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    cor: '',
    numero_serie: '',
    tipo: 'Urbana',
    valor_estimado: '',
    caracteristicas: '',
    link_rastreamento: '',
  });
  const [fotos, setFotos] = useState<string[]>([]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFotos((prev) => [...prev, base64Image]);
    }
  };

  const removePhoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const { marca, modelo, cor, numero_serie, tipo } = formData;

    if (!marca || !modelo || !cor || !numero_serie || !tipo) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (fotos.length < 3) {
      Alert.alert('Erro', 'É necessário adicionar pelo menos 3 fotos da bicicleta');
      return;
    }

    setLoading(true);
    try {
      await bikeAPI.create({
        marca,
        modelo,
        cor,
        numero_serie,
        fotos,
        tipo,
        valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : undefined,
        caracteristicas: formData.caracteristicas || undefined,
        link_rastreamento: formData.link_rastreamento || undefined,
      });

      Alert.alert('Sucesso!', 'Bicicleta cadastrada com sucesso', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cadastrar Bicicleta</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotos da Bicicleta *</Text>
            <Text style={styles.sectionSubtitle}>Mínimo 3 fotos</Text>

            <View style={styles.photosContainer}>
              {fotos.map((foto, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: foto }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
              {fotos.length < 6 && (
                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                  <Ionicons name="camera" size={32} color="#4CAF50" />
                  <Text style={styles.addPhotoText}>Adicionar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>

            <Text style={styles.label}>Marca *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Caloi, Specialized, Trek"
              value={formData.marca}
              onChangeText={(text) => updateField('marca', text)}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Modelo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Elite 30, Rockhopper"
              value={formData.modelo}
              onChangeText={(text) => updateField('modelo', text)}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Cor *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Vermelha, Preta, Azul"
              value={formData.cor}
              onChangeText={(text) => updateField('cor', text)}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Número de Série *</Text>
            <TextInput
              style={styles.input}
              placeholder="Número gravado no quadro"
              value={formData.numero_serie}
              onChangeText={(text) => updateField('numero_serie', text)}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Tipo *</Text>
            <View style={styles.typeButtons}>
              {['Urbana', 'MTB', 'Speed', 'Elétrica'].map((tipo) => (
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Adicionais</Text>

            <Text style={styles.label}>Valor Estimado (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2500.00"
              value={formData.valor_estimado}
              onChangeText={(text) => updateField('valor_estimado', text)}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Características Únicas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Adesivos, marcas, detalhes que identificam sua bike"
              value={formData.caracteristicas}
              onChangeText={(text) => updateField('caracteristicas', text)}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rastreamento</Text>

            <Text style={styles.label}>Link de Rastreamento</Text>
            <Text style={styles.helperText}>
              Cole aqui o link do seu rastreador (AirTag, Find My Device, GPS)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={formData.link_rastreamento}
              onChangeText={(text) => updateField('link_rastreamento', text)}
              autoCapitalize="none"
              keyboardType="url"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Cadastrando...' : 'Cadastrar Bicicleta'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});