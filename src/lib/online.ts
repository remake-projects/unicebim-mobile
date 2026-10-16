import { onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';
import { useSyncExternalStore } from 'react';

const isOnline = ({ isConnected, isInternetReachable }: NetworkState) =>
  isConnected !== false && isInternetReachable !== false;

// TanStack Query pauses fetching while offline and refetches when the connection returns.
// The listener only reports changes, so the state at launch is read once as well; otherwise an app
// opened without a connection would think it is online and fail every query instead of pausing.
onlineManager.setEventListener((setOnline) => {
  getNetworkStateAsync()
    .then((state) => setOnline(isOnline(state)))
    .catch(() => {});
  const subscription = addNetworkStateListener((state) => setOnline(isOnline(state)));
  return () => subscription.remove();
});

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline()
  );
}
