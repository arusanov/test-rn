import { useState, useEffect, useCallback } from "react";
import { useCameraPermissions } from "expo-camera";

type AnalyzerFunction = (imageUri: string) => Promise<void>;

export const useCamera = (analyzeImageCallback?: AnalyzerFunction) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState<string | null>(null);

  // This function is called by CameraView's onCameraSelect prop
  const takePicture = useCallback((): void => {
    // The actual photo capture is handled in the CameraView component
    // After CameraView captures a photo and sets the image URI,
    // this function is called to trigger the analysis
    if (image && analyzeImageCallback) {
      void analyzeImageCallback(image);
    }
  }, [image, analyzeImageCallback]);

  // Function to directly analyze an image without setting state first
  // Can be passed to the CameraView component if needed
  const analyzeImage = useCallback(
    (imageUri: string): void => {
      if (analyzeImageCallback) {
        void analyzeImageCallback(imageUri);
      }
    },
    [analyzeImageCallback]
  );

  const resetImage = useCallback((): void => {
    setImage(null);
  }, []);

  return {
    hasPermission: permission?.granted,
    requestPermission,
    image,
    setImage,
    takePicture,
    analyzeImage,
    resetImage,
  };
};
