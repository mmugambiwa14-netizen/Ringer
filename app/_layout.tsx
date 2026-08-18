import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { Archivo_600SemiBold, Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { color } from '../src/ui/tokens';
import { CrashScreen } from '../src/ui/CrashScreen';
import { preloadSounds } from '../src/lib/sound';
import { track } from '../src/lib/analytics';
import { useGame } from '../src/store/gameStore';
import { usePrefs } from '../src/store/prefsStore';

void SplashScreen.preventAutoHideAsync();

/**
 * expo-router renders this instead of the tree when a screen throws.
 * Without it a crash shows a red box in dev and a blank white screen in
 * production, and the session is gone.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <CrashScreen
      error={error}
      retry={retry}
      reset={() => {
        useGame.getState().reset();
        retry();
      }}
    />
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    ArchivoBlack_400Regular,
    Archivo_600SemiBold,
    Archivo_800ExtraBold,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (!loaded) return;
    void SplashScreen.hideAsync();
    // Warm the players we hit first, so the opening tap isn't silent.
    preloadSounds();

    const prefs = usePrefs.getState();
    track({ name: 'app_open', is_first_open: !prefs.launched });
    if (!prefs.launched) prefs.set({ launched: true });
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.paper }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 140,
            contentStyle: { backgroundColor: color.paper },
            // No swipe-back mid-round: a stray edge swipe during a reveal
            // would drop the table back into the previous player's card.
            gestureEnabled: false,
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
