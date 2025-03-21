import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, useTheme, Surface, Appbar } from "react-native-paper";
import { View } from "@/components/Themed";

import CameraView from "@/components/CameraView";
import FoodAnalysisResult from "@/components/FoodAnalysisResult";
import HistorySection from "@/components/HistorySection";
import CalorieStats from "@/components/CalorieStats";
import LoadingScreen from "@/components/LoadingScreen";
import { useCamera, useFoodAnalysis, useFoodEntries } from "@/hooks";
import { useSnackbar } from "@/contexts/SnackbarContext";

export default function Index(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const hasCompleted = await AsyncStorage.getItem(
          "hasCompletedOnboarding"
        );
        if (hasCompleted === "true") {
        } else {
          // Redirect directly to onboarding
          router.replace("welcome" as never);
          return;
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void checkOnboarding();
  }, [router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <HomeScreen />;
}

function HomeScreen(): React.ReactElement {
  const params = useLocalSearchParams();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const theme = useTheme();
  const router = useRouter();

  // Refresh component when router params change (triggered by settings)
  useEffect(() => {
    if (params.refresh) {
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [params.refresh]);

  // Food analysis hook
  const {
    isAnalyzing,
    recognizedFood,
    estimatedCalories,
    analyzeImage,
    resetAnalysis,
    nutritionData,
    foodNotRecognized,
  } = useFoodAnalysis();

  // Food entries hook
  const {
    groupedEntries,
    todaysCalories,
    addFoodEntry,
    deleteFoodEntry,
    isAnalyzingNutrition,
    analyzeNutritionForDate,
  } = useFoodEntries(refreshTrigger);

  // Camera hook with integrated analysis
  const {
    hasPermission,
    image,
    takePicture,
    resetImage,
    setImage,
    analyzeImage: directAnalyzeImage,
  } = useCamera(analyzeImage);

  // Snackbar hook
  const { showSnackbar } = useSnackbar();

  // Handle food selection
  const handleSaveFood = useCallback(
    async (
      food = recognizedFood,
      calories = estimatedCalories
    ): Promise<void> => {
      try {
        // Convert null to undefined for imageUri
        await addFoodEntry(
          food,
          calories,
          image || undefined,
          nutritionData || undefined
        );

        showSnackbar(`Added ${food} (${calories} calories) to your food log`);

        // Reset state
        resetImage();
        resetAnalysis();
      } catch (error) {
        showSnackbar(
          typeof error === "string" ? error : "Failed to save food entry"
        );
      }
    },
    [
      recognizedFood,
      estimatedCalories,
      image,
      nutritionData,
      addFoodEntry,
      resetImage,
      resetAnalysis,
      showSnackbar,
    ]
  );

  // Handle discarding the food analysis
  const handleDiscard = useCallback((): void => {
    resetImage();
    resetAnalysis();
    showSnackbar("Food analysis discarded");
  }, [resetImage, resetAnalysis, showSnackbar]);

  if (hasPermission === null) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text variant="bodyMedium">Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text variant="bodyMedium">No access to camera</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content
          title={<CalorieStats todaysCalories={todaysCalories} />}
          style={styles.appbarContent}
        />
        <Appbar.Action
          icon="cog"
          onPress={() => router.push("settings" as never)}
        />
      </Appbar.Header>

      <Surface
        style={[
          styles.fixedHeaderContainer,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
        elevation={1}
      >
        <View style={styles.cameraContainer}>
          <CameraView
            image={image}
            onCameraSelect={takePicture}
            setImage={setImage}
            analyzeImage={directAnalyzeImage}
          />
        </View>

        {(isAnalyzing || recognizedFood || foodNotRecognized) && (
          <View style={styles.analysisContainer}>
            <FoodAnalysisResult
              isAnalyzing={isAnalyzing}
              recognizedFood={recognizedFood}
              estimatedCalories={estimatedCalories}
              nutritionData={nutritionData}
              onSaveFood={handleSaveFood}
              onDiscard={handleDiscard}
            />
          </View>
        )}
      </Surface>

      <HistorySection
        groupedEntries={groupedEntries}
        onDeleteEntry={deleteFoodEntry}
        isAnalyzingNutrition={isAnalyzingNutrition}
        onAnalyzeDate={analyzeNutritionForDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  fixedHeaderContainer: {
    paddingHorizontal: 16,
    zIndex: 1,
    paddingBottom: 12,
    elevation: 4,
    width: "100%",
  },
  welcomeText: {
    marginBottom: 20,
    textAlign: "center",
  },
  appbarContent: {
    alignItems: "center",
  },
  cameraContainer: {
    width: "100%",
    position: "relative",
  },
  analysisContainer: {
    width: "100%",
    marginTop: 12,
    backgroundColor: "transparent",
  },
});
