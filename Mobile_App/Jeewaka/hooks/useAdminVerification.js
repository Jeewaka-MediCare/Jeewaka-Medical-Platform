import { useState, useEffect } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export default function useAdminVerification(user, params, router, logout) {
  // Get doctor data from params or user store
  const [doctorData, setDoctorData] = useState({
    doctorId: params.doctorId || user?._id,
    _id: params._id || user?._id,
    name: params.name || user?.name,
    email: params.email || user?.email,
    certificates: [],
    isVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    __v: 0,
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [hasSavedCertificates, setHasSavedCertificates] = useState(false);

  // Sync uploadedFiles with doctorData.certificates
  useEffect(() => {
    if (doctorData.certificates && doctorData.certificates.length > 0) {
      const validCertificates = doctorData.certificates.filter(
        (cert) => cert && cert.trim() !== ""
      );

      if (validCertificates.length > 0) {
        const mappedFiles = validCertificates.map((url, idx) => {
          let filename = url.split("/").pop() || "";
          if (filename.includes("?")) filename = filename.split("?")[0];
          return {
            id: `${idx}-${filename}`,
            name: filename || `Certificate-${idx + 1}`,
            url,
            uploadedAt: doctorData.updatedAt || new Date().toISOString(),
            raw: { url },
          };
        });

        setUploadedFiles(mappedFiles);
      } else {
        setUploadedFiles([]);
      }
    } else {
      setUploadedFiles([]);
    }
  }, [doctorData.certificates, doctorData.updatedAt]);

  // Load existing verification data on mount
  useEffect(() => {
    loadVerificationData();
  }, []);

  const loadVerificationData = async () => {
    try {
      const doctorId = params.doctorId || user?._id;

      if (!doctorId) {
        Alert.alert("Error", "Doctor ID is missing. Please contact support.");
        return;
      }

      // First, try to load verification data from AsyncStorage
      try {
        const storedVerificationData = await AsyncStorage.getItem(
          "verificationData"
        );

        if (storedVerificationData) {
          const verificationData = JSON.parse(storedVerificationData);
          const actualData = Array.isArray(verificationData)
            ? verificationData[0]
            : verificationData;

          if (!actualData.certificates) actualData.certificates = [];

          setDoctorData((prev) => ({
            ...prev,
            ...actualData,
          }));

          setHasSavedCertificates(true);
          await AsyncStorage.removeItem("verificationData");
          return;
        }
      } catch (storageError) {
        // No stored data, fallback to API
      }

      // If no data in storage, fallback to API call
      try {
        const response = await api.get(`/api/admin-verification/${doctorId}`);

        if (response.data) {
          const actualData = Array.isArray(response.data)
            ? response.data[0]
            : response.data;

          if (!actualData.certificates) actualData.certificates = [];

          setDoctorData((prev) => ({
            ...prev,
            ...actualData,
          }));

          setHasSavedCertificates(true);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error loading verification data:", error);
        }
      }
    } catch (error) {
      console.error("Error in loadVerificationData:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      });

      if (result.canceled) return;

      const files = result.assets || [result];
      if (files.length === 0) return;

      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];

      const invalid = files.find((f) => {
        const ext = (f.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
        return f.size > MAX_SIZE || !allowed.includes(ext);
      });

      if (invalid) {
        if (invalid.size > MAX_SIZE) {
          Alert.alert("File Too Large", "Maximum file size is 10MB.");
        } else {
          Alert.alert(
            "Invalid File Type",
            "Only PDF, JPG, PNG, DOC, DOCX files are allowed."
          );
        }
        return;
      }

      setUploading(true);

      const doctorId = doctorData && doctorData.doctorId;
      if (!doctorId || doctorId === "undefined") {
        Alert.alert("Error", "Doctor ID is missing. Please contact support.");
        setUploading(false);
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const form = new FormData();
        form.append("document", {
          uri: file.uri,
          type: file.mimeType || "application/octet-stream",
          name: file.name,
        });

        const res = await api.post(
          `/api/admin-verification/documents/${doctorId}`,
          form,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const body = res.data;
        const doc = body.document || {};
        const newFile = {
          id: Date.now() + i,
          name: doc.filename || file.name,
          url: doc.url || doc.path || "",
          uploadedAt: doc.uploadedAt || new Date().toISOString(),
          raw: doc,
        };

        setUploadedFiles((prev) => [...prev, newFile]);
        setDoctorData((prev) => ({
          ...prev,
          certificates: [...(prev.certificates || []), newFile.url],
          updatedAt: new Date().toISOString(),
        }));
      }

      Alert.alert(
        "Success",
        "Certificates uploaded successfully! Waiting for admin verification."
      );
    } catch (error) {
      console.error("Upload error", error);
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to upload document";
      Alert.alert("Upload Error", msg);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (id) => {
    const fileToRemove = uploadedFiles.find((f) => f.id === id);
    if (!fileToRemove) return;

    const doctorId = doctorData && doctorData.doctorId;
    if (!doctorId || doctorId === "undefined") {
      Alert.alert("Error", "Doctor ID is missing. Please contact support.");
      return;
    }

    try {
      await api.delete(
        `/api/admin-verification/documents/${doctorId}/${encodeURIComponent(
          fileToRemove.name
        )}`
      );

      const updatedCertificates = doctorData.certificates.filter(
        (url) => url !== fileToRemove.url
      );
      setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
      setDoctorData((prev) => ({
        ...prev,
        certificates: updatedCertificates,
        updatedAt: new Date().toISOString(),
      }));

      try {
        let exists = false;
        try {
          await api.get(`/api/admin-verification/${doctorId}`);
          exists = true;
        } catch (err) {
          exists = false;
        }

        if (exists) {
          await api.put(`/api/admin-verification/${doctorId}`, {
            certificates: updatedCertificates,
          });
        } else if (updatedCertificates.length > 0) {
          await api.post(`/api/admin-verification/`, {
            doctorId,
            certificates: updatedCertificates,
          });
        }
      } catch (dbError) {
        console.error(
          "File deleted from storage but failed to update database:",
          dbError
        );
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      Alert.alert("Error", "Failed to delete file from storage.");
    }
  };

  const handleSaveCertificates = async () => {
    if (doctorData.certificates.length === 0) {
      Alert.alert(
        "Missing Certificates",
        "Please upload at least one certificate"
      );
      return;
    }

    try {
      const doctorId = doctorData && doctorData.doctorId;
      if (!doctorId || doctorId === "undefined") {
        Alert.alert("Error", "Doctor ID is missing. Please contact support.");
        return;
      }

      let exists = false;
      try {
        await api.get(`/api/admin-verification/${doctorId}`);
        exists = true;
      } catch (err) {
        exists = false;
      }

      if (exists) {
        await api.put(`/api/admin-verification/${doctorId}`, {
          certificates: doctorData.certificates,
        });
      } else {
        await api.post(`/api/admin-verification/`, {
          doctorId,
          certificates: doctorData.certificates,
        });
      }

      Alert.alert(
        "Success",
        "Certificates saved successfully! Waiting for admin verification."
      );
      setHasSavedCertificates(true);
    } catch (error) {
      Alert.alert("Error", "Failed to save certificates to backend.");
    }
  };

  const checkVerificationStatus = async () => {
    if (!hasSavedCertificates) {
      Alert.alert(
        "📋 Save Certificates First",
        "Please upload and save your certificates before checking verification status.",
        [
          {
            text: "OK",
            style: "default",
          },
        ]
      );
      return;
    }

    setCheckingStatus(true);
    try {
      const doctorId = doctorData.doctorId;
      if (!doctorId || doctorId === "undefined") {
        Alert.alert("Error", "Doctor ID is missing. Please contact support.");
        return;
      }

      const response = await api.get(`/api/admin-verification/${doctorId}`);

      const verificationData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      const isVerified = verificationData?.isVerified || false;

      if (isVerified) {
        Alert.alert(
          "✅ Verification Complete!",
          "Your account has been verified by admin. You can now access your dashboard.",
          [
            {
              text: "Go to Dashboard",
              onPress: () => router.replace("/(tabs)/appointments"),
            },
          ]
        );
      } else {
        Alert.alert(
          "⏳ Still Pending",
          "Your verification is still pending. Please wait for admin approval or ensure you have uploaded and saved your certificates."
        );
      }

      setDoctorData((prev) => ({
        ...prev,
        isVerified,
        ...verificationData,
      }));
    } catch (error) {
      console.error("Status check error:", error);

      if (error.response?.status === 404) {
        Alert.alert(
          "📋 No Verification Record",
          "No verification record found. Please make sure you have uploaded and saved your certificates first.",
          [
            {
              text: "OK",
              style: "default",
            },
          ]
        );
      } else if (error.response?.status === 401) {
        Alert.alert(
          "🔐 Authentication Error",
          "Please log out and log back in to refresh your session.",
          [
            {
              text: "Go to Login",
              onPress: handleLogout,
            },
          ]
        );
      } else {
        Alert.alert(
          "⏳ Still Pending",
          "Unable to check status right now. Your verification is likely still pending admin approval."
        );
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/login");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return {
    doctorData,
    setDoctorData,
    uploadedFiles,
    uploading,
    loading,
    checkingStatus,
    hasSavedCertificates,
    handleFileUpload,
    removeFile,
    handleSaveCertificates,
    checkVerificationStatus,
    handleLogout,
    formatDate,
  };
}
