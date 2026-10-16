import { onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener } from 'expo-network';
import { useSyncExternalStore } from 'react';

// TanStack Query pauses fetching while offline and refetches when the connection returns.
onlineManager.setEventListener((setOnline) => {
  const subscription = addNetworkStateListener(({ isConnected, isInternetReachable }) => {
    setOnline(isConnected !== false && isInternetReachable !== false);
  });
  return () => subscription.remove();
});

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline()
  );
}
