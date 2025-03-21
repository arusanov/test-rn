import { useState } from "react";
import { analyzeFoodImage, FoodAnalysisResult } from "@/utils/openaiApi";

interface OpenAIVisionState {
  isAnalyzing: boolean;
  error: string | null;
  result: FoodAnalysisResult | null;
}

/**
 * Custom hook for OpenAI Vision API integration
 * Provides methods and state for analyzing images using OpenAI Vision
 */
export const useOpenAIVision = () => {
  const [state, setState] = useState<OpenAIVisionState>({
    isAnalyzing: false,
    error: null,
    result: null,
  });

  /**
   * Analyze an image with OpenAI Vision
   * @param imageUri Local URI of the image to analyze
   */
  const analyzeImage = async (
    imageUri: string
  ): Promise<FoodAnalysisResult> => {
    // Reset state
    setState({
      isAnalyzing: true,
      error: null,
      result: null,
    });

    try {
      // Call the OpenAI API
      const result = await analyzeFoodImage(imageUri);

      // Update state with successful result
      setState({
        isAnalyzing: false,
        error: null,
        result,
      });

      return result;
    } catch (error) {
      // Update state with error
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setState({
        isAnalyzing: false,
        error: errorMessage,
        result: null,
      });

      throw error;
    }
  };

  /**
   * Reset the analysis state
   */
  const resetAnalysis = () => {
    setState({
      isAnalyzing: false,
      error: null,
      result: null,
    });
  };

  return {
    ...state,
    analyzeImage,
    resetAnalysis,
  };
};
