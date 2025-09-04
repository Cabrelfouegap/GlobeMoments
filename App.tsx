import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Import des services
import { AuthProvider } from './services/auth';

// Import des écrans
import CarteScreen from './screens/CarteScreen';
import CameraScreen from './screens/CameraScreen';
import PhotosScreen from './screens/PhotosScreen';
import CalendrierScreen from './screens/CalendrierScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Navigator pour la caméra
function CameraStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CameraMain"
        component={CameraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Photos"
        component={PhotosScreen}
        options={{
          title: 'Mes Photos',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#007AFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Tab Navigator principal
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Carte') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Calendrier') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5, // Plus de padding en bas sur iOS
        },
      })}
      initialRouteName="Camera"
    >
      <Tab.Screen
        name="Carte"
        component={CarteScreen}
        options={{ title: 'Carte' }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraStack}
        options={{ title: 'Caméra' }}
      />
      <Tab.Screen
        name="Calendrier"
        component={CalendrierScreen}
        options={{ title: 'Calendrier' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Réglages' }}
      />
    </Tab.Navigator>
  );
}

// App principal
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar 
            style="dark" 
            backgroundColor="transparent"
            translucent={Platform.OS === 'android'}
          />
          <SafeAreaView style={{ flex: 1 }}>
            <MainTabs />
          </SafeAreaView>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
