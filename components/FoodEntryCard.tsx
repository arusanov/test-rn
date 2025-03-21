import React from "react";
import {
  StyleSheet,
  ImageBackground,
  View as RNView,
  ViewStyle,
} from "react-native";
import { Card, Text, Chip, Button, useTheme } from "react-native-paper";
import { View } from "@/components/Themed";
import { FoodEntry } from "./types";
import { formatTimeString } from "@/utils/dateUtils";

// Default nutrition values if not provided
const DEFAULT_NUTRITION = { protein: 20, fat: 30, carbs: 50 };

interface FoodEntryCardProps {
  entry: FoodEntry;
  onDelete: (id: string) => void;
  style?: ViewStyle;
  isFirstCard?: boolean;
}

const FoodEntryCard = ({
  entry,
  onDelete,
  style,
  isFirstCard = false,
}: FoodEntryCardProps): React.ReactElement => {
  const theme = useTheme();

  const renderMacroBar = (nutrition = DEFAULT_NUTRITION) => {
    const totalPercentage = nutrition.protein + nutrition.fat + nutrition.carbs;
    const proteinWidth = (nutrition.protein / totalPercentage) * 100;
    const fatWidth = (nutrition.fat / totalPercentage) * 100;
    const carbsWidth = (nutrition.carbs / totalPercentage) * 100;

    return (
      <RNView style={styles.macroBarContainer}>
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

  return (
    <View style={{ backgroundColor: "transparent" }}>
      <Card key={entry.id} style={[styles.entryCard, style]} mode="elevated">
        <Card.Title
          title={entry.name}
          subtitle={formatTimeString(entry.timestamp)}
          titleVariant="titleMedium"
          right={() => (
            <Chip mode="outlined" style={styles.calorieChip}>
              {entry.calories} cal
            </Chip>
          )}
        />
        {renderMacroBar(entry.nutrition)}
        {entry.imageUri && (
          <RNView style={styles.imageContainer}>
            <ImageBackground
              source={{ uri: entry.imageUri }}
              style={styles.entryImage}
              imageStyle={styles.imageStyle}
            >
              {/* Caption */}
              <RNView style={styles.captionContainer}>
                <Text variant="bodySmall" style={styles.captionText}>
                  {entry.calories} calories
                </Text>
              </RNView>
            </ImageBackground>
          </RNView>
        )}
        <Card.Actions>
          <Button
            mode="text"
            icon="delete"
            textColor={theme.colors.error}
            onPress={() => onDelete(entry.id)}
          >
            Delete
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  entryCard: {
    marginBottom: 12,
    width: "100%",
  },
  imageContainer: {
    height: 180,
    width: "100%",
    overflow: "hidden",
  },
  entryImage: {
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
  },
  imageStyle: {
    resizeMode: "cover",
  },
  captionContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    zIndex: 10,
  },
  captionText: {
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  calorieChip: {
    marginRight: 16,
  },
  macroBarContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  macroLegend: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 2,
  },
  segmentedBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
  },
  segment: {
    height: "100%",
  },
});

export default FoodEntryCard;
