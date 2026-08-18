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
import { useEntitlement } from '../src/store/entitlementStore';

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
  const [loaded, fontError] = useFonts({
    ArchivoBlack_400Regular,
    Archivo_600SemiBold,
    Archivo_800ExtraBold,
    SpaceMono_700Bold,
  });

  // Start once the fonts are in *or* once loading them has failed. Gating only
  // on `loaded` means a font that never resolves leaves the splash up forever
  // with no way out — the app looks hung. System fonts are an ugly fallback;
  // an app that never opens is not a fallback at all.
  const ready = loaded || fontError != null;

  useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync();
    // Warm the players we hit first, so the opening tap isn't silent.
    preloadSounds();

    // Re-ask the store what this account owns. Silent and non-blocking: a
    // refund or a family-sharing removal takes effect here, and being offline
    // leaves the cached entitlement alone rather than locking someone out of
    // what they paid for.
    void useEntitlement.getState().verify();

    const prefs = usePrefs.getState();
    track({ name: 'app_open', is_first_open: !prefs.launched });
    if (!prefs.launched) prefs.set({ launched: true });
  }, [ready]);

  if (!ready) return null;

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
