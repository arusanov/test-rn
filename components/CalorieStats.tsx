import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, AppState, AppStateStatus, Animated } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { View } from "@/components/Themed";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CalorieStatsProps {
  todaysCalories: number;
}

interface Settings {
  dailyCalorieGoal: number;
  notificationsEnabled: boolean;
}

const CalorieStats = ({
  todaysCalories,
}: CalorieStatsProps): React.ReactElement => {
  const [calorieGoal, setCalorieGoal] = useState<number>(2000);
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  const loadCalorieGoal = async () => {
    try {
      const settingsJSON = await AsyncStorage.getItem("settings");
      if (settingsJSON) {
        const settings: Settings = JSON.parse(settingsJSON);
        setCalorieGoal(settings.dailyCalorieGoal);
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error loading calorie goal:", error);
      }
    }
  };

  useEffect(() => {
    // Load initial settings
    loadCalorieGoal();

    // Setup AppState listener to reload settings when app comes to foreground
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          loadCalorieGoal();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Calculate progress (capped at 100%)
  const progress = Math.min(todaysCalories / calorieGoal, 1);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  // Determine color based on percentage
  const getProgressColor = () => {
    if (progress < 0.5) {
      return theme.dark ? "#4CAF50" : "#4CAF50"; // Green
    } else if (progress < 0.75) {
      return theme.dark ? "#FFC107" : "#FFC107"; // Amber/Yellow
    } else {
      return theme.dark ? "#F44336" : "#F44336"; // Red
    }
  };

  const progressBarWidth = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.container, { backgroundColor: "transparent" }]}>
      <Text variant="titleMedium" style={styles.calories}>
        {todaysCalories} / {calorieGoal} cal
      </Text>

      <View
        style={[styles.progressContainer, { backgroundColor: "transparent" }]}
      >
        <View
          style={[
            styles.progressBackground,
            {
              backgroundColor: theme.dark
                ? theme.colors.surfaceVariant
                : "#E0E0E0",
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressBarWidth,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    width: 180,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  calories: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 14,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    height: 8,
    marginTop: 2,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
});

export default CalorieStats;
