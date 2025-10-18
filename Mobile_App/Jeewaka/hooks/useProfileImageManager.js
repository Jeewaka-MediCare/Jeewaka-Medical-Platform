import { useState } from "react";
import { Alert } from "react-native";
import api from "../services/api";

export const useProfileImageManager = (
  user,
  userRole,
  userProfile,
  setUserProfile,
  updateUser
) => {
  const [profileImageModalVisible, setProfileImageModalVisible] =
    useState(false);
  const [uploading, setUploading] = useState(false);

  const showImageOptions = () => {
    setProfileImageModalVisible(true);
  };

  const handleImageSelected = async (imageResult) => {
    console.log("handleImageSelected called with:", imageResult);

    if (!imageResult || imageResult === null) {
      // Handle image removal
      console.log("Removing image...");
      await removeImage();
      return;
    }

    // Handle image upload
    console.log("Uploading image...");
    await uploadImage(imageResult);
  };

  const uploadImage = async (imageAsset) => {
    setUploading(true);
    try {
      console.log("Image asset received:", imageAsset);

      // Handle both URL and base64 image formats
      let imageData;
      if (imageAsset.uri && imageAsset.uri.startsWith("data:image/")) {
        // If it's already a data URL
        imageData = imageAsset.uri;
      } else if (imageAsset.base64) {
        // If we have base64 data, create data URL
        imageData = `data:image/jpeg;base64,${imageAsset.base64}`;
      } else if (imageAsset.uri) {
        // If it's just a URI (for URL input)
        imageData = imageAsset.uri;
      } else {
        throw new Error("Invalid image format");
      }

      // Validate image size (optional but recommended)
      if (imageData.startsWith("data:image/")) {
        const sizeInBytes = imageData.length * (3 / 4);
        const sizeInMB = sizeInBytes / (1024 * 1024);
        console.log("Image size:", sizeInMB.toFixed(2), "MB");

        if (sizeInMB > 5) {
          Alert.alert(
            "Image Too Large",
            `Image size is ${sizeInMB.toFixed(
              2
            )}MB. Please use an image smaller than 5MB.`
          );
          return;
        }
      }

      console.log(
        "Uploading image data (first 50 chars):",
        imageData.substring(0, 50)
      );

      const updateData = { profile: imageData };
      const endpoint =
        userRole === "doctor"
          ? `/api/doctor/${user._id}`
          : `/api/patient/${user._id}`;

      console.log("API Request:", "PUT", endpoint);
      const response = await api.put(endpoint, updateData);

      console.log("API Response:", response.data);

      // Check for successful response - be more flexible with response structure
      if (response.data && response.data.success !== false) {
        Alert.alert("Success", "Profile image updated successfully!");

        // Update local state
        const updatedProfile = { ...userProfile, profile: imageData };
        setUserProfile(updatedProfile);

        // Update the global auth store so other components see the new profile picture
        await updateUser(updatedProfile);

        // Verification: Fetch fresh user data to verify database storage
        setTimeout(async () => {
          try {
            const endpoint =
              userRole === "doctor"
                ? `/api/doctor/${user._id}`
                : `/api/patient/${user._id}`;

            const verifyResponse = await api.get(endpoint);
            console.log(
              "🔍 Database Verification - Fresh user data:",
              verifyResponse.data
            );
            console.log(
              "🔍 Database Verification - Profile field present:",
              !!verifyResponse.data?.profile
            );
            console.log(
              "🔍 Database Verification - Profile matches uploaded:",
              verifyResponse.data?.profile === imageData
            );
          } catch (verifyError) {
            console.error("🔍 Database Verification Failed:", verifyError);
          }
        }, 1000); // Verify after 1 second

        // Close modal
        setProfileImageModalVisible(false);
      } else {
        throw new Error(
          response.data?.message || "Failed to update profile image"
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Error details:", error.response?.data || error.message);

      let errorMessage = "Failed to update profile image. Please try again.";
      if (error.response?.status === 413) {
        errorMessage = "Image is too large. Please use a smaller image.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid image format. Please try a different image.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    setUploading(true);
    try {
      console.log("Removing profile image for user:", user._id);

      // Send null or empty string to remove the image
      const updateData = { profile: null };
      const endpoint =
        userRole === "doctor"
          ? `/api/doctor/${user._id}`
          : `/api/patient/${user._id}`;

      console.log("API Request:", "PUT", endpoint, updateData);
      const response = await api.put(endpoint, updateData);

      console.log("Remove API Response:", response.data);

      // Check for successful response
      if (response.data && response.data.success !== false) {
        Alert.alert("Success", "Profile image removed successfully!");

        // Update local state - remove the profile image
        const updatedProfile = { ...userProfile, profile: null };
        setUserProfile(updatedProfile);

        // Update the global auth store so other components see the profile picture removal
        await updateUser(updatedProfile);

        // Close modal
        setProfileImageModalVisible(false);
      } else {
        throw new Error(
          response.data?.message || "Failed to remove profile image"
        );
      }
    } catch (error) {
      console.error("Remove error:", error);
      console.error(
        "Remove error details:",
        error.response?.data || error.message
      );

      let errorMessage = "Failed to remove profile image. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "User not found. Please try logging in again.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid request. Please try again.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return {
    profileImageModalVisible,
    uploading,
    showImageOptions,
    handleImageSelected,
    setProfileImageModalVisible,
  };
};
