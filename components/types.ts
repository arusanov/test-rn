export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  timestamp: number;
  imageUri?: string;
  nutrition?: {
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface FoodItem {
  name: string;
  calories: number;
}

export interface GroupedEntries {
  title: string;
  data: FoodEntry[];
  nutritionAdvice?: {
    summary: string;
    advice: string;
  } | null;
}
