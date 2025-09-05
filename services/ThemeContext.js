// ThemeContext.js
// Contexte pour gérer le thème sombre/clair de l'application
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const lightTheme = {
  // Couleurs principales
  primary: '#007AFF',
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceSecondary: '#f8f9fa',
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#e0e0e0',
  borderSecondary: '#f0f0f0',

  // Couleurs spécifiques
  cardBackground: '#ffffff',
  inputBackground: '#f9f9f9',
  modalBackground: '#ffffff',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  warningBackground: '#fff5f5',
  warningBorder: '#ff3b30',

  // Couleurs d'état
  success: '#34c759',
  error: '#ff3b30',
  warning: '#ff9500',
  info: '#007AFF',

  // Couleurs d'interface
  tabBarBackground: '#ffffff',
  tabBarBorder: '#e0e0e0',
  headerBackground: '#ffffff',
  statusBar: 'dark-content',
  buttonSecondary: '#f0f0f0',
};

const darkTheme = {
  // Couleurs principales
  primary: '#0A84FF',
  background: '#000000',
  surface: '#1c1c1e',
  surfaceSecondary: '#2c2c2e',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#888888',
  border: '#38383a',
  borderSecondary: '#48484a',

  // Couleurs spécifiques
  cardBackground: '#1c1c1e',
  inputBackground: '#2c2c2e',
  modalBackground: '#1c1c1e',
  modalOverlay: 'rgba(0, 0, 0, 0.8)',
  warningBackground: '#2c1c1c',
  warningBorder: '#ff453a',

  // Couleurs d'état
  success: '#30d158',
  error: '#ff453a',
  warning: '#ff9f0a',
  info: '#0A84FF',

  // Couleurs d'interface
  tabBarBackground: '#1c1c1e',
  tabBarBorder: '#38383a',
  headerBackground: '#1c1c1e',
  statusBar: 'light-content',
  buttonSecondary: '#2c2c2e',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la préférence sauvegardée au démarrage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const systemTheme = Appearance.getColorScheme();

        if (savedTheme) {
          const isDark = savedTheme === 'dark';
          setIsDarkMode(isDark);
          setTheme(isDark ? darkTheme : lightTheme);
        } else if (systemTheme) {
          const isDark = systemTheme === 'dark';
          setIsDarkMode(isDark);
          setTheme(isDark ? darkTheme : lightTheme);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du thème:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Écouter les changements du thème système
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Ne changer que si aucune préférence n'est sauvegardée
      const checkSavedTheme = async () => {
        try {
          const savedTheme = await AsyncStorage.getItem('theme');
          if (!savedTheme && colorScheme) {
            const isDark = colorScheme === 'dark';
            setIsDarkMode(isDark);
            setTheme(isDark ? darkTheme : lightTheme);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du thème sauvegardé:', error);
        }
      };

      checkSavedTheme();
    });

    return () => subscription?.remove();
  }, []);

  const toggleTheme = async () => {
    try {
      const newIsDarkMode = !isDarkMode;
      const newTheme = newIsDarkMode ? darkTheme : lightTheme;

      setIsDarkMode(newIsDarkMode);
      setTheme(newTheme);

      // Sauvegarder la préférence
      await AsyncStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');

      console.log('🎨 Thème changé:', newIsDarkMode ? 'sombre' : 'clair');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  const setLightTheme = async () => {
    try {
      setIsDarkMode(false);
      setTheme(lightTheme);
      await AsyncStorage.setItem('theme', 'light');
      console.log('🌞 Mode clair activé');
    } catch (error) {
      console.error('Erreur lors du changement vers le mode clair:', error);
    }
  };

  const setDarkTheme = async () => {
    try {
      setIsDarkMode(true);
      setTheme(darkTheme);
      await AsyncStorage.setItem('theme', 'dark');
      console.log('🌙 Mode sombre activé');
    } catch (error) {
      console.error('Erreur lors du changement vers le mode sombre:', error);
    }
  };

  const value = {
    theme,
    isDarkMode,
    isLoading,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};
