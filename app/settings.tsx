import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  Text,
  Button,
  Divider,
  List,
  Switch as PaperSwitch,
  useTheme,
  Portal,
  Dialog,
  TextInput,
  Surface,
  Card,
  Appbar,
} from "react-native-paper";
import { View } from "@/components/Themed";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface Settings {
  dailyCalorieGoal: number;
  notificationsEnabled: boolean;
}

export default function SettingsScreen(): React.ReactElement {
  const [settings, setSettings] = useState<Settings>({
    dailyCalorieGoal: 2000,
    notificationsEnabled: true,
  });
  const [calorieDialogVisible, setCalorieDialogVisible] = useState(false);
  const [tempCalorieGoal, setTempCalorieGoal] = useState("");
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const theme = useTheme();
  const { showSnackbar } = useSnackbar();

  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      const settingsJSON = await AsyncStorage.getItem("settings");
      if (settingsJSON) {
        setSettings(JSON.parse(settingsJSON));
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error loading settings:", error);
      }
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveSettings = async (newSettings: Settings): Promise<void> => {
    try {
      await AsyncStorage.setItem("settings", JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      if (__DEV__) {
        console.error("Error saving settings:", error);
      }
    }
  };

  const toggleNotifications = (): void => {
    void saveSettings({
      ...settings,
      notificationsEnabled: !settings.notificationsEnabled,
    });
  };

  const showCalorieDialog = (): void => {
    setTempCalorieGoal(settings.dailyCalorieGoal.toString());
    setCalorieDialogVisible(true);
  };

  const hideCalorieDialog = (): void => {
    setCalorieDialogVisible(false);
  };

  const saveCalorieGoal = (): void => {
    const calories = parseInt(tempCalorieGoal || "0", 10);
    if (calories > 0) {
      void saveSettings({
        ...settings,
        dailyCalorieGoal: calories,
      });
    }
    hideCalorieDialog();
  };

  const clearAllData = (): void => {
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    try {
      // Clear all AsyncStorage data
      const keys = ["foodEntries", "settings", "hasCompletedOnboarding"];
      await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));

      setTimeout(() => {
        router.replace("/" as never);
      }, 100);

      showSnackbar("All app data has been cleared");
      setDeleteDialogVisible(false);
    } catch (error) {
      if (__DEV__) {
        console.error("Error clearing data:", error);
      }
      showSnackbar("Failed to clear data");
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <List.Section>
        <List.Subheader>Preferences</List.Subheader>

        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Daily Calorie Goal"
              description={`${settings.dailyCalorieGoal} calories`}
              onPress={showCalorieDialog}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Enable Notifications"
              right={() => (
                <PaperSwitch
                  value={settings.notificationsEnabled}
                  onValueChange={toggleNotifications}
                />
              )}
            />
          </Card.Content>
        </Card>
      </List.Section>

      <List.Section>
        <List.Subheader>Data</List.Subheader>

        <View
          style={[{ backgroundColor: "transparent" }, styles.buttonContainer]}
        >
          <Button
            mode="contained"
            onPress={clearAllData}
            style={styles.dangerButton}
            buttonColor={theme.colors.error}
          >
            Clear All Data
          </Button>
        </View>
      </List.Section>

      <Portal>
        <Dialog visible={calorieDialogVisible} onDismiss={hideCalorieDialog}>
          <Dialog.Title>Set Daily Calorie Goal</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Calories"
              value={tempCalorieGoal}
              onChangeText={(text) => setTempCalorieGoal(text)}
              keyboardType="numeric"
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideCalorieDialog}>Cancel</Button>
            <Button onPress={saveCalorieGoal}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Clear All Data</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete all app data? This will clear your
              food entries, settings, and onboarding status, resetting the app
              completely. This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={handleConfirmDelete}
              textColor={theme.colors.error}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    width: "auto",
  },
  divider: {
    marginVertical: 8,
  },
  buttonContainer: {
    marginHorizontal: 16,
    width: "auto",
  },
  dangerButton: {
    marginTop: 8,
  },
});
