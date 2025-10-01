import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PagerView from "react-native-pager-view";
import useAuthStore from "../store/authStore";

const { width } = Dimensions.get("window");

export default function HomePage() {
  const router = useRouter();
  const { user, loading, initializeAuth } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Handle navigation after authentication check
  useEffect(() => {
    if (!loading && user) {
      router.replace("/(tabs)");
    }
  }, [user, loading]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // If user is authenticated, show loading (navigation will happen in useEffect)
  if (user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </SafeAreaView>
    );
  }

  const handleNextPage = () => {
    if (currentPage < 2) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      pagerRef.current?.setPage(nextPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      pagerRef.current?.setPage(prevPage);
    }
  };

  // Page 1: Welcome
  const WelcomePage = () => (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.tagline}>Your Health, Our Priority</Text>
      </View>

      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.welcomeText}>Welcome to Jeewaka</Text>
          <Text style={styles.subtitle}>
            Connect with qualified doctors, book appointments, and manage your
            healthcare journey - all in one place.
          </Text>
        </View>
        <Image
          source={require("../assets/images/homeimage.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  // Page 2: Features
  const FeaturesPage = () => (
    <View style={styles.page}>
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>What We Offer</Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="search" size={24} color="#3B82F6" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Find Doctors</Text>
              <Text style={styles.featureDescription}>
                Search and discover qualified doctors through AI-powered search
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Book Appointments</Text>
              <Text style={styles.featureDescription}>
                Schedule in-person or video consultations at your convenience.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="videocam" size={24} color="#3B82F6" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Video Consultations</Text>
              <Text style={styles.featureDescription}>
                Connect with doctors remotely through secure video calls.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Secure & Private</Text>
              <Text style={styles.featureDescription}>
                Your health data is protected with end-to-end encryption.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Page 3: Get Started
  const GetStartedPage = () => (
    <View style={styles.page}>
      <View style={styles.ctaSection}>
        <View style={styles.ctaIconContainer}>
          <Ionicons name="rocket" size={80} color="#3B82F6" />
        </View>

        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaSubtitle}>
          Join the Jeewaka family - trusted by thousands for better healthcare.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/register")}
            activeOpacity={0.8}
          >
            <View style={styles.buttonGradient}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 Jeewaka Medical Platform. All rights reserved.
        </Text>
      </View> */}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        <View key="1">
          <WelcomePage />
        </View>
        <View key="2">
          <FeaturesPage />
        </View>
        <View key="3">
          <GetStartedPage />
        </View>
      </PagerView>

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentPage === index
                ? styles.activeIndicator
                : styles.inactiveIndicator,
            ]}
          />
        ))}
      </View>

      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        {currentPage > 0 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePreviousPage}
          >
            <Ionicons name="chevron-back" size={24} color="#3B82F6" />
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.navSpacer} />

        {currentPage < 2 && (
          <TouchableOpacity style={styles.navButton} onPress={handleNextPage}>
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
  },
  tagline: {
    fontSize: 16,
    color: "#6B7280",
    fontStyle: "italic",
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 40,
  },
  heroContent: {
    alignItems: "center",
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  heroImageContainer: {
    backgroundColor: "#F3F4F6",
    padding: 0,
    borderRadius: 100,
    marginBottom: 20,
  },
  heroImage: {
    width: 350,
    height: 350,
  },
  featuresSection: {
    paddingVertical: 30,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 30,
  },
  featuresList: {
    gap: 20,
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  ctaSection: {
    paddingVertical: 40,
    alignItems: "center",
  },
  ctaIconContainer: {
    backgroundColor: "#F3F4F6",
    padding: 30,
    borderRadius: 100,
    marginBottom: 30,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: "auto",
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeIndicator: {
    backgroundColor: "#3B82F6",
    width: 24,
    borderRadius: 12,
  },
  inactiveIndicator: {
    backgroundColor: "#D1D5DB",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 4,
  },
  navButtonText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "500",
  },
  navSpacer: {
    flex: 1,
  },
});
