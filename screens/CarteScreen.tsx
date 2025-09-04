import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/auth';
import openMap from 'react-native-open-maps';

const { width } = Dimensions.get('window');

const getOpenStreetMapHTML = () => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no"
  />
  <title>OpenStreetMap GlobeMoments</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body { margin:0; padding:0; height:100%; background:#fff; }
    #map { height:100vh; width:100vw; }
    .custom-marker{ background:none; border:none; }
    .marker-container{ position:relative; }
    .marker-image{ width:48px; height:48px; border-radius:50%; border:2px solid #ffffff; background-color: #6b7280; display:flex; align-items:center; justify-content:center; font-size:22px; color:white; overflow:hidden; transition: transform 0.2s ease; }
    .marker-image:hover{ transform: scale(1.1); }
    .marker-pin{ width:0; height:0; border-left:7px solid transparent; border-right:7px solid transparent; border-top:11px solid #6b7280; margin-top:-3px; margin-left:17px; }
    .dbg { position:fixed; z-index:9999; left:6px; bottom:6px; background:rgba(0,0,0,.4); color:#fff; font:12px/1.2 monospace; padding:4px 6px; border-radius:4px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="dbg" class="dbg"></div>
  <script>
    let map;
    const markers = new Map(); // id -> { marker }
    const dbg = document.getElementById('dbg');

    function log(...args){ try{ dbg.textContent = args.join(' ') }catch(e){} }

    function createCustomIcon(imageUrl) {
      const html = \`<div class="marker-container">
        <div class="marker-image" style="background-image: url('\${imageUrl}'); background-size: cover; background-position: center;"></div>
        <div class="marker-pin"></div>
      </div>\`;
      return L.divIcon({
        className: 'custom-marker',
        html: html,
        iconSize: [48,65],
        iconAnchor: [24,65],
      });
    }

    function initMap(lat=48.8566, lng=2.3522, zoom=10) {
      if (map) map.remove();
      map = L.map('map', { zoomControl: true }).setView([lat,lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);
      log('map ready');
      // signaler à RN que la carte est prête
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    function addMarker({ id, lat, lng, imageUrl, title='' }) {
      const icon = createCustomIcon(imageUrl);
      const m = L.marker([Number(lat), Number(lng)], { icon }).addTo(map);
      if (title) m.bindPopup(title);
      m.on('click', () => {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type:'markerClick', id, lat, lng }));
      });
      markers.set(id, { marker: m });
    }

    function clearMarkers() {
      markers.forEach(({ marker }) => map.removeLayer(marker));
      markers.clear();
    }

    function centerMap(lat, lng, zoom=15) { map.setView([Number(lat),Number(lng)], zoom); }

    function handleIncomingMessage(raw) {
      try {
        const data = JSON.parse(raw);
        if (data.type === 'addMarker') { addMarker(data); log('addMarker', data.id); }
        if (data.type === 'clearMarkers') { clearMarkers(); log('clear'); }
        if (data.type === 'centerMap') { centerMap(data.lat, data.lng, data.zoom); log('center'); }
      } catch (err) {
        console.error('msg error', err);
        log('msg error');
      }
    }

    // ✅ Android/iOS : écouter les deux canaux
    document.addEventListener('message', (e) => handleIncomingMessage(e.data));
    window.addEventListener('message', (e) => handleIncomingMessage(e.data));

    initMap();
  </script>
</body>
</html>
`;

export default function CarteScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 49.8911,
    longitude: 2.3067,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);

  // Petite file d'attente tant que la WebView n'est pas "prête"
  const queueRef = useRef<any[]>([]);
  const postToMap = useCallback((payload: any) => {
    const msg = JSON.stringify(payload);
    if (!webViewRef.current || !mapLoaded) {
      queueRef.current.push(msg);
      return;
    }
    console.log('➡️ RN → WebView :', payload.type, payload.id ?? '');
    webViewRef.current.postMessage(msg);
  }, [mapLoaded]);

  const flushQueue = useCallback(() => {
    if (!webViewRef.current || !mapLoaded) return;
    if (queueRef.current.length === 0) return;
    console.log('🚿 flush', queueRef.current.length, 'messages');
    queueRef.current.forEach((msg) => webViewRef.current!.postMessage(msg));
    queueRef.current = [];
  }, [mapLoaded]);

  // Firestore listener (par user connecté)
  useEffect(() => {
    if (!user?.uid) return;
    const qRef = query(collection(db, 'photos'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(qRef, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data?.coords?.latitude && data?.coords?.longitude) {
          arr.push({ id: d.id, ...data });
        }
      });
      arr.sort((a, b) => {
        const dateA = new Date(a.date?.seconds ? a.date.seconds * 1000 : a.date || 0).getTime();
        const dateB = new Date(b.date?.seconds ? b.date.seconds * 1000 : b.date || 0).getTime();
        return dateB - dateA;
      });
      console.log('🧭 Firestore -> photos:', arr.length);
      setPhotos(arr);
      if (arr[0]?.coords) {
        setMapRegion((prev) => ({
          ...prev,
          latitude: Number(arr[0].coords.latitude),
          longitude: Number(arr[0].coords.longitude),
        }));
      }
    }, (err) => console.warn('onSnapshot error', err));
    return () => unsubscribe();
  }, [user?.uid]);

  // Pousser les marqueurs (avec re-centrage) dès que data prête
  const updateMapMarkers = useCallback(() => {
    if (!photos.length) return;
    postToMap({ type: 'clearMarkers' });
    photos.forEach((p) => {
      postToMap({
        type: 'addMarker',
        id: p.id,
        lat: Number(p.coords.latitude),
        lng: Number(p.coords.longitude),
        imageUrl: p.imageUrl,
        title: `Photo du ${new Date(p.date?.seconds ? p.date.seconds * 1000 : p.date || Date.now()).toLocaleDateString()}`,
      });
    });
    const head = photos[0];
    if (head?.coords) {
      postToMap({ type: 'centerMap', lat: Number(head.coords.latitude), lng: Number(head.coords.longitude), zoom: 15 });
    }
  }, [photos, postToMap]);

  // Quand la WebView signale "mapReady"
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'mapReady':
          console.log('✅ WebView -> mapReady');
          // délai court pour laisser Leaflet tout initialiser (iOS)
          setTimeout(() => {
            setMapLoaded(true);
            setMapError(false);
            flushQueue();
            updateMapMarkers();
          }, 150);
          break;
        case 'markerClick': {
          const found = photos.find((p) => p.id === data.id);
          if (found) {
            setSelectedPhoto(found);
            setShowModal(true);
          }
          break;
        }
      }
    } catch (e) {
      console.error('onMessage parse error', e);
    }
  };

  // Si data change et carte prête → pousser
  useEffect(() => {
    if (!mapLoaded) return;
    updateMapMarkers();
  }, [photos, mapLoaded, updateMapMarkers]);

  // Sécurité : timeout de carte
  useEffect(() => {
    const t = setTimeout(() => {
      if (!mapLoaded) {
        setMapError(true);
        setMapLoaded(true);
        flushQueue();
      }
    }, 10000);
    return () => clearTimeout(t);
  }, [mapLoaded, flushQueue]);

  const handleOpenInMaps = () => {
    openMap({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      zoom: 15,
      query: 'Photos GlobeMoments',
    });
  };

  const handleCenterPress = () => {
    const centerLat = photos[0]?.coords?.latitude ?? 48.8566;
    const centerLng = photos[0]?.coords?.longitude ?? 2.3522;
    postToMap({ type: 'centerMap', lat: Number(centerLat), lng: Number(centerLng), zoom: 15 });
  };

  return (
    <View style={styles.container}>
      {mapError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Erreur de chargement de la carte.{'\n'}Vous pouvez ouvrir l&apos;emplacement dans votre application de cartes.
          </Text>
          <TouchableOpacity style={styles.openMapsButton} onPress={handleOpenInMaps}>
            <Text style={styles.openMapsButtonText}>Ouvrir dans Maps</Text>
          </TouchableOpacity>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: getOpenStreetMapHTML() }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        originWhitelist={['*']}
        // mixedContentMode utile si tu sers des URLs http (pas le cas ici, mais safe)
        mixedContentMode="always"
        onError={() => { setMapError(true); setMapLoaded(true); }}
      />

      <TouchableOpacity style={styles.centerButton} onPress={handleCenterPress}>
        <Ionicons name="locate" size={24} color="#007AFF" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="fade" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {selectedPhoto && (
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedPhoto.imageUrl }} style={styles.modalImage} resizeMode="contain" />
              <View style={styles.photoInfo}>
                <Text style={styles.photoDate}>
                  {new Date(selectedPhoto.date?.seconds ? selectedPhoto.date.seconds * 1000 : selectedPhoto.date || Date.now()).toLocaleDateString()}
                </Text>
                <Text style={styles.photoLocation}>
                  📍 {Number(selectedPhoto.coords.latitude).toFixed(4)}, {Number(selectedPhoto.coords.longitude).toFixed(4)}
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  errorContainer:{ position:'absolute', top:0,left:0,right:0,bottom:0, justifyContent:'center', alignItems:'center', backgroundColor:'#fff', zIndex:2, padding:20 },
  errorText:{ fontSize:16, color:'#ff4444', textAlign:'center', lineHeight:24, marginBottom:20 },
  openMapsButton:{ backgroundColor:'#007AFF', paddingHorizontal:20, paddingVertical:12, borderRadius:8, marginTop:10 },
  openMapsButtonText:{ color:'#fff', fontSize:16, fontWeight:'bold', textAlign:'center' },
  map:{ flex:1 },
  centerButton:{ position:'absolute', bottom: Platform.OS==='ios' ? 100 : 80, right:20, backgroundColor:'#fff', borderRadius:25, width:50, height:50, justifyContent:'center', alignItems:'center', elevation:5 },
  modalContainer:{ flex:1, backgroundColor:'#000' },
  closeButton:{ position:'absolute', top:20, right:20, zIndex:10, backgroundColor:'rgba(0,0,0,.5)', borderRadius:20, width:40, height:40, justifyContent:'center', alignItems:'center' },
  modalContent:{ flex:1, justifyContent:'center', alignItems:'center' },
  modalImage:{ width, height: width, maxHeight: 400 },
  photoInfo:{ position:'absolute', bottom:50, left:20, right:20, backgroundColor:'rgba(0,0,0,.7)', borderRadius:10, padding:15 },
  photoDate:{ color:'#fff', fontSize:16, fontWeight:'bold', marginBottom:5 },
  photoLocation:{ color:'#fff', fontSize:14 },
});
