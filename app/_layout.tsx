import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  useTheme,
} from "react-native-paper";
import { useColorScheme } from "@/components/useColorScheme";
import { SnackbarProvider } from "@/contexts/SnackbarContext";
import { IS_PRODUCTION } from "@/constants/Config";

// Uncomment for production:
// import * as Sentry from 'sentry-expo';

// Initialize Sentry if in production
// if (IS_PRODUCTION) {
//   Sentry.init({
//     dsn: 'YOUR_SENTRY_DSN_HERE',
//     enableInExpoDevelopment: false,
//     debug: false,
//   });
// }

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  // Use Paper's built-in themes
  const paperTheme =
    colorScheme === "dark"
      ? {
          ...MD3DarkTheme,
          colors: {
            ...MD3DarkTheme.colors,
            primary: "#B4A7D6",
          },
        }
      : {
          ...MD3LightTheme,
          colors: {
            ...MD3LightTheme.colors,
            primary: "#6750A4",
          },
        };

  // Use Navigation's built-in themes
  const navigationTheme =
    colorScheme === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <SnackbarProvider>
        <NavigationThemeProvider value={navigationTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor:
                  colorScheme === "dark"
                    ? MD3DarkTheme.colors.background
                    : MD3LightTheme.colors.background,
              },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>
        </NavigationThemeProvider>
      </SnackbarProvider>
    </PaperProvider>
  );
}
