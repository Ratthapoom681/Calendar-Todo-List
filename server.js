const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FOLDER = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files (HTML, CSS, JS)

// Ensure data folder exists
fs.ensureDirSync(DATA_FOLDER);

// Data file path
const TODOS_FILE = path.join(DATA_FOLDER, 'todos.json');

// Helper functions for file operations
async function loadTodos() {
    try {
        if (await fs.pathExists(TODOS_FILE)) {
            const data = await fs.readJson(TODOS_FILE);
            return data;
        }
        return [];
    } catch (error) {
        console.error('Error loading todos:', error);
        return [];
    }
}

async function saveTodos(todos) {
    try {
        await fs.writeJson(TODOS_FILE, todos, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('Error saving todos:', error);
        return false;
    }
}

// API Routes

// Get all todos
app.get('/api/todos', async (req, res) => {
    try {
        const todos = await loadTodos();
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load todos' });
    }
});

// Add new todo
app.post('/api/todos', async (req, res) => {
    try {
        const todos = await loadTodos();
        const newTodo = {
            id: Date.now(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        todos.push(newTodo);
        const saved = await saveTodos(todos);
        
        if (saved) {
            res.json(newTodo);
        } else {
            res.status(500).json({ error: 'Failed to save todo' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to add todo' });
    }
});

// Update todo
app.put('/api/todos/:id', async (req, res) => {
    try {
        const todos = await loadTodos();
        const todoIndex = todos.findIndex(todo => todo.id === parseInt(req.params.id));
        
        if (todoIndex === -1) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        todos[todoIndex] = { ...todos[todoIndex], ...req.body };
        const saved = await saveTodos(todos);
        
        if (saved) {
            res.json(todos[todoIndex]);
        } else {
            res.status(500).json({ error: 'Failed to update todo' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

// Delete todo
app.delete('/api/todos/:id', async (req, res) => {
    try {
        const todos = await loadTodos();
        const filteredTodos = todos.filter(todo => todo.id !== parseInt(req.params.id));
        
        if (filteredTodos.length === todos.length) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        const saved = await saveTodos(filteredTodos);
        
        if (saved) {
            res.json({ message: 'Todo deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete todo' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

// Backup todos (create timestamped backup)
app.post('/api/todos/backup', async (req, res) => {
    try {
        const todos = await loadTodos();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(DATA_FOLDER, `todos-backup-${timestamp}.json`);
        
        await fs.writeJson(backupFile, todos, { spaces: 2 });
        res.json({ message: 'Backup created', file: backupFile });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// Get list of backup files
app.get('/api/todos/backups', async (req, res) => {
    try {
        const files = await fs.readdir(DATA_FOLDER);
        const backupFiles = files
            .filter(file => file.startsWith('todos-backup-') && file.endsWith('.json'))
            .map(file => ({
                filename: file,
                path: path.join(DATA_FOLDER, file),
                createdAt: fs.statSync(path.join(DATA_FOLDER, file)).birthtime
            }));
        
        res.json(backupFiles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get backups' });
    }
});

// Restore from backup
app.post('/api/todos/restore/:filename', async (req, res) => {
    try {
        const backupFile = path.join(DATA_FOLDER, req.params.filename);
        
        if (!await fs.pathExists(backupFile)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }
        
        const todos = await fs.readJson(backupFile);
        const saved = await saveTodos(todos);
        
        if (saved) {
            res.json({ message: 'Todos restored from backup', count: todos.length });
        } else {
            res.status(500).json({ error: 'Failed to restore todos' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to restore todos' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`📅 Calendar Todo Server running on http://localhost:${PORT}`);
    console.log(`📁 Data folder: ${DATA_FOLDER}`);
    console.log(`💾 Todos file: ${TODOS_FILE}`);
    console.log('\n🚀 To start the app:');
    console.log('1. Open your browser');
    console.log('2. Go to http://localhost:3000');
    console.log('3. Your data will be saved in the /data folder');
});