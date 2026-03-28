import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Simular detecção de rede (em produção, usar NetInfo package)
    // For now, usando AppState como proxy
    const subscription = AppState.addEventListener('change', syncOnlineStatus);

    return () => {
      subscription.remove();
    };
  }, []);

  const syncOnlineStatus = async (state: AppStateStatus) => {
    setAppState(state);

    // Se app volta do background, assumir online (será testado na próxima request)
    if (state === 'active') {
      setIsOnline(true);
    } else if (state === 'background' || state === 'inactive') {
      // Não mudar status aqui para evitar blinks
    }
  };

  return {
    isOnline,
    setIsOnline,
  };
}
