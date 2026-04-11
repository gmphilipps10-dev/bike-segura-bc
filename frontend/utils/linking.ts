import { Linking, Platform, Alert } from 'react-native';

/**
 * Abre um link externo no navegador padrão.
 * Fire-and-forget - sem await para funcionar em callbacks de Alert.
 */
export const openExternalLink = (url: string): void => {
  if (!url) {
    Alert.alert('Link indisponivel', 'Nenhum link cadastrado.');
    return;
  }
  Linking.openURL(url).catch(() => {
    Alert.alert('Erro', 'Nao foi possivel abrir o link.');
  });
};

/**
 * Abre o WhatsApp com mensagem pré-preenchida.
 * Fire-and-forget - sem await para funcionar em callbacks de Alert.
 */
export const openWhatsAppLink = (phone: string, message: string): void => {
  const encoded = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phone}?text=${encoded}`;

  if (Platform.OS === 'ios') {
    const whatsappScheme = `whatsapp://send?phone=${phone}&text=${encoded}`;
    Linking.canOpenURL(whatsappScheme).then((canOpen) => {
      if (canOpen) {
        Linking.openURL(whatsappScheme);
      } else {
        Linking.openURL(waUrl).catch(() => {
          Alert.alert('WhatsApp', 'Nao foi possivel abrir o WhatsApp.');
        });
      }
    }).catch(() => {
      Linking.openURL(waUrl).catch(() => {
        Alert.alert('WhatsApp', 'Nao foi possivel abrir o WhatsApp.');
      });
    });
  } else {
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp', 'Nao foi possivel abrir o WhatsApp. Verifique se esta instalado.');
    });
  }
};
