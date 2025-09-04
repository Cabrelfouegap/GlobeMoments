import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Import des services
import { AuthProvider, useAuth } from './services/auth';
import { ThemeProvider, useTheme } from './services/ThemeContext';

// Import des écrans
import LoginScreen from './screens/LoginScreen';
import CarteScreen from './screens/CarteScreen';
import CameraScreen from './screens/CameraScreen';
import PhotosScreen from './screens/PhotosScreen';
import CalendrierScreen from './screens/CalendrierScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfilScreen from './screens/ProfilScreen';
import StatistiquesScreen from './screens/StatistiquesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Composant pour gérer la navigation conditionnelle
function AppNavigator() {
  const { user, loading } = useAuth();
  const { theme, isLoading: themeLoading } = useTheme();

  if (loading || themeLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, color: theme.textSecondary }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar
        style={theme.statusBar}
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        {user ? <MainTabs /> : <AuthStack />}
      </SafeAreaView>
    </NavigationContainer>
  );
}

// Stack Navigator pour l'authentification
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator pour la caméra
function CameraStack() {
  const { theme } = useTheme();

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
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: theme.text,
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator pour les réglages
function SettingsStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{
          title: 'Réglages',
          headerStyle: {
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: theme.text,
          },
        }}
      />
      <Stack.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          title: 'Mon Profil',
          headerStyle: {
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: theme.text,
          },
        }}
      />
      <Stack.Screen
        name="Statistiques"
        component={StatistiquesScreen}
        options={{
          title: 'Statistiques',
          headerStyle: {
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: theme.text,
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Tab Navigator principal
function MainTabs() {
  const { theme } = useTheme();

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
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: theme.tabBarBorder,
          height: 60,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
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
        component={SettingsStack}
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
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
