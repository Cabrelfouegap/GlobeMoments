// services/LocationService.ts
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number; accuracy?: number | null };

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentCoords(): Promise<Coords | null> {
  try {
    const last = await Location.getLastKnownPositionAsync({});
    if (last?.coords) {
      return {
        latitude: last.coords.latitude,
        longitude: last.coords.longitude,
        accuracy: last.coords.accuracy ?? null,
      };
    }
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      maximumAge: 10_000,
      timeout: 10_000,
    });
    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
      accuracy: current.coords.accuracy ?? null,
    };
  } catch (e) {
    console.warn('⚠️ getCurrentCoords error', e);
    return null;
  }
}
