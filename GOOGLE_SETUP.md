# Google Calendar Integration Setup

## 🔧 Required Setup Steps

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Calendar Todo App")
3. Enable Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Select "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (if using server)
   - `http://127.0.0.1:5500` (if using Live Server extension)
   - `file://` (if opening HTML directly - **see special setup below**)

5. Add authorized redirect URIs (same as origins)
6. Copy the **Client ID**

### 3. Get API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the **API Key**
4. Restrict the key to Google Calendar API only

### 4. Update Configuration
In `google-calendar.js`, replace these placeholders:

```javascript
// Line 4
this.CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace with your actual Client ID

// Line 5  
this.API_KEY = 'YOUR_API_KEY'; // Replace with your actual API Key
```

## 🚀 How to Use

### Connect to Google Calendar
1. Click the **🔗 Google** button
2. Sign in with your Google account
3. Grant calendar permissions
4. Status will show "✅ Connected to Google Calendar"

### Import Events
1. After connecting, click **🔄 Sync** button
2. Select which events to import from your Google Calendar
3. Events will be added as todos to your calendar

### Export to Google Calendar
1. Click the **📅** button on any todo
2. Todo will be created as an event in your Google Calendar
3. Get notifications and reminders from Google Calendar

## 📋 Features

### ✅ What's Supported
- **Import** upcoming events from Google Calendar
- **Export** todos as Google Calendar events  
- **Two-way sync** between app and Google Calendar
- **Real-time authentication** with OAuth 2.0
- **Event details** (title, time, description, links)

### 🔒 Security & Privacy
- **OAuth 2.0** secure authentication
- **Limited permissions** - only calendar access
- **No data storage** - authentication tokens stored locally
- **User control** - can disconnect at any time

### 🌐 Browser Compatibility
- ✅ Chrome, Edge, Safari (modern versions)
- ✅ Firefox with https:// required
- ❌ Internet Explorer (not supported)

## 🔍 Troubleshooting

### "Google button not working"
- Check Client ID and API Key are correctly set
- Ensure Google Calendar API is enabled
- Try clearing browser cache and cookies

### "Authentication failed"
- Verify redirect URIs match your setup
- Check that JavaScript origins are correct
- Make sure you're not using incognito mode

### "No events imported"
- Check that you have events in your Google Calendar
- Ensure events are in the future (not past events)
- Verify calendar sharing permissions

### "Export not working"
- Ensure you're signed in to Google Calendar
- Check network connection
- Verify calendar permissions

## 📱 Mobile Usage
- Works on mobile browsers
- For best experience, add to home screen
- Google Calendar app will handle notifications

---

## 📁 Opening HTML Directly (File:// Protocol)

### ⚠️ Important Notes for File:// Usage
- **Google OAuth2 has restrictions** for file:// protocol
- **Workarounds required** for authentication to work
- **Recommended:** Use a simple local server instead

### 🛠️ Option 1: Live Server Extension (Recommended)
1. Install **Live Server** extension in VS Code or browser
2. Open your project folder with Live Server
3. Google OAuth will work normally
4. URL will be like `http://127.0.0.1:5500/index.html`

### 🛠️ Option 2: Python Simple Server
1. Open terminal in your project folder
2. Run: `python -m http.server 8000`
3. Open browser to: `http://localhost:8000/index.html`
4. Add `http://localhost:8000` to authorized origins

### 🛠️ Option 3: Node.js Server (If you want to use file://)
If you absolutely must use file:// protocol, you need special setup:

1. **Create a simple local HTTP server** (best option)
2. **Use the `server.js` file** I provided earlier
3. **Run `npm install && npm start`**
4. **Open `http://localhost:3000`**

### 🔧 For File:// Protocol Only (Advanced)
If you must use file://, these settings:

```javascript
// In google-calendar.js, update the origins to include file://
// Also need to use a different authentication flow
```

**However, this is NOT recommended due to security limitations.**

---

**Note:** This integration requires internet connection and valid Google Account with Google Calendar access.