import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../ecrans/AuthScreen';
import CalendrierScreen from '../ecrans/CalendrierScreen';
import CameraScreen from '../ecrans/CameraScreen';
import CarteScreen from '../ecrans/CarteScreen';
import PhotosScreen from '../ecrans/PhotosScreen';
import ProfilScreen from '../ecrans/ProfilScreen';
import { useAuth } from '../services/auth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          title: 'Caméra',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="photo-camera" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Photos"
        component={PhotosScreen}
        options={{
          title: 'Photos',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="photo-library" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Carte"
        component={CarteScreen}
        options={{
          title: 'Carte',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendrier"
        component={CalendrierScreen}
        options={{
          title: 'Calendrier',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-today" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Calendrier" component={CalendrierScreen} />
          <Stack.Screen name="Photos" component={PhotosScreen} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>

    </NavigationContainer>
  );
}
