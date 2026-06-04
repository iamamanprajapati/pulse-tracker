# PulseTrack Google Sign-In Setup Guide

This guide walks you through setting up real Google Sign-In for the **PulseTrack** mobile application (Expo React Native) and backend API (Node.js Express).

---

## 1. Google Cloud Console Configuration

To get started, you must register your app and obtain credentials from the Google Cloud Console.

### Step A: Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown and select **New Project**. Name it `PulseTrack` and click **Create**.

### Step B: Configure OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (or **Internal** if using a Google Workspace organization) and click **Create**.
3. Fill in the app info:
   - **App name:** `PulseTrack`
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
4. Click **Save and Continue** through the scopes and test users sections. Make sure to add your own Google email address as a **Test User** while the app is in the "Testing" publishing status.

### Step C: Create OAuth Client IDs
You will need to create client IDs for the web (used for token exchange) and for each native platform you support.

1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** and select **OAuth client ID**.

#### 1. Web Application Client ID (Required)
- **Application type:** `Web application`
- **Name:** `PulseTrack Web Client`
- Click **Create**.
- Copy the **Client ID** (e.g., `123456-abcdef.apps.googleusercontent.com`).
- *Note:* This ID is critical. It acts as the audience parameter for token exchange and is used by both the backend and frontend.

#### 2. Android Client ID (Required for Android Native builds)
- **Application type:** `Android`
- **Name:** `PulseTrack Android Client`
- **Package name:** `com.pulsetrack.app` (or check your `app.json` android package setting)
- **SHA-1 certificate fingerprint:** Retrieve your keystore fingerprint. For development:
  - Run: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
  - Copy the `SHA1` fingerprint value and paste it into the console.
- Click **Create**.

#### 3. iOS Client ID (Required for iOS Native builds)
- **Application type:** `iOS`
- **Name:** `PulseTrack iOS Client`
- **Bundle ID:** `com.pulsetrack.app` (or check your `app.json` ios bundleIdentifier setting)
- Click **Create**.

---

## 2. Environment Configuration

### Backend Setup
1. Open the [backend/.env](file:///Users/innovationm-admin/Desktop/pulse-tracker/backend/.env) file.
2. Insert your **Web Application Client ID** under `GOOGLE_CLIENT_ID`:
   ```env
   GOOGLE_CLIENT_ID=your_web_client_id_here.apps.googleusercontent.com
   ```

### Mobile App Setup
1. Open the [app/.env](file:///Users/innovationm-admin/Desktop/pulse-tracker/app/.env) file.
2. Insert the same **Web Application Client ID** under `EXPO_PUBLIC_GOOGLE_CLIENT_ID`:
   ```env
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_web_client_id_here.apps.googleusercontent.com
   ```

---

## 3. Running & Testing

### Web / Development Simulator Fallback
If `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is left empty or if you are running on the web, the app will display a notification saying it is in development mode and gracefully log you in using mock developer profile credentials.

### Compiling Native Applications
The native Google Sign-In module requires custom native libraries which are not included in the standard Expo Go client. You must run a local native compilation:

```bash
# Move to the mobile app directory
cd app

# For Android Emulator or physical device (connected via USB)
npx expo run:android

# For iOS Simulator or physical device
npx expo run:ios
```

Once running on a custom build, tapping **"Continue with Google"** will display the native Google account chooser interface. The application will receive an ID token, securely verify it on the Node.js backend using the `google-auth-library` verification ticket, and establish a secure authenticated JWT session!
