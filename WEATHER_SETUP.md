# Weather API Setup Guide

To display real weather data, you need to set up the OpenWeatherMap API:

## Step 1: Get OpenWeatherMap API Key

1. Go to https://openweathermap.org/api
2. Click "Sign Up" to create a free account
3. After signing up, go to the "API keys" section
4. Copy your API key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

## Step 2: Create Environment File

Create a file called `.env` in the root directory of your project with this content:

```env
# OpenWeatherMap API Key
VITE_OPENWEATHER_API_KEY=your_actual_api_key_here

# Firebase Configuration (if not already set)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 3: Replace the API Key

Replace `your_actual_api_key_here` with your real API key from step 1.

## Step 4: Restart the Development Server

After creating the `.env` file:

1. Stop the current development server (Ctrl+C)
2. Run `npm run dev` again
3. The weather should now show real data!

## Free Tier Limits

The free OpenWeatherMap API includes:
- 1,000 API calls per day
- Current weather data
- 5-day weather forecast
- Weather icons

This is more than enough for a smart mirror that refreshes every 5 minutes.
