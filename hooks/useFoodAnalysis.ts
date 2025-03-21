import { useState, useCallback } from "react";
import { useOpenAIVision } from "./useOpenAIVision";
import { FoodAnalysisResult as OpenAIResult } from "@/utils/openaiApi";
import { APP_CONFIG } from "@/constants/Config";
// import * as Sentry from "sentry-expo"; // Will need to be installed for production

export interface FoodAnalysisData {
  description: string;
  calories: number;
  nutrition: {
    protein: number;
    fat: number;
    carbs: number;
  };
}

export const useFoodAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [recognizedFood, setRecognizedFood] = useState<string>("");
  const [estimatedCalories, setEstimatedCalories] = useState<number>(0);
  const [nutritionData, setNutritionData] = useState<
    FoodAnalysisData["nutrition"] | null
  >(null);
  const [foodNotRecognized, setFoodNotRecognized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use the OpenAI Vision hook
  const { analyzeImage: analyzeWithOpenAI, error: openAIError } =
    useOpenAIVision();

  const analyzeImage = useCallback(
    async (imageUri: string): Promise<void> => {
      // Skip analysis if feature is disabled
      if (!APP_CONFIG.FEATURES.ENABLE_NUTRITION_ANALYSIS) {
        setError("Food analysis is currently disabled");
        return;
      }

      setIsAnalyzing(true);
      setFoodNotRecognized(false);
      setError(null);

      try {
        // Attempt to analyze with OpenAI
        const result: OpenAIResult = await analyzeWithOpenAI(imageUri);

        // Check if food was found using the foodFound field
        if (!result.foodFound) {
          setFoodNotRecognized(true);
          setRecognizedFood("");
          setEstimatedCalories(0);
          setNutritionData(null);
          return;
        }

        // Set the analysis results when food is found
        setRecognizedFood(result.description);
        setEstimatedCalories(result.calories);
        setNutritionData(result.nutrition);
      } catch (err) {
        // Handle error without using fallback
        setFoodNotRecognized(true);
        setRecognizedFood("");
        setEstimatedCalories(0);
        setNutritionData(null);

        const errorMessage =
          err instanceof Error ? err.message : "Failed to analyze image";
        setError(errorMessage);

        // Log error to console and monitoring service if in production
        console.error("Food analysis error:", err);

        // Report error to monitoring service (like Sentry) - commented out until Sentry is added
        // Sentry.Native.captureException(err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [analyzeWithOpenAI]
  );

  const resetAnalysis = useCallback((): void => {
    setRecognizedFood("");
    setEstimatedCalories(0);
    setNutritionData(null);
    setFoodNotRecognized(false);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    recognizedFood,
    estimatedCalories,
    nutritionData,
    analyzeImage,
    resetAnalysis,
    apiError: error || openAIError,
    foodNotRecognized,
  };
};
