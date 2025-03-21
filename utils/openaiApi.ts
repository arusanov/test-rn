import * as FileSystem from "expo-file-system";
import { OPENAI_API_KEY } from "../constants/Config";
import { FoodEntry } from "@/components/types";

/**
 * Food analysis result schema
 */
export interface FoodAnalysisResult {
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

/**
 * Analyzes a food image using OpenAI's Vision API
 * @param imageUri Local URI of the image to analyze
 * @returns Food analysis result with description, calories and nutrition
 */
export async function analyzeFoodImage(
  imageUri: string
): Promise<FoodAnalysisResult> {
  try {
    // Convert image to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Prepare the system prompt for accurate food detection
    const systemPrompt = `
      You are a food recognition AI with nutrition expertise.
      Analyze the provided food image and:
      1. Identify the food item(s) present
      2. Estimate the calories (be specific with a number)
      3. Provide approximate nutritional breakdown as percentages (protein, fat, carbs)
      
      Respond ONLY with valid JSON matching this schema:
      {
        "description": "Detailed food description",
        "calories": number,
        "nutrition": {
          "protein": number,
          "fat": number,
          "carbs": number
        }
      }

      Ensure percentages add up to 100. If you're uncertain, provide best estimates.
    `;

    // Prepare API request
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${data.error?.message || "Unknown error"}`
      );
    }

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

      // Validate the result structure
      if (
        !result.description ||
        typeof result.calories !== "number" ||
        !result.nutrition ||
        typeof result.nutrition.protein !== "number" ||
        typeof result.nutrition.fat !== "number" ||
        typeof result.nutrition.carbs !== "number"
      ) {
        throw new Error("Invalid response format");
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

    // Make OpenAI API call
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${data.error?.message || "Unknown error"}`
      );
    }

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
    throw error;
  }
}
