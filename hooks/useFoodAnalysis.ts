import { useState } from "react";
import { useOpenAIVision } from "./useOpenAIVision";
import { FoodAnalysisResult as OpenAIResult } from "@/utils/openaiApi";

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

  const analyzeImage = async (imageUri: string): Promise<void> => {
    setIsAnalyzing(true);
    setFoodNotRecognized(false);
    setError(null);

    try {
      // Attempt to analyze with OpenAI
      const result: OpenAIResult = await analyzeWithOpenAI(imageUri);

      // Check if food was found using the new foodFound field
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
      setError(err instanceof Error ? err.message : "Failed to analyze image");
      console.error("Food analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = (): void => {
    setRecognizedFood("");
    setEstimatedCalories(0);
    setNutritionData(null);
    setFoodNotRecognized(false);
    setError(null);
  };

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
