import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let installVersion = 0;
const installListeners = new Set<() => void>();

function notifyInstallChange() {
  installVersion += 1;
  installListeners.forEach(listener => listener());
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    notifyInstallChange();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyInstallChange();
  });
}

export function useAppInstall() {
  const [, setVersion] = useState(installVersion);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);

  useEffect(() => {
    const updateDeviceState = () => {
      const mobileByScreen = window.matchMedia('(max-width: 767px)').matches;
      const mobileByAgent = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(mobileByScreen || mobileByAgent);
      setIsIOS(/iPad|iPhone|iPod/i.test(navigator.userAgent));
      setIsInstalled(isStandaloneMode());
    };

    const listener = () => {
      setVersion(installVersion);
      updateDeviceState();
    };

    updateDeviceState();
    installListeners.add(listener);
    window.addEventListener('resize', updateDeviceState);

    return () => {
      installListeners.delete(listener);
      window.removeEventListener('resize', updateDeviceState);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredInstallPrompt) return false;

    await deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    setIsInstalled(outcome === 'accepted' || isStandaloneMode());
    notifyInstallChange();
    return true;
  };

  return {
    isMobile,
    isIOS,
    isInstalled,
    canPromptInstall: !!deferredInstallPrompt,
    promptInstall,
  };
}
