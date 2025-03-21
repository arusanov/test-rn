import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  useTheme,
  List,
  Divider,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { View } from "@/components/Themed";
import FoodEntryCard from "./FoodEntryCard";
import { FoodEntry, GroupedEntries } from "./types";

interface HistorySectionProps {
  groupedEntries: GroupedEntries[];
  onDeleteEntry: (id: string) => void;
  isAnalyzingNutrition?: boolean;
  onAnalyzeDate?: (dateString: string) => void;
}

const HistorySection = ({
  groupedEntries,
  onDeleteEntry,
  isAnalyzingNutrition = false,
  onAnalyzeDate,
}: HistorySectionProps): React.ReactElement => {
  const theme = useTheme();

  if (groupedEntries.length === 0) {
    return (
      <View
        style={[
          styles.emptyHistoryContainer,
          { backgroundColor: "transparent" },
        ]}
      >
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          No food entries yet. Take a photo to get started.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContentContainer}
    >
      {groupedEntries.map((group, index) => (
        <View
          key={index}
          style={[styles.daySection, { backgroundColor: "transparent" }]}
        >
          <Card style={styles.dateTitleCard} mode="elevated">
            <Card.Content style={styles.dateTitleContent}>
              <Text variant="titleMedium" style={styles.dateTitle}>
                {group.title}
              </Text>
            </Card.Content>

            {/* Show nutrition advice if available */}
            {group.nutritionAdvice && (
              <Card.Content style={styles.adviceContainer}>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.summaryText,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {group.nutritionAdvice.summary}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.adviceText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {group.nutritionAdvice.advice}
                </Text>
              </Card.Content>
            )}

            {/* Show analysis button if no advice and callback provided */}
            {!group.nutritionAdvice && onAnalyzeDate && (
              <Card.Actions style={styles.analyzeButtonContainer}>
                {isAnalyzingNutrition ? (
                  <View style={styles.analyzeLoading}>
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.analyzingText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Analyzing...
                    </Text>
                  </View>
                ) : (
                  <Button
                    mode="text"
                    icon="chart-line"
                    onPress={() => onAnalyzeDate(group.title)}
                    compact
                  >
                    Analyze Nutrition
                  </Button>
                )}
              </Card.Actions>
            )}
          </Card>

          {group.data.map((entry, entryIndex) => (
            <FoodEntryCard
              key={entry.id}
              entry={entry}
              onDelete={onDeleteEntry}
              style={
                entryIndex === 0 ? styles.firstEntryCard : styles.entryCard
              }
              isFirstCard={entryIndex === 0}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  daySection: {
    marginBottom: 20,
    width: "100%",
  },
  dateTitleCard: {
    marginBottom: 0,
    width: "100%",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    elevation: 2,
    zIndex: 1,
  },
  dateTitleContent: {
    padding: 8,
    paddingHorizontal: 16,
  },
  adviceContainer: {
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  summaryText: {
    fontWeight: "500",
    marginBottom: 4,
  },
  adviceText: {
    fontStyle: "italic",
  },
  analyzeButtonContainer: {
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 8,
  },
  analyzeLoading: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingText: {
    marginLeft: 8,
  },
  dateTitle: {
    fontWeight: "bold",
  },
  firstEntryCard: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginBottom: 12,
  },
  entryCard: {
    marginBottom: 12,
  },
  emptyHistoryContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    width: "100%",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    width: "100%",
  },
  scrollBottomPadding: {
    height: 80, // Extra padding at the bottom for better scrolling experience
  },
});

export default HistorySection;
