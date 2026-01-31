// Google Calendar API Integration
class GoogleCalendarAPI {
    constructor() {
        this.CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace with your client ID
        this.API_KEY = 'YOUR_API_KEY'; // Replace with your API key
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/calendar';
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
    }

    // Initialize Google API
    async initialize() {
        try {
            await this.loadGAPI();
            await this.loadGIS();
            
            gapi.load('client', async () => {
                await gapi.client.init({
                    apiKey: this.API_KEY,
                    discoveryDocs: [this.DISCOVERY_DOC],
                });
                this.gapiInited = true;
                this.maybeEnableButtons();
            });
        } catch (error) {
            console.error('Error initializing Google API:', error);
        }
    }

    // Load Google API script
    loadGAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Load Google Identity Services script
    loadGIS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Initialize GIS and create token client
    initializeGis() {
        try {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: '', // defined later
                ux_mode: 'popup',
                prompt: 'select_account'
            });
            this.gisInited = true;
            this.maybeEnableButtons();
            console.log('Google Identity Services initialized successfully');
        } catch (error) {
            console.error('Error initializing GIS:', error);
        }
    }

    // Enable buttons when APIs are ready
    maybeEnableButtons() {
        if (this.gapiInited && this.gisInited) {
            document.getElementById('googleAuthBtn').style.display = 'inline-flex';
            document.getElementById('syncBtn').style.display = 'inline-flex';
        }
    }

    // Handle Google Sign-In
    async handleAuthClick() {
        this.tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error('Auth error:', resp);
                alert('Authentication failed: ' + (resp.error_description || resp.error));
                throw (resp);
            }
            
            console.log('Auth successful:', resp);
            
            // Save token and update UI
            localStorage.setItem('google_calendar_token', JSON.stringify(resp));
            this.updateAuthUI(true);
            
            // Load calendar events
            try {
                const events = await this.listUpcomingEvents();
                console.log('Events loaded:', events);
                return events;
            } catch (error) {
                console.error('Error loading events after auth:', error);
            }
        };

        if (gapi.client.getToken() === null) {
            console.log('Requesting new token...');
            this.tokenClient.requestAccessToken();
        } else {
            console.log('Requesting token refresh...');
            this.tokenClient.requestAccessToken();
        }
    }

    // Handle Sign-Out
    handleSignoutClick() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            localStorage.removeItem('google_calendar_token');
            this.updateAuthUI(false);
        }
    }

    // Update auth UI
    updateAuthUI(isSignedIn) {
        const authBtn = document.getElementById('googleAuthBtn');
        const syncBtn = document.getElementById('syncBtn');
        const status = document.getElementById('googleStatus');
        
        if (isSignedIn) {
            authBtn.textContent = '🚪 Sign Out';
            authBtn.onclick = () => this.handleSignoutClick();
            syncBtn.style.display = 'inline-flex';
            status.innerHTML = '<span class="status-connected">✅ Connected to Google Calendar</span>';
        } else {
            authBtn.textContent = '🔗 Connect Google';
            authBtn.onclick = () => this.handleAuthClick();
            syncBtn.style.display = 'none';
            status.innerHTML = '<span class="status-disconnected">❌ Not connected to Google Calendar</span>';
        }
    }

    // List upcoming events from Google Calendar
    async listUpcomingEvents() {
        try {
            const response = await gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 100,
                'orderBy': 'startTime'
            });
            
            const events = response.result.items;
            console.log('Google Calendar events:', events);
            return events;
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            throw error;
        }
    }

    // Convert Google Calendar event to our todo format
    convertGoogleEventToTodo(event) {
        return {
            id: event.id || Date.now(),
            title: event.summary || 'Untitled Event',
            date: event.start?.dateTime || event.start?.date,
            time: event.start?.dateTime ? this.extractTime(event.start.dateTime) : '',
            description: event.description || '',
            link: event.htmlLink || '',
            enableNotification: true,
            notificationMinutes: 15,
            completed: false,
            source: 'google-calendar'
        };
    }

    // Extract time from datetime string
    extractTime(dateTime) {
        const date = new Date(dateTime);
        return date.toTimeString().slice(0, 5);
    }

    // Import events from Google Calendar
    async importFromGoogleCalendar() {
        try {
            const events = await this.listUpcomingEvents();
            const todos = events.map(event => this.convertGoogleEventToTodo(event));
            
            // Ask for confirmation
            if (this.calendarApp.todos.length > 0) {
                const confirmed = confirm(`This will add ${todos.length} events from Google Calendar. Continue?`);
                if (!confirmed) return;
            }
            
            // Add todos to app (avoid duplicates by ID)
            const existingIds = new Set(this.calendarApp.todos.map(todo => todo.id));
            const newTodos = todos.filter(todo => !existingIds.has(todo.id));
            
            this.calendarApp.todos.push(...newTodos);
            await this.calendarApp.saveTodos();
            this.calendarApp.renderCalendar();
            this.calendarApp.renderTodos();
            
            this.calendarApp.showNotification(`Imported ${newTodos.length} events from Google Calendar`, 'success');
        } catch (error) {
            console.error('Error importing from Google Calendar:', error);
            this.calendarApp.showNotification('Failed to import from Google Calendar', 'error');
        }
    }

    // Create event in Google Calendar
    async createGoogleEvent(todo) {
        try {
            const event = {
                'summary': todo.title,
                'description': todo.description || '',
                'start': {
                    'dateTime': todo.time ? `${todo.date}T${todo.time}:00` : `${todo.date}T00:00:00`,
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'end': {
                    'dateTime': todo.time ? `${todo.date}T${this.addOneHour(todo.time)}:00` : `${todo.date}T01:00:00`,
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            };

            const response = await gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': event
            });

            console.log('Event created:', response.result);
            return response.result;
        } catch (error) {
            console.error('Error creating Google Calendar event:', error);
            throw error;
        }
    }

    // Add one hour to time string
    addOneHour(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const newHours = (parseInt(hours) + 1) % 24;
        return `${newHours.toString().padStart(2, '0')}:${minutes}`;
    }

    // Export todo to Google Calendar
    async exportToGoogleCalendar(todo) {
        try {
            await this.createGoogleEvent(todo);
            todo.googleCalendarId = todo.id; // Mark as synced
            this.calendarApp.showNotification(`"${todo.title}" added to Google Calendar`, 'success');
        } catch (error) {
            this.calendarApp.showNotification('Failed to add to Google Calendar', 'error');
        }
    }
}