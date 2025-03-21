import React, { useState, useCallback } from "react";
import { StyleSheet, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Text,
  Button,
  Card,
  useTheme,
  Surface,
  PaperProvider,
} from "react-native-paper";
import { View } from "@/components/Themed";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function WelcomeScreen(): React.ReactElement {
  const [currentStep, setCurrentStep] = useState(0);
  const theme = useTheme();
  const router = useRouter();

  const onboardingSteps = [
    {
      title: "Take Photos of Your Food",
      description:
        "Quickly identify foods and their calories by taking a photo or selecting from your gallery.",
      image: require("@/assets/images/splash-icon.png"),
    },
    {
      title: "Track Your Progress",
      description:
        "Monitor your daily calorie intake with our visual progress bar and detailed history.",
      image: require("@/assets/images/splash-icon.png"),
    },
  ];

  const handleNext = useCallback(() => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, onboardingSteps.length]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      router.replace("/" as never);
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      router.replace("/" as never);
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Surface style={styles.contentContainer} elevation={0}>
        <View
          style={[styles.imageContainer, { backgroundColor: "transparent" }]}
        >
          <Image
            source={currentStepData.image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              {currentStepData.title}
            </Text>
            <Text variant="bodyLarge" style={styles.description}>
              {currentStepData.description}
            </Text>
          </Card.Content>
        </Card>

        <View
          style={[styles.stepsContainer, { backgroundColor: "transparent" }]}
        >
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepIndicator,
                {
                  backgroundColor:
                    currentStep === index
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                },
              ]}
            />
          ))}
        </View>

        <View
          style={[styles.buttonsContainer, { backgroundColor: "transparent" }]}
        >
          {currentStep < onboardingSteps.length - 1 ? (
            <>
              <Button mode="text" onPress={handleSkip}>
                Skip
              </Button>
              <Button mode="contained" onPress={handleNext}>
                Next
              </Button>
            </>
          ) : (
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.getStartedButton}
            >
              Get Started
            </Button>
          )}
        </View>
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  imageContainer: {
    marginBottom: 40,
    alignItems: "center",
    width: "100%",
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
  },
  card: {
    width: "100%",
    marginBottom: 30,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
  },
  stepsContainer: {
    flexDirection: "row",
    marginBottom: 40,
  },
  stepIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  getStartedButton: {
    width: "100%",
  },
});
