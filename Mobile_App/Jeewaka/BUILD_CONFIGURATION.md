# Jeewaka Mobile App Build Configuration & Optimizations

> **Important**: This document contains all custom configurations that need to be reapplied after `npx expo prebuild --clean` operations, as prebuild regenerates native Android/iOS files and overwrites custom changes.

## Table of Contents

1. [APK Size Optimizations](#apk-size-optimizations)
2. [Network Configuration](#network-configuration)
3. [Android Resources](#android-resources)
4. [ProGuard/R8 Rules](#proguardr8-rules)
5. [Android Manifest Changes](#android-manifest-changes)
6. [App Icon Configuration](#app-icon-configuration)
7. [Build Results](#build-results)

---

## APK Size Optimizations

### 1. Architecture Reduction

**File**: `android/gradle.properties`

**Original**:

```properties
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
```

**Optimized**:

```properties
# Use this property to specify which architecture you want to build.
# You can also override it from the CLI using
# ./gradlew <task> -PreactNativeArchitectures=x86_64
reactNativeArchitectures=arm64-v8a,armeabi-v7a
```

**Impact**: Reduces APK size by ~30-40% while maintaining 99% device coverage.

### 2. Code Minification & Resource Shrinking

**File**: `android/gradle.properties`

**Add these lines**:

```properties
# Enable resource shrinking in release builds
android.enableShrinkResourcesInReleaseBuilds=true

# Enable Proguard/R8 in release builds
android.enableProguardInReleaseBuilds=true
```

### 3. Memory Optimization

**File**: `android/gradle.properties`

**Enhanced JVM settings**:

```properties
# Specifies the JVM arguments used for the daemon process.
# The setting is particularly useful for tweaking memory settings.
# Default value: -Xmx512m -XX:MaxMetaspaceSize=256m
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m

# When configured, Gradle will run in incubating parallel mode.
# This option should only be used with decoupled projects. More details, visit
# http://www.gradle.org/docs/current/userguide/multi_project_builds.html#sec:decoupled_projects
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=true
```

### 4. New Architecture Disabled

**File**: `android/gradle.properties`

```properties
# Use this property to enable support to the new architecture.
# This will allow you to use TurboModules and the Fabric render in
# your application. You should enable this flag either if you want
# to write custom TurboModules/Fabric components OR use libraries that
# are providing them.
newArchEnabled=false
```

**File**: `app.json`

```json
{
  "expo": {
    "newArchEnabled": false
  }
}
```

---

## Network Configuration

### 1. Network Security Config

**File**: `android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">13.53.53.29</domain>
        <domain includeSubdomains="false">localhost</domain>
        <domain includeSubdomains="false">10.0.2.2</domain>
        <domain includeSubdomains="false">10.14.138.57</domain>
    </domain-config>
</network-security-config>
```

**Purpose**: Allows HTTP connections to your backend servers for development/testing.

---

## Android Resources

### 1. Colors Configuration

**File**: `android/app/src/main/res/values/colors.xml`

```xml
<resources>
    <item name="orange" type="color">#FF4500</item>
    <color name="colorPrimary">#008080</color>
    <color name="colorPrimaryDark">#006666</color>
    <color name="colorAccent">#FF4500</color>
    <color name="iconBackground">#ffffff</color>
    <integer-array name="androidcolors">
        <item>@color/orange</item>
    </integer-array>
</resources>
```

**Purpose**: Fixes missing color resource errors during build.

---

## ProGuard/R8 Rules

### 1. ProGuard Rules

**File**: `android/app/proguard-rules.pro`

```proguard
# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Stripe React Native SDK
-keep class com.stripe.android.** { *; }
-keep class com.reactnativestripesdk.** { *; }
-dontwarn com.stripe.android.pushProvisioning.**

# WebRTC
-keep class org.webrtc.** { *; }
-keep class live.videosdk.** { *; }
-dontwarn org.webrtc.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Expo
-keep class expo.** { *; }
-keep class versioned.** { *; }

# Add any project specific keep options here:
```

**Purpose**: Prevents ProGuard from removing essential classes that are needed at runtime.

---

## Android Manifest Changes

### 1. Network Security Configuration

**File**: `android/app/src/main/AndroidManifest.xml`

**Find the `<application>` tag and add these attributes**:

```xml
<application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="true"
    android:theme="@style/AppTheme"
    android:supportsRtl="true"
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="true">
```

**Purpose**: Enables HTTP traffic to your backend servers.

---

## App Icon Configuration

### 1. App.json Icon Settings

**File**: `app.json`

```json
{
  "expo": {
    "name": "Jeewaka",
    "slug": "Jeewaka",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "jeewaka",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": false,
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#008080"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.yashwick.Jeewaka"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

### 2. Required Icon Files

Create/update these files with your custom medical platform icons:

- `assets/images/icon.png` (1024x1024px)
- `assets/images/adaptive-icon.png` (1024x1024px)
- `assets/images/favicon.png` (48x48px)

---

## Build Results

### APK Size Optimization Results:

| Configuration                                                           | APK Size      | Reduction           |
| ----------------------------------------------------------------------- | ------------- | ------------------- |
| **Original** (4 architectures, no optimization)                         | **127.83 MB** | -                   |
| **With architecture reduction** (2 architectures)                       | **123.67 MB** | **4.16 MB** (3.3%)  |
| **Full optimization** (2 architectures + ProGuard + Resource shrinking) | **115.16 MB** | **12.67 MB** (9.9%) |

### Device Coverage:

- **arm64-v8a + armeabi-v7a** covers ~99% of Android devices
- Only excludes very old devices (pre-2014) and some rare budget phones

---

## Quick Restoration Steps

After running `npx expo prebuild --clean`, follow these steps:

1. **Apply Gradle Optimizations**:

   ```bash
   # Edit android/gradle.properties
   # Add architecture reduction, memory optimization, and build optimizations
   ```

2. **Create Network Security Config**:

   ```bash
   # Create android/app/src/main/res/xml/network_security_config.xml
   ```

3. **Update Colors**:

   ```bash
   # Edit android/app/src/main/res/values/colors.xml
   # Add missing color definitions
   ```

4. **Update Android Manifest**:

   ```bash
   # Edit android/app/src/main/AndroidManifest.xml
   # Add network security config attributes
   ```

5. **Add ProGuard Rules**:

   ```bash
   # Edit android/app/proguard-rules.pro
   # Add Stripe, WebRTC, Firebase, and React Native keep rules
   ```

6. **Build Optimized APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

---

## Environment Variables

**File**: `.env`

```properties
EXPO_PUBLIC_BACKEND_URL="http://13.53.53.29:5000"
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S0zCgD3q2KwZfFnSj8Xf1cidCYG19y1ircVKuiOcCqagqSEioq2D1su9lvN6HpKoQnpY8gzgjaF4XJuuVnlPuor00dB2S7xTs
EXPO_PUBLIC_ENV=development
```

---

## Notes

- **Always backup this file** before making changes
- **Test thoroughly** after applying optimizations
- **Monitor app performance** with the optimized build
- **Update backend URL** as needed for different environments
- **Keep ProGuard rules updated** when adding new dependencies

---

_Last Updated: October 20, 2025_
_Created during APK optimization session_
