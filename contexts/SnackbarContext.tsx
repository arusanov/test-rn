import React, { createContext, useState, useContext, ReactNode } from "react";
import { Snackbar, Text, useTheme } from "react-native-paper";

interface SnackbarContextProps {
  showSnackbar: (message: string, action?: SnackbarAction) => void;
  hideSnackbar: () => void;
}

interface SnackbarAction {
  label: string;
  onPress: () => void;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

interface SnackbarState {
  visible: boolean;
  message: string;
  action?: SnackbarAction;
}

const SnackbarContext = createContext<SnackbarContextProps | undefined>(
  undefined
);

export const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    visible: false,
    message: "",
  });

  const theme = useTheme();

  const showSnackbar = (message: string, action?: SnackbarAction) => {
    setSnackbarState({
      visible: true,
      message,
      action,
    });
  };

  const hideSnackbar = () => {
    setSnackbarState((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const onDismiss = () => {
    hideSnackbar();
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}
      <Snackbar
        visible={snackbarState.visible}
        onDismiss={onDismiss}
        action={
          snackbarState.action
            ? {
                label: snackbarState.action.label,
                onPress: () => {
                  snackbarState.action?.onPress();
                  hideSnackbar();
                },
              }
            : undefined
        }
        duration={3000}
        style={{
          backgroundColor: theme.colors.elevation.level3,
        }}
      >
        <Text style={{ color: theme.colors.onSurface }}>
          {snackbarState.message}
        </Text>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextProps => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};
