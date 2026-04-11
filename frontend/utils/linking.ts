import { Linking, Platform, Alert } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Abre um link externo no navegador padrão.
 * No web: usa window.open. No mobile: usa Linking.openURL.
 */
export const openExternalLink = (url: string): void => {
  if (!url) {
    Alert.alert('Link indisponivel', 'Nenhum link cadastrado.');
    return;
  }

  if (isWeb) {
    try {
      window.open(url, '_blank');
    } catch (e) {
      window.location.href = url;
    }
  } else {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir o link.');
    });
  }
};

/**
 * Abre o WhatsApp com mensagem pré-preenchida.
 * No web: usa window.open com wa.me. No iOS: tenta scheme nativo.
 */
export const openWhatsAppLink = (phone: string, message: string): void => {
  const encoded = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phone}?text=${encoded}`;

  if (isWeb) {
    try {
      window.open(waUrl, '_blank');
    } catch (e) {
      window.location.href = waUrl;
    }
    return;
  }

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
