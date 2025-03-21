import React from "react";
import { StyleSheet, View as RNView } from "react-native";
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  useTheme,
  ProgressBar,
} from "react-native-paper";
import { View } from "@/components/Themed";
import { FoodAnalysisData } from "@/hooks/useFoodAnalysis";

interface FoodAnalysisResultProps {
  isAnalyzing: boolean;
  recognizedFood: string;
  estimatedCalories: number;
  nutritionData: FoodAnalysisData["nutrition"] | null;
  onSaveFood: (food: string, calories: number) => void;
  onDiscard?: () => void;
}

const FoodAnalysisResult = ({
  isAnalyzing,
  recognizedFood,
  estimatedCalories,
  nutritionData,
  onSaveFood,
  onDiscard,
}: FoodAnalysisResultProps): React.ReactElement | null => {
  const theme = useTheme();

  const renderMacroBar = (nutritionData: FoodAnalysisData["nutrition"]) => {
    const totalPercentage =
      nutritionData.protein + nutritionData.fat + nutritionData.carbs;
    const proteinWidth = (nutritionData.protein / totalPercentage) * 100;
    const fatWidth = (nutritionData.fat / totalPercentage) * 100;
    const carbsWidth = (nutritionData.carbs / totalPercentage) * 100;

    return (
      <RNView style={styles.macroBarContainer}>
        <RNView style={styles.macroLegend}>
          <RNView style={styles.legendItem}>
            <RNView
              style={[styles.legendColor, { backgroundColor: "#FFFFFF" }]}
            />
            <Text
              style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}
            >
              Protein {nutritionData.protein}%
            </Text>
          </RNView>
          <RNView style={styles.legendItem}>
            <RNView
              style={[styles.legendColor, { backgroundColor: "#FF5252" }]}
            />
            <Text
              style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}
            >
              Carbs {nutritionData.carbs}%
            </Text>
          </RNView>
          <RNView style={styles.legendItem}>
            <RNView
              style={[styles.legendColor, { backgroundColor: "#FFA726" }]}
            />
            <Text
              style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}
            >
              Fat {nutritionData.fat}%
            </Text>
          </RNView>
        </RNView>
        <RNView style={styles.segmentedBar}>
          <RNView
            style={[
              styles.segment,
              { width: `${proteinWidth}%`, backgroundColor: "#FFFFFF" },
            ]}
          />
          <RNView
            style={[
              styles.segment,
              { width: `${carbsWidth}%`, backgroundColor: "#FF5252" },
            ]}
          />
          <RNView
            style={[
              styles.segment,
              { width: `${fatWidth}%`, backgroundColor: "#FFA726" },
            ]}
          />
        </RNView>
      </RNView>
    );
  };

  if (isAnalyzing) {
    return (
      <Card
        style={[
          styles.analyzeContainer,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
      >
        <Card.Content style={styles.analyzeContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="bodyMedium"
            style={{ marginTop: 12, color: theme.colors.onSurface }}
          >
            Analyzing your food...
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (!recognizedFood) {
    return null;
  }

  return (
    <Card
      style={[
        styles.resultContainer,
        {
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <Card.Content style={styles.cardContent}>
        <Text
          variant="headlineSmall"
          style={[styles.foodTitle, { color: theme.colors.onSurface }]}
        >
          {recognizedFood}
        </Text>
        <Text
          variant="titleMedium"
          style={[
            styles.caloriesText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {estimatedCalories} calories
        </Text>

        {nutritionData && (
          <RNView style={styles.nutritionContainer}>
            <Text
              variant="bodyMedium"
              style={[styles.nutritionTitle, { color: theme.colors.onSurface }]}
            >
              Nutritional Breakdown
            </Text>

            {renderMacroBar(nutritionData)}
          </RNView>
        )}
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="outlined"
          onPress={onDiscard}
          icon="close"
          style={[styles.discardButton, { borderColor: theme.colors.error }]}
          labelStyle={styles.buttonLabel}
          textColor={theme.colors.error}
        >
          Discard
        </Button>
        <Button
          mode="contained"
          onPress={() => onSaveFood(recognizedFood, estimatedCalories)}
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          labelStyle={styles.buttonLabel}
        >
          Add to Food Log
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  analyzeContainer: {
    width: "100%",
    borderRadius: 12,
    elevation: 8,
  },
  analyzeContent: {
    alignItems: "center",
    padding: 24,
  },
  resultContainer: {
    borderRadius: 16,
    elevation: 8,
    marginBottom: 8,
    borderWidth: 1,
    width: "100%",
  },
  cardContent: {
    paddingVertical: 12,
  },
  foodTitle: {
    fontWeight: "bold",
  },
  caloriesText: {
    marginTop: 4,
  },
  nutritionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  nutritionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  cardActions: {
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  discardButton: {
    borderRadius: 8,
  },
  saveButton: {
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  macroBarContainer: {
    marginBottom: 8,
  },
  macroLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },
  segmentedBar: {
    height: 12,
    borderRadius: 6,
    flexDirection: "row",
    overflow: "hidden",
  },
  segment: {
    height: "100%",
  },
});

export default FoodAnalysisResult;
