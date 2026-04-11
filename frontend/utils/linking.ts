import { Linking, Platform, Alert } from 'react-native';

/**
 * Abre um link externo no navegador padrão do dispositivo.
 * Compatível com Android e iOS (Safari).
 */
export const openExternalLink = async (url: string): Promise<void> => {
  if (!url) {
    Alert.alert('Link indisponivel', 'Nenhum link cadastrado.');
    return;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback: tentar abrir mesmo sem confirmacao
      await Linking.openURL(url);
    }
  } catch (error) {
    Alert.alert('Erro', 'Nao foi possivel abrir o link. Tente copiar e abrir manualmente no navegador.');
  }
};

/**
 * Abre o WhatsApp com mensagem pré-preenchida.
 * iOS: tenta whatsapp:// scheme primeiro, fallback para https://wa.me
 * Android: usa https://wa.me diretamente
 */
export const openWhatsAppLink = async (phone: string, message: string): Promise<void> => {
  const encoded = encodeURIComponent(message);

  if (Platform.OS === 'ios') {
    // No iOS, tentar o scheme nativo do WhatsApp primeiro
    const whatsappScheme = `whatsapp://send?phone=${phone}&text=${encoded}`;
    try {
      const canOpen = await Linking.canOpenURL(whatsappScheme);
      if (canOpen) {
        await Linking.openURL(whatsappScheme);
        return;
      }
    } catch (_) {
      // Silenciar erro e usar fallback
    }
  }

  // Fallback universal: https://wa.me (funciona em ambas plataformas)
  const waUrl = `https://wa.me/${phone}?text=${encoded}`;
  try {
    await Linking.openURL(waUrl);
  } catch (error) {
    Alert.alert(
      'WhatsApp',
      'Nao foi possivel abrir o WhatsApp. Verifique se esta instalado.',
      [
        { text: 'OK' },
        {
          text: 'Abrir no Navegador',
          onPress: () => Linking.openURL(waUrl).catch(() => {}),
        },
      ]
    );
  }
};
