import * as FileSystem from "expo-file-system";
import {
  OPENAI_API_KEY,
  APP_CONFIG,
  hasValidApiKey,
} from "../constants/Config";
import { FoodEntry } from "@/components/types";

/**
 * Food analysis result schema
 */
export interface FoodAnalysisResult {
  foodFound: boolean;
  description: string;
  calories: number;
  nutrition: {
    protein: number; // percentage
    fat: number; // percentage
    carbs: number; // percentage
  };
}

/**
 * Daily nutritional advice result schema
 */
export interface DailyNutritionAdvice {
  summary: string;
  advice: string;
}

// Validate if API key exists
const validateApiKey = (): void => {
  if (!hasValidApiKey()) {
    throw new Error(
      "OpenAI API key is missing or invalid. Please add it to your environment variables."
    );
  }
};

// Constants
const API_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = APP_CONFIG.OPENAI.DEFAULT_MODEL;
const API_TIMEOUT = APP_CONFIG.OPENAI.API_TIMEOUT_MS;

/**
 * Helper function to make OpenAI API requests with timeout
 */
async function makeOpenAIRequest(body: any): Promise<any> {
  validateApiKey();

  // Create an abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error (${response.status}): ${
          errorData.error?.message || response.statusText || "Unknown error"
        }`
      );
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("OpenAI API request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Analyzes a food image using OpenAI's Vision API
 * @param imageUri Local URI of the image to analyze
 * @returns Food analysis result with description, calories and nutrition
 */
export async function analyzeFoodImage(
  imageUri: string
): Promise<FoodAnalysisResult> {
  try {
    // Validate the image URI
    if (!imageUri || !imageUri.startsWith("file://")) {
      throw new Error("Invalid image URI format");
    }

    // Convert image to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    }).catch(() => {
      throw new Error("Failed to read image file");
    });

    // Prepare the system prompt for accurate food detection
    const systemPrompt = `
      You are a food recognition AI with nutrition expertise.
      Analyze the provided food image and:
      1. Identify the food item(s) present. Only food items should be identified.
      2. Estimate the calories (be specific with a number)
      3. Provide approximate nutritional breakdown as percentages (protein, fat, carbs)
      
      IMPORTANT: First determine if there is any food visible in the image.
      
      Respond with valid JSON matching this schema:
      {
        "foodFound": boolean,
        "description": "Detailed food description",
        "calories": number,
        "nutrition": {
          "protein": number,
          "fat": number,
          "carbs": number
        }
      }

      If NO FOOD is visible in the image or you cannot identify any food with confidence, set "foodFound" to false and use empty or zero values for other fields:
      {
        "foodFound": false,
        "description": "",
        "calories": 0,
        "nutrition": {
          "protein": 0,
          "fat": 0,
          "carbs": 0
        }
      }
    
      Ensure percentages add up to 100. If you're uncertain about the exact food but can see some kind of food, set foodFound to true and provide your best estimate.
    `;

    // Make API request
    const data = await makeOpenAIRequest({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image. Identify the food, estimate calories, and provide nutritional breakdown.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 5000,
    });

    // Extract JSON result from the response
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    // Parse the JSON response
    try {
      // Extract JSON from the response (in case there's any non-JSON text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;

      const result = JSON.parse(jsonStr) as FoodAnalysisResult;

      // If foodFound is false, return standardized empty result
      if (result.foodFound === false) {
        return {
          foodFound: false,
          description: "",
          calories: 0,
          nutrition: {
            protein: 0,
            fat: 0,
            carbs: 0,
          },
        };
      }

      // Validate the result structure when food is found
      if (
        typeof result.foodFound !== "boolean" ||
        !result.description ||
        typeof result.calories !== "number" ||
        !result.nutrition ||
        typeof result.nutrition.protein !== "number" ||
        typeof result.nutrition.fat !== "number" ||
        typeof result.nutrition.carbs !== "number"
      ) {
        throw new Error("Invalid response format");
      }

      // Ensure nutrition percentages add up to 100
      const totalNutrition =
        result.nutrition.protein +
        result.nutrition.fat +
        result.nutrition.carbs;
      if (Math.abs(totalNutrition - 100) > 5) {
        // Normalize to 100 if more than 5% off
        const factor = 100 / totalNutrition;
        result.nutrition.protein = Math.round(
          result.nutrition.protein * factor
        );
        result.nutrition.fat = Math.round(result.nutrition.fat * factor);
        result.nutrition.carbs = Math.round(result.nutrition.carbs * factor);

        // Adjust to ensure total is exactly 100
        const newTotal =
          result.nutrition.protein +
          result.nutrition.fat +
          result.nutrition.carbs;
        if (newTotal !== 100) {
          result.nutrition.carbs += 100 - newTotal;
        }
      }

      return result;
    } catch (err) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Failed to parse OpenAI response");
    }
  } catch (error) {
    console.error("Food image analysis error:", error);
    throw error;
  }
}

/**
 * Analyzes a full day of food entries and provides nutritional advice
 *
 * @param dateString The formatted date string (e.g., "Monday, Jan 1")
 * @param foodEntries Array of food entries for the day
 * @param calorieGoal The user's daily calorie goal
 * @returns Nutritional advice and summary
 */
export async function analyzeDailyNutrition(
  dateString: string,
  foodEntries: FoodEntry[],
  calorieGoal: number
): Promise<DailyNutritionAdvice> {
  try {
    // Validate inputs
    if (!Array.isArray(foodEntries) || foodEntries.length === 0) {
      return {
        summary: "No food entries to analyze",
        advice: "Add some food entries to get personalized nutrition advice.",
      };
    }

    if (!calorieGoal || calorieGoal <= 0) {
      calorieGoal = 2000; // Default calorie goal if invalid
    }

    // Calculate total calories and macronutrients
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    // Create a detailed summary of all foods eaten with their nutritional info
    const foodDescriptions = foodEntries
      .map((entry) => {
        totalCalories += entry.calories;

        if (entry.nutrition) {
          // Weight the macros by calories
          const entryProtein = (entry.nutrition.protein / 100) * entry.calories;
          const entryFat = (entry.nutrition.fat / 100) * entry.calories;
          const entryCarbs = (entry.nutrition.carbs / 100) * entry.calories;

          totalProtein += entryProtein;
          totalFat += entryFat;
          totalCarbs += entryCarbs;

          // Include detailed nutrition information for each food item
          return `- ${entry.name} (${entry.calories} calories)
    • Protein: ${entry.nutrition.protein}%
    • Fat: ${entry.nutrition.fat}%
    • Carbs: ${entry.nutrition.carbs}%`;
        }

        return `- ${entry.name} (${entry.calories} calories)`;
      })
      .join("\n");

    // Calculate macro percentages
    const totalNutrientCalories = totalCalories || 1; // Avoid division by zero
    const proteinPercentage = Math.round(
      (totalProtein / totalNutrientCalories) * 100
    );
    const fatPercentage = Math.round((totalFat / totalNutrientCalories) * 100);
    const carbsPercentage = Math.round(
      (totalCarbs / totalNutrientCalories) * 100
    );

    // Calculate percentage of daily calorie goal consumed
    const percentOfGoal = Math.round((totalCalories / calorieGoal) * 100);

    // Prepare the system prompt for nutritional advice
    const systemPrompt = `
      You are a nutritionist AI assistant specialized in analyzing daily food intake and providing personalized guidance.
      
      Review the user's complete food log for ${dateString} and provide an insightful analysis based on:
      
      1. Overall food choices and eating patterns
      2. Comparison of total calories to their daily calorie goal (${percentOfGoal}% of goal consumed)
      3. Macro distribution (protein: ${proteinPercentage}%, fat: ${fatPercentage}%, carbs: ${carbsPercentage}%)
      4. Potential nutritional gaps or imbalances based on food choices
      5. Any concerning patterns (e.g., excessive processed foods, lack of vegetables)
      
      Then provide specific, actionable advice including:
      1. Food recommendations that would complement their current choices
      2. Suggestions for balancing macronutrients if needed
      3. Potential substitutions to improve nutritional quality
      
      Your response should be friendly, motivational, and practical. Avoid overly strict recommendations.
      Use a collaborative tone, suggesting improvements rather than criticizing choices.
      
      Respond with JSON in this format:
      {
        "summary": "Brief overview of the day's nutrition and eating patterns (1 sentence)",
        "advice": "Specific, actionable nutritional advice (2-3 sentences)"
      }
    `;

    // Prepare user message with nutritional data
    const userMessage = `
      Date: ${dateString}
      
      Daily Calorie Goal: ${calorieGoal} calories
      Total Calories Consumed: ${totalCalories} calories (${percentOfGoal}% of goal)
      
      Macro Breakdown:
      - Protein: ${proteinPercentage}% (${Math.round(
      totalProtein / 4
    )} calories)
      - Fat: ${fatPercentage}% (${Math.round(totalFat / 9)} calories)
      - Carbs: ${carbsPercentage}% (${Math.round(totalCarbs / 4)} calories)
      
      Complete food log:
      ${foodDescriptions}
      
      Please analyze my food choices for this day and provide personalized nutritional advice.
      Include specific foods I should consider adding to my diet based on what I'm already eating.
    `;

    // Make API request
    const data = await makeOpenAIRequest({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 2000,
    });

    // Extract JSON result from the response
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    // Parse the JSON response
    try {
      // Extract JSON from the response (in case there's any non-JSON text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;

      const result = JSON.parse(jsonStr) as DailyNutritionAdvice;

      // Validate the result structure
      if (!result.summary || !result.advice) {
        throw new Error("Invalid response format");
      }

      return result;
    } catch (err) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Failed to parse OpenAI response");
    }
  } catch (error) {
    console.error("Daily nutrition analysis error:", error);
    // Provide fallback advice if API call fails
    return {
      summary: "Unable to analyze nutrition data",
      advice:
        "We're experiencing technical difficulties. Please try again later.",
    };
  }
}
