import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { View } from "@/components/Themed";
import {
  CameraView as ExpoCameraView,
  useCameraPermissions,
} from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

// Type for the CameraView ref
type CameraViewRef = React.ElementRef<typeof ExpoCameraView>;

interface CustomCameraViewProps {
  image: string | null;
  onCameraSelect: () => void;
  setImage: (uri: string) => void;
  analyzeImage?: (uri: string) => void;
}

const CameraView = ({
  image,
  onCameraSelect,
  setImage,
  analyzeImage,
}: CustomCameraViewProps): React.ReactElement => {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraViewRef>(null);
  const [showHint, setShowHint] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [pictureSize, setPictureSize] = useState<string | null>(null);

  // Request camera permissions on component mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Get available picture sizes on component mount
  useEffect(() => {
    const getAvailablePictureSizes = async () => {
      if (cameraRef.current && permission?.granted) {
        try {
          const sizes = await cameraRef.current.getAvailablePictureSizesAsync();
          if (sizes.length > 0) {
            // Get the lowest resolution
            // Assuming sizes are formatted like "800x600"
            const sortedSizes = [...sizes].sort((a, b) => {
              const [aWidth] = a.split("x").map(Number);
              const [bWidth] = b.split("x").map(Number);
              return aWidth - bWidth;
            });

            setPictureSize(sortedSizes[0]);
            console.log("Selected picture size:", sortedSizes[0]);
          }
        } catch (error) {
          console.log("Error getting picture sizes:", error);
        }
      }
    };

    if (permission?.granted) {
      getAvailablePictureSizes();
    }
  }, [permission?.granted]);

  // Handle hint fade out animation
  useEffect(() => {
    if (!image) {
      // Reset opacity when camera is shown
      fadeAnim.setValue(1);
      setShowHint(true);

      // Start fade out animation after 3 seconds
      const fadeOutTimer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => setShowHint(false));
      }, 3000);

      return () => clearTimeout(fadeOutTimer);
    }
  }, [image, fadeAnim]);

  // Resize image to 400px width maintaining aspect ratio
  const resizeImage = async (uri: string): Promise<string> => {
    try {
      const manipResult = await manipulateAsync(uri, [{ resize: { width: 400 } }], {
        compress: 0.8,
        format: SaveFormat.JPEG,
      });
      return manipResult.uri;
    } catch (error) {
      console.log("Error resizing image:", error);
      return uri; // Return original if resize fails
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          ...(pictureSize ? { pictureSize } : {}),
        });

        // Set the image URI to the captured photo URI
        if (photo && photo.uri) {
          // Resize the image to 400px width
          const resizedUri = await resizeImage(photo.uri);
          setImage(resizedUri);

          // If direct analyzeImage function is available, use it
          if (analyzeImage) {
            analyzeImage(resizedUri);
          } else {
            // Wait for state update to complete before triggering analysis
            setTimeout(() => {
              onCameraSelect();
            }, 100);
          }
        }
      } catch (error) {
        console.log("Error taking picture:", error);
      }
    }
  };

  // If permissions are still loading
  if (!permission) {
    return (
      <View
        style={[styles.cameraContainer, { backgroundColor: "transparent" }]}
      >
        <View style={styles.placeholderContainer}>
          <ActivityIndicator
            style={styles.loader}
            color={theme.colors.primary}
          />
          <Text variant="bodyMedium" style={styles.placeholderText}>
            Loading camera...
          </Text>
        </View>
      </View>
    );
  }

  // If no permission granted, show permission request message
  if (permission && !permission.granted) {
    return (
      <View
        style={[styles.cameraContainer, { backgroundColor: "transparent" }]}
      >
        <View style={styles.placeholderContainer}>
          <Text variant="bodyMedium" style={styles.placeholderText}>
            We need your permission to use the camera
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.cameraContainer, { backgroundColor: "transparent" }]}>
      {image ? (
        <View style={styles.imageArea}>
          <View
            style={[styles.imageContainer, { backgroundColor: "transparent" }]}
          >
            <Image source={{ uri: image }} style={styles.previewImage} />
          </View>
        </View>
      ) : (
        <View style={styles.cameraWrapper}>
          <TouchableOpacity
            style={styles.cameraArea}
            onPress={takePicture}
            activeOpacity={0.9}
          >
            <ExpoCameraView
              ref={cameraRef}
              style={styles.camera}
              facing={"back"}
              {...(pictureSize ? { pictureSize } : { ratio: "4:3" })}
            />

            {showHint && (
              <Animated.View
                style={[styles.hintContainer, { opacity: fadeAnim }]}
              >
                <Text style={styles.hintText}>
                  Click anywhere to take a food photo
                </Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    width: "100%",
  },
  imageArea: {
    height: 300,
    width: "100%",
  },
  imageContainer: {
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  placeholderContainer: {
    alignItems: "center",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
    height: 300,
    justifyContent: "center",
    padding: 20,
  },
  placeholderText: {
    marginTop: 16,
    textAlign: "center",
  },
  previewImage: {
    height: 300,
    width: "100%",
  },
  cameraWrapper: {
    height: 300,
    width: "100%",
    position: "relative",
  },
  cameraArea: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  hintContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  hintText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loader: {
    marginTop: 10,
  },
  permissionButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#2196F3",
    borderRadius: 4,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "500",
  },
});

export default CameraView;
