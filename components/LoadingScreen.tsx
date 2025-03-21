import React from "react";
import { StyleSheet, ActivityIndicator } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { View } from "@/components/Themed";

const LoadingScreen = (): React.ReactElement => {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.spinner}
      />
      <Text variant="bodyLarge">Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    marginBottom: 16,
  },
});

export default LoadingScreen;
