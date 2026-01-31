# Calendar Todo List - File-Based Storage

## Setup Instructions

### 1. Install Node.js
Download and install Node.js from [https://nodejs.org](https://nodejs.org)

### 2. Install Dependencies
Open terminal/command prompt in your project folder and run:
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```
or for development (auto-restart on changes):
```bash
npm run dev
```

### 4. Open the App
Go to [http://localhost:3000](http://localhost:3000) in your browser

## Data Storage

Your data is now stored in files instead of browser localStorage:

### **Main Data File:**
- 📁 `data/todos.json` - All your todos are stored here

### **Backup Files:**
- 📁 `data/todos-backup-YYYY-MM-DDTHH-MM-SS-sssZ.json` - Automatic backups

### **Folder Structure:**
```
f/
├── data/                    # 📁 Data folder (created automatically)
│   ├── todos.json          # 💾 Main todos file
│   └── todos-backup-*.json # 🗂️ Backup files
├── index.html               # 🌐 App HTML
├── styles.css              # 🎨 App styles
├── script.js               # ⚡ App JavaScript
├── server.js               # 🖥️ Local server
└── package.json            # 📦 Node.js configuration
```

## Features

### **✅ File-Based Storage:**
- Data persists across browser sessions
- Works on any device accessing the server
- Automatic backups created periodically

### **🔄 Sync & Backup:**
- Automatic server sync when online
- Local storage fallback when offline
- Manual backup creation available

### **🛡️ Data Safety:**
- Multiple backup copies
- Error handling for file operations
- Graceful fallback to local storage

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all todos |
| POST | `/api/todos` | Add new todo |
| PUT | `/api/todos/:id` | Update todo |
| DELETE | `/api/todos/:id` | Delete todo |
| POST | `/api/todos/backup` | Create backup |
| GET | `/api/todos/backups` | List backup files |
| POST | `/api/todos/restore/:filename` | Restore from backup |

## Data Format

The `todos.json` file stores data in this format:
```json
[
  {
    "id": 1678934400000,
    "title": "Doctor Appointment",
    "date": "2025-03-12T00:00:00.000Z",
    "time": "14:30",
    "description": "Annual checkup",
    "link": "https://doctor-portal.com",
    "enableNotification": true,
    "notificationMinutes": 15,
    "completed": false,
    "createdAt": "2025-03-12T10:30:00.000Z"
  }
]
```

## Troubleshooting

### **Server Won't Start:**
- Make sure Node.js is installed
- Check if port 3000 is available
- Run `npm install` to install dependencies

### **Data Not Saving:**
- Check if `data` folder exists
- Verify file permissions
- Check server console for errors

### **Can't Access App:**
- Make sure server is running
- Go to `http://localhost:3000`
- Check firewall settings

## Benefits vs LocalStorage

| Feature | LocalStorage | File Storage |
|---------|--------------|--------------|
| **Persistence** | ❌ Browser cache only | ✅ File system |
| **Cross-Device** | ❌ Device specific | ✅ Server accessible |
| **Backups** | ❌ No backups | ✅ Automatic backups |
| **Data Size** | ❌ 5-10MB limit | ✅ No practical limit |
| **Export/Import** | ❌ Manual only | ✅ File operations |