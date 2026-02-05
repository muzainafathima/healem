import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform();
};

export const initializeApp = async () => {
  if (isNativePlatform()) {
    // Configure status bar
    try {
      await StatusBar.setStyle({ style: Style.Light });
      
      if (getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#3b82f6' });
      }
    } catch (error) {
      console.error('Error configuring status bar:', error);
    }

    // Configure keyboard
    try {
      Keyboard.setResizeMode({ mode: 'body' });
    } catch (error) {
      console.error('Error configuring keyboard:', error);
    }

    // Handle back button on Android
    if (getPlatform() === 'android') {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    }

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active:', isActive);
    });
  }
};

export const hideKeyboard = async () => {
  if (isNativePlatform()) {
    try {
      await Keyboard.hide();
    } catch (error) {
      console.error('Error hiding keyboard:', error);
    }
  }
};

export { StatusBar, Keyboard, App };
