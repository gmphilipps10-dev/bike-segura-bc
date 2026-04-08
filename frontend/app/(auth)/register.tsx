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
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
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
                setFotoPerfil(`data:image/jpeg;base64,${result.assets[0].base64}`);
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
                setFotoPerfil(`data:image/jpeg;base64,${result.assets[0].base64}`);
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

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2');
    }
    return value;
  };

  const handleRegister = async () => {
    const { nome_completo, cpf, data_nascimento, telefone, email, senha, confirmarSenha } =
      formData;

    if (!fotoPerfil) {
      Alert.alert('Foto Obrigatória', 'Adicione uma foto de perfil para continuar.');
      return;
    }

    if (!nome_completo || !cpf || !data_nascimento || !telefone || !email || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        nome_completo,
        cpf: cpf.replace(/\D/g, ''),
        data_nascimento,
        telefone: telefone.replace(/\D/g, ''),
        email,
        senha,
        foto_perfil: fotoPerfil,
      });
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Cadastre-se</Text>
        </View>

        <View style={styles.form}>
          {/* Foto de Perfil */}
          <Text style={styles.label}>Foto de Perfil *</Text>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            {fotoPerfil ? (
              <Image source={{ uri: fotoPerfil }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={48} color="#666" />
                <Text style={styles.photoPlaceholderText}>Adicionar Foto</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="João Silva"
            value={formData.nome_completo}
            onChangeText={(text) => updateField('nome_completo', text)}
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChangeText={(text) => updateField('cpf', formatCPF(text))}
            keyboardType="numeric"
            maxLength={14}
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Data de Nascimento</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/AAAA"
            value={formData.data_nascimento}
            onChangeText={(text) => updateField('data_nascimento', formatDate(text))}
            keyboardType="numeric"
            maxLength={10}
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            value={formData.telefone}
            onChangeText={(text) => updateField('telefone', formatPhone(text))}
            keyboardType="phone-pad"
            maxLength={15}
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            value={formData.senha}
            onChangeText={(text) => updateField('senha', text)}
            secureTextEntry
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Confirmar Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite a senha novamente"
            value={formData.confirmarSenha}
            onChangeText={(text) => updateField('confirmarSenha', text)}
            secureTextEntry
            placeholderTextColor="#666"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>Já tem conta? Faça login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 200,
    height: 140,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFC107',
    marginTop: 8,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  photoButton: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFC107',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FFC107',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFC107',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1a1a1a',
    color: '#fff',
  },
  button: {
    backgroundColor: '#FFC107',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  linkText: {
    color: '#FFC107',
    fontSize: 14,
  },
});
