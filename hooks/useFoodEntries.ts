import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FoodEntry, GroupedEntries } from "@/components/types";
import {
  getStartOfToday,
  formatDateString,
  getSevenDaysAgo,
  getDateFromString,
} from "@/utils/dateUtils";
import { analyzeDailyNutrition, DailyNutritionAdvice } from "@/utils/openaiApi";

// Interface for nutrition advice by date
interface NutritionAdviceMap {
  [dateString: string]: DailyNutritionAdvice;
}

export const useFoodEntries = (refreshTrigger?: number) => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries[]>([]);
  const [todaysCalories, setTodaysCalories] = useState<number>(0);
  const [nutritionAdvice, setNutritionAdvice] = useState<NutritionAdviceMap>(
    {}
  );
  const [isAnalyzingNutrition, setIsAnalyzingNutrition] =
    useState<boolean>(false);

  const groupEntriesByDay = (entries: FoodEntry[]): GroupedEntries[] => {
    const groups: Record<string, FoodEntry[]> = {};

    entries.forEach((entry) => {
      const dateString = formatDateString(entry.timestamp);

      if (!groups[dateString]) {
        groups[dateString] = [];
      }

      groups[dateString].push(entry);
    });

    return Object.keys(groups).map((key) => ({
      title: key,
      data: groups[key],
      nutritionAdvice: nutritionAdvice[key] || null,
    }));
  };

  const loadFoodEntries = useCallback(async (): Promise<void> => {
    try {
      const entriesJSON = await AsyncStorage.getItem("foodEntries");
      const adviceJSON = await AsyncStorage.getItem("nutritionAdvice");

      if (adviceJSON) {
        const advice = JSON.parse(adviceJSON) as NutritionAdviceMap;
        setNutritionAdvice(advice);
      }

      if (entriesJSON) {
        const allEntries: FoodEntry[] = JSON.parse(entriesJSON);
        // Sort by most recent first
        allEntries.sort((a, b) => b.timestamp - a.timestamp);

        // Get timestamp for 7 days ago
        const sevenDaysAgoTimestamp = getSevenDaysAgo();

        // Filter entries to only show the last 7 days
        const recentEntries = allEntries.filter(
          (entry) => entry.timestamp >= sevenDaysAgoTimestamp
        );

        setFoodEntries(allEntries); // Keep all entries in state for other operations

        // Group by day - only for the last 7 days
        const grouped = groupEntriesByDay(recentEntries);
        setGroupedEntries(grouped);

        // Calculate today's calories
        const todayTimestamp = getStartOfToday();

        const todayEntries = allEntries.filter(
          (entry) => entry.timestamp >= todayTimestamp
        );

        const total = todayEntries.reduce(
          (sum, entry) => sum + entry.calories,
          0
        );
        setTodaysCalories(total);
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error loading food entries:", error);
      }
    }
  }, [nutritionAdvice]);

  const addFoodEntry = async (
    food: string,
    calories: number,
    imageUri?: string,
    nutrition?: { protein: number; fat: number; carbs: number }
  ): Promise<void> => {
    if (!food || calories <= 0) return;

    try {
      const newEntry: FoodEntry = {
        id: Date.now().toString(),
        name: food,
        calories,
        timestamp: Date.now(),
        ...(imageUri && { imageUri }),
        nutrition: nutrition || { protein: 20, fat: 30, carbs: 50 }, // Default values if not provided
      };

      const entriesJSON = await AsyncStorage.getItem("foodEntries");
      const entries: FoodEntry[] = entriesJSON ? JSON.parse(entriesJSON) : [];

      entries.push(newEntry);
      await AsyncStorage.setItem("foodEntries", JSON.stringify(entries));

      // Update today's calories
      setTodaysCalories((prev) => prev + calories);

      // Reload entries to update history
      await loadFoodEntries();

      // Analyze today's nutrition after adding a food entry
      const today = formatDateString(Date.now());
      void analyzeNutritionForDate(today);

      return Promise.resolve();
    } catch (error) {
      if (__DEV__) {
        console.error("Error saving food entry:", error);
      }
      return Promise.reject("Failed to save food entry");
    }
  };

  const deleteFoodEntry = async (id: string): Promise<void> => {
    try {
      // Find the entry being deleted to get its date
      const entryToDelete = foodEntries.find((entry) => entry.id === id);
      let dateToReanalyze: string | null = null;

      if (entryToDelete) {
        dateToReanalyze = formatDateString(entryToDelete.timestamp);
      }

      const updatedEntries = foodEntries.filter((entry) => entry.id !== id);
      setFoodEntries(updatedEntries);

      if (entryToDelete) {
        // Check if entry is from today
        const todayTimestamp = getStartOfToday();

        if (entryToDelete.timestamp >= todayTimestamp) {
          setTodaysCalories((prev) => prev - entryToDelete.calories);
        }
      }

      // Update storage and regrouped entries
      await AsyncStorage.setItem("foodEntries", JSON.stringify(updatedEntries));
      const grouped = groupEntriesByDay(updatedEntries);
      setGroupedEntries(grouped);

      // Re-analyze the date's nutrition if we deleted an entry
      if (dateToReanalyze) {
        void analyzeNutritionForDate(dateToReanalyze);
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error deleting food entry:", error);
      }
    }
  };

  /**
   * Analyze nutrition for a specific date
   * @param dateString The formatted date string (e.g., "Monday, Jan 1")
   */
  const analyzeNutritionForDate = async (dateString: string): Promise<void> => {
    try {
      setIsAnalyzingNutrition(true);

      // Load calorie goal from settings
      const settingsJSON = await AsyncStorage.getItem("settings");
      const settings = settingsJSON
        ? JSON.parse(settingsJSON)
        : { dailyCalorieGoal: 2000 };

      // Get entries for the specified date
      const dateEntries = foodEntries.filter(
        (entry) => formatDateString(entry.timestamp) === dateString
      );

      if (dateEntries.length === 0) {
        // Remove advice for this date if no entries exist
        const updatedAdvice = { ...nutritionAdvice };
        delete updatedAdvice[dateString];
        setNutritionAdvice(updatedAdvice);
        await AsyncStorage.setItem(
          "nutritionAdvice",
          JSON.stringify(updatedAdvice)
        );
        return;
      }

      // Get nutrition advice from OpenAI
      const advice = await analyzeDailyNutrition(
        dateString,
        dateEntries,
        settings.dailyCalorieGoal
      );

      // Update state and storage
      const updatedAdvice = {
        ...nutritionAdvice,
        [dateString]: advice,
      };

      setNutritionAdvice(updatedAdvice);
      await AsyncStorage.setItem(
        "nutritionAdvice",
        JSON.stringify(updatedAdvice)
      );

      // Update grouped entries to include the new advice
      const grouped = groupEntriesByDay(foodEntries);
      setGroupedEntries(grouped);
    } catch (error) {
      console.error("Error analyzing nutrition for date:", error);
    } finally {
      setIsAnalyzingNutrition(false);
    }
  };

  useEffect(() => {
    void loadFoodEntries();
  }, [loadFoodEntries, refreshTrigger]);

  return {
    foodEntries,
    groupedEntries,
    todaysCalories,
    nutritionAdvice,
    isAnalyzingNutrition,
    loadFoodEntries,
    addFoodEntry,
    deleteFoodEntry,
    analyzeNutritionForDate,
  };
};
