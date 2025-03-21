import { useState } from "react";
import { useOpenAIVision } from "./useOpenAIVision";
import { FoodAnalysisResult as OpenAIResult } from "@/utils/openaiApi";

// Fallback food database for when API calls fail
const fallbackFoodDatabase = [
  { name: "Apple", calories: 95 },
  { name: "Banana", calories: 105 },
  { name: "Burger", calories: 550 },
  { name: "Pizza Slice", calories: 285 },
  { name: "Salad", calories: 120 },
  { name: "Chicken Breast", calories: 165 },
  { name: "Pasta", calories: 320 },
  { name: "Steak", calories: 330 },
  { name: "Sushi Roll", calories: 255 },
  { name: "Avocado Toast", calories: 190 },
  { name: "Oatmeal", calories: 150 },
  { name: "Yogurt", calories: 120 },
];

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

  // Use the OpenAI Vision hook
  const { analyzeImage: analyzeWithOpenAI, error: openAIError } =
    useOpenAIVision();

  const analyzeImage = async (imageUri: string): Promise<void> => {
    setIsAnalyzing(true);

    try {
      // Attempt to analyze with OpenAI
      const result: OpenAIResult = await analyzeWithOpenAI(imageUri);

      // Set the analysis results
      setRecognizedFood(result.description);
      setEstimatedCalories(result.calories);
      setNutritionData(result.nutrition);
    } catch (error) {
      console.warn("OpenAI analysis failed, using fallback:", error);

      // Use fallback if OpenAI fails
      const randomIndex = Math.floor(
        Math.random() * fallbackFoodDatabase.length
      );
      const fallbackFood = fallbackFoodDatabase[randomIndex];

      setRecognizedFood(fallbackFood.name);
      setEstimatedCalories(fallbackFood.calories);
      setNutritionData({
        protein: 20, // Default fallback values
        fat: 30,
        carbs: 50,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = (): void => {
    setRecognizedFood("");
    setEstimatedCalories(0);
    setNutritionData(null);
  };

  return {
    isAnalyzing,
    recognizedFood,
    estimatedCalories,
    nutritionData,
    analyzeImage,
    resetAnalysis,
    apiError: openAIError,
  };
};
