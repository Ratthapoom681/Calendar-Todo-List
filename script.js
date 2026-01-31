// Main class for the Calendar Todo List application
class CalendarTodoApp {
    constructor() {
        this.currentDate = new Date();        // Current date being displayed in calendar
        this.selectedDate = null;             // Date selected by user for todos
        this.todos = [];                      // Start with empty array
        this.notifications = [];              // Array to store scheduled notifications
        this.googleAPI = new GoogleCalendarAPI(); // Google Calendar integration
        this.googleAPI.calendarApp = this;    // Reference for API to use
        
this.init();                          // Initialize app
    }

    // Initialize method sets up application
    async init() {
        this.todos = await this.loadTodos();  // Load todos from localStorage
        this.setupEventListeners();           // Set up click handlers and form submissions
        this.renderCalendar();                // Render calendar view
        this.requestNotificationPermission();  // Ask for notification permission
        this.checkNotifications();            // Check for any pending notifications
        
        // Initialize Google Calendar API
        await this.googleAPI.initialize();
        this.googleAPI.initializeGis();
        
        // Check if already signed in
        const savedToken = localStorage.getItem('google_calendar_token');
        if (savedToken) {
            this.googleAPI.updateAuthUI(true);
        }
    }

    // Set up all event listeners for the application
    setupEventListeners() {
        // Navigation buttons for month switching
        document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
        
        // Todo modal controls
        document.getElementById('addTodoBtn').addEventListener('click', () => this.openTodoModal());
        document.querySelector('.close').addEventListener('click', () => this.closeTodoModal());
        document.getElementById('todoForm').addEventListener('submit', (e) => this.handleTodoSubmit(e));
        
        // Data control buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToFile());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadFromFile());
        document.getElementById('backupBtn').addEventListener('click', () => this.createBackup());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('googleAuthBtn').addEventListener('click', () => {
            if (this.googleAPI.gapiInited && this.googleAPI.gisInited) {
                const token = gapi.client.getToken();
                if (token) {
                    this.googleAPI.handleSignoutClick();
                } else {
                    this.googleAPI.handleAuthClick();
                }
            }
        });
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.googleAPI.importFromGoogleCalendar();
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('todoModal')) {
                this.closeTodoModal();
            }
        });
    }

    // Render the calendar grid for the current month
    renderCalendar() {
        // Debug logging
        console.log('Rendering calendar for:', this.currentDate);
        
        // Get year and month from current date
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update the month/year display header
        document.getElementById('currentMonth').textContent = 
            new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Calculate calendar layout information
        const firstDay = new Date(year, month, 1).getDay();        // Day of week for first day
        const daysInMonth = new Date(year, month + 1, 0).getDate(); // Total days in current month
        const daysInPrevMonth = new Date(year, month, 0).getDate();  // Total days in previous month
        
        console.log('Calendar data:', { year, month, firstDay, daysInMonth, daysInPrevMonth });
        
        // Clear existing calendar grid
        const calendarGrid = document.getElementById('calendar');
        if (!calendarGrid) {
            console.error('Calendar grid element not found!');
            return;
        }
        calendarGrid.innerHTML = '';
        
        // Get today's date for highlighting
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Add previous month's trailing days (grayed out)
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayElement = this.createDayElement(day, true, new Date(year, month - 1, day));
            calendarGrid.appendChild(dayElement);
        }
        
        console.log('Added previous month days, grid now has:', calendarGrid.children.length, 'cells');
        
        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayElement = this.createDayElement(day, false, date);
            
            // Highlight today's date
            if (date.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            // Add indicator if there are todos on this date
            if (this.hasTodosOnDate(date)) {
                dayElement.classList.add('has-todos');
            }
            
            calendarGrid.appendChild(dayElement);
        }
        
        console.log('Added current month days, grid now has:', calendarGrid.children.length, 'cells');
        
        // Add next month's leading days to complete 6-week grid
        const totalCells = calendarGrid.children.length;
        const remainingCells = 42 - totalCells;
        
        console.log('Adding remaining cells:', remainingCells, 'from total:', totalCells);
        
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(day, true, new Date(year, month + 1, day));
            calendarGrid.appendChild(dayElement);
        }
        
        console.log('Final grid has:', calendarGrid.children.length, 'cells total');
    }

    // Create a single day element for the calendar
    createDayElement(day, isOtherMonth, date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        console.log('Creating day element:', day, 'other month:', isOtherMonth);
        
        // Style days from other months differently
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        // Add click handler to select this date
        dayElement.addEventListener('click', () => this.selectDate(date));
        
        return dayElement;
    }

    // Handle date selection when user clicks a calendar day
    selectDate(date) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Highlight selected date
        event.target.classList.add('selected');
        this.selectedDate = date;
        
        // Update the selected date display
        const dateString = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        document.getElementById('selectedDate').textContent = dateString;
        this.renderTodos(); // Refresh todo list for selected date
    }

    // Navigate to previous month
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    // Navigate to next month
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    // Open the todo modal (for adding or editing)
    openTodoModal(todo = null) {
        // Require date selection for new todos
        if (!this.selectedDate && !todo) {
            alert('Please select a date first');
            return;
        }
        
        // Get modal elements
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitBtn');
        const todoId = document.getElementById('todoId');
        
        if (todo) {
            // Edit mode: populate form with existing todo data
            modalTitle.textContent = 'Edit Todo';
            submitBtn.textContent = 'Update Todo';
            todoId.value = todo.id;
            
            document.getElementById('todoTitle').value = todo.title;
            document.getElementById('todoTime').value = todo.time || '';
            document.getElementById('todoDescription').value = todo.description || '';
            document.getElementById('todoLink').value = todo.link || '';
            document.getElementById('enableNotification').checked = todo.enableNotification || false;
            document.getElementById('notificationMinutes').value = todo.notificationMinutes || 15;
        } else {
            // Add mode: clear form
            modalTitle.textContent = 'Add New Todo';
            submitBtn.textContent = 'Add Todo';
            todoId.value = '';
            document.getElementById('todoForm').reset();
        }
        
        // Show the modal
        document.getElementById('todoModal').style.display = 'block';
    }

    // Close the todo modal
    closeTodoModal() {
        document.getElementById('todoModal').style.display = 'none';
    }

    // Handle form submission for adding/updating todos
    handleTodoSubmit(e) {
        e.preventDefault(); // Prevent default form submission
        
        // Get form values
        const todoId = document.getElementById('todoId').value;
        const title = document.getElementById('todoTitle').value;
        const time = document.getElementById('todoTime').value;
        const description = document.getElementById('todoDescription').value;
        const link = document.getElementById('todoLink').value;
        const enableNotification = document.getElementById('enableNotification').checked;
        const notificationMinutes = parseInt(document.getElementById('notificationMinutes').value) || 15;
        
        if (todoId) {
            // Update existing todo
            this.updateTodo(parseInt(todoId), {
                title,
                time,
                description,
                link,
                enableNotification,
                notificationMinutes
            });
        } else {
            // Create new todo object
            const todo = {
                id: Date.now(),                    // Unique ID using timestamp
                date: this.selectedDate.toISOString(), // Selected date in ISO format
                title,
                time,
                description,
                link,
                enableNotification,
                notificationMinutes,
                completed: false
            };
            
            this.addTodo(todo);
        }
        
        // Close modal and refresh views
        this.closeTodoModal();
        this.renderCalendar();
        this.renderTodos();
    }

    // Add a new todo to the list
    async addTodo(todo) {
        // For now, just use localStorage until server is set up
        this.todos.push(todo);
        await this.saveTodos();
        
        // Schedule notification if enabled
        if (todo.enableNotification) {
            this.scheduleNotification(todo);
        }
    }

    // Update an existing todo
    async updateTodo(todoId, updates) {
        // For now, just use localStorage until server is set up
        const todoIndex = this.todos.findIndex(todo => todo.id === todoId);
        if (todoIndex !== -1) {
            this.todos[todoIndex] = { ...this.todos[todoIndex], ...updates };
            await this.saveTodos();
        }
        
        // Cancel old notifications
        this.notifications = this.notifications.filter(n => n.todoId !== todoId);
        
        // Schedule new notification if enabled
        const updatedTodo = this.todos.find(todo => todo.id === todoId);
        if (updatedTodo && updatedTodo.enableNotification) {
            this.scheduleNotification(updatedTodo);
        }
    }

    // Render the todo list for the selected date
    renderTodos() {
        const todoList = document.getElementById('todoList');
        
        // Show message if no date is selected
        if (!this.selectedDate) {
            todoList.innerHTML = '<p style="text-align: center; color: #999;">Please select a date to see todos</p>';
            return;
        }
        
        // Get todos for selected date
        const dateTodos = this.getTodosForDate(this.selectedDate);
        
        // Show message if no todos for this date
        if (dateTodos.length === 0) {
            todoList.innerHTML = '<p style="text-align: center; color: #999;">No todos for this date</p>';
            return;
        }
        
        // Clear existing todo list
        todoList.innerHTML = '';
        
        // Sort todos by time (all-day items first)
        dateTodos.sort((a, b) => {
            if (a.time && b.time) return a.time.localeCompare(b.time);
            if (a.time) return -1;
            if (b.time) return 1;
            return 0;
        });
        
        // Create and add todo elements
        dateTodos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            todoList.appendChild(todoElement);
        });
    }

    // Create a todo element for display
    createTodoElement(todo) {
        const todoDiv = document.createElement('div');
        todoDiv.className = 'todo-item';
        
        // Create title element
        const titleDiv = document.createElement('div');
        titleDiv.className = 'todo-title';
        titleDiv.textContent = todo.title;
        
        // Create time element (show "All day" if no time)
        const timeDiv = document.createElement('div');
        timeDiv.className = 'todo-time';
        timeDiv.textContent = todo.time || 'All day';
        
        // Create description element
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'todo-description';
        descriptionDiv.textContent = todo.description || '';
        
        // Create link element if link exists
        let linkDiv = null;
        if (todo.link) {
            linkDiv = document.createElement('div');
            linkDiv.className = 'todo-link';
            
            const linkElement = document.createElement('a');
            linkElement.href = this.formatUrl(todo.link);
            linkElement.textContent = this.extractDomain(todo.link);
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            
            linkDiv.appendChild(linkElement);
        }
        
        // Create action buttons container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'todo-actions';
        
        // Create edit button
const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.background = '#667eea';
        editBtn.addEventListener('click', () => this.openTodoModal(todo));
        
        const googleBtn = document.createElement('button');
        googleBtn.textContent = '📅';
        googleBtn.title = 'Add to Google Calendar';
        googleBtn.style.background = '#4285f4';
        googleBtn.addEventListener('click', () => {
            if (this.googleAPI.gapiInited && gapi.client.getToken()) {
                this.googleAPI.exportToGoogleCalendar(todo);
            } else {
                this.showNotification('Please connect to Google Calendar first', 'error');
            }
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
        
        // Add buttons to actions container
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(googleBtn);
        actionsDiv.appendChild(deleteBtn);
        
        // Assemble todo element
        todoDiv.appendChild(titleDiv);
        todoDiv.appendChild(timeDiv);
        todoDiv.appendChild(descriptionDiv);
        
        if (linkDiv) {
            todoDiv.appendChild(linkDiv);
        }
        
        todoDiv.appendChild(actionsDiv);
        
        return todoDiv;
    }

    // Format URL to ensure it has proper protocol
    formatUrl(url) {
        if (!url) return '';
        
        // If URL doesn't start with http:// or https://, add https://
        if (!url.match(/^https?:\/\//)) {
            return 'https://' + url;
        }
        return url;
    }

    // Extract domain name from URL for display
    extractDomain(url) {
        if (!url) return '';
        
        try {
            const formattedUrl = this.formatUrl(url);
            const urlObj = new URL(formattedUrl);
            return urlObj.hostname;
        } catch (e) {
            // If URL parsing fails, return the original URL
            return url;
        }
    }

    // Delete a todo from the list
    async deleteTodo(todoId) {
        // For now, just use localStorage until server is set up
        this.todos = this.todos.filter(todo => todo.id !== todoId);
        await this.saveTodos();
        
        // Refresh views
        this.renderCalendar();
        this.renderTodos();
        
        // Cancel any scheduled notifications
        this.notifications = this.notifications.filter(n => n.todoId !== todoId);
    }

    // Save todos to JSON file
    saveToFile() {
        try {
            const dataStr = JSON.stringify(this.todos, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `calendar-todos-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            // Clean up
            URL.revokeObjectURL(link.href);
            
            this.showNotification('Data saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving file:', error);
            this.showNotification('Failed to save file', 'error');
        }
    }

    // Load todos from JSON file
    loadFromFile() {
        document.getElementById('fileInput').click();
    }

    // Handle file upload
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/json') {
            this.showNotification('Please select a JSON file', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!Array.isArray(data)) {
                    throw new Error('Invalid file format');
                }
                
                // Validate todo structure
                const isValid = data.every(todo => 
                    todo.id && todo.title && todo.date
                );
                
                if (!isValid) {
                    throw new Error('Invalid todo data');
                }
                
                // Ask for confirmation if there's existing data
                if (this.todos.length > 0) {
                    if (!confirm(`This will replace ${this.todos.length} existing todos. Continue?`)) {
                        return;
                    }
                }
                
                // Load the new data
                this.todos = data;
                this.saveTodos(); // Save to localStorage
                this.renderCalendar();
                this.renderTodos();
                
                this.showNotification(`Loaded ${data.length} todos successfully!`, 'success');
            } catch (error) {
                console.error('Error loading file:', error);
                this.showNotification('Failed to load file: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Create backup with timestamp
    createBackup() {
        try {
            const backupData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                totalTodos: this.todos.length,
                todos: this.todos
            };
            
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `calendar-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            link.click();
            
            URL.revokeObjectURL(link.href);
            
            this.showNotification('Backup created successfully!', 'success');
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showNotification('Failed to create backup', 'error');
        }
    }

    // Show notification message
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `app-notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = '#4caf50';
                break;
            case 'error':
                notification.style.background = '#f44336';
                break;
            default:
                notification.style.background = '#2196f3';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Get all todos for a specific date
    getTodosForDate(date) {
        if (!Array.isArray(this.todos)) {
            console.warn('this.todos is not an array:', this.todos);
            return [];
        }
        
        const dateString = date.toISOString().split('T')[0]; // Get date part only
        return this.todos.filter(todo => {
            const todoDate = new Date(todo.date).toISOString().split('T')[0];
            return todoDate === dateString;
        });
    }

    // Check if a date has any todos
    hasTodosOnDate(date) {
        return this.getTodosForDate(date).length > 0;
    }

    // Save todos to localStorage (reverted for immediate use)
    async saveTodos() {
        // For now, just save to localStorage until server is set up
        localStorage.setItem('calendarTodos', JSON.stringify(this.todos));
    }

    // Load todos from localStorage (reverted for immediate use)
    async loadTodos() {
        try {
            // For now, just use localStorage until server is set up
            const saved = localStorage.getItem('calendarTodos');
            const todos = saved ? JSON.parse(saved) : [];
            console.log('Loaded todos:', todos);
            return Array.isArray(todos) ? todos : [];
        } catch (error) {
            console.error('Error loading todos:', error);
            return [];
        }
    }

    // Request permission for browser notifications
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    // Schedule a notification for a todo
    scheduleNotification(todo) {
        // Don't schedule if notifications disabled or no time set
        if (!todo.enableNotification || !todo.time) return;
        
        // Calculate the todo date and time
        const todoDateTime = new Date(todo.date);
        const [hours, minutes] = todo.time.split(':');
        todoDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Calculate when to show notification (before the todo time)
        const notificationTime = new Date(todoDateTime.getTime() - todo.notificationMinutes * 60000);
        const now = new Date();
        
        // If notification time is in the past, show immediately
        if (notificationTime <= now) {
            this.showNotification(todo);
            return;
        }
        
        // Calculate timeout duration
        const timeoutId = notificationTime.getTime() - now.getTime();
        
        // Create and store notification timeout
        const notification = {
            todoId: todo.id,
            timeoutId: setTimeout(() => {
                this.showNotification(todo);
            }, timeoutId)
        };
        
        this.notifications.push(notification);
    }

    // Show a browser notification
    showNotification(todo) {
        // Check if notifications are supported and permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Calendar Todo Reminder', {
                body: `${todo.title} - ${todo.time || 'All day'}`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>',
                tag: `todo-${todo.id}`,           // Prevent duplicate notifications
                requireInteraction: true          // Keep notification until user interacts
            });
            
            // Focus window when notification is clicked
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }

    // Check for any notifications that should be scheduled or shown
    checkNotifications() {
        const now = new Date();
        
        // Check all todos for notifications
        this.todos.forEach(todo => {
            if (todo.enableNotification && todo.time) {
                // Calculate todo date and time
                const todoDateTime = new Date(todo.date);
                const [hours, minutes] = todo.time.split(':');
                todoDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                // Calculate notification time
                const notificationTime = new Date(todoDateTime.getTime() - todo.notificationMinutes * 60000);
                
                // If notification time just passed (within last minute), show now
                if (notificationTime <= now && notificationTime > new Date(now.getTime() - 60000)) {
                    this.showNotification(todo);
                } else if (notificationTime > now) {
                    // Schedule future notification
                    this.scheduleNotification(todo);
                }
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new CalendarTodoApp();
});