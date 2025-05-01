// app.js - Main JavaScript file for Student Planner

// Wait for DOM to be fully loaded before executing code
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    StorageManager.initializeDataIfNeeded();
    
    // Set current date in header
    DateUtils.setCurrentDate();
    
    // Determine current page and initialize appropriate functionality
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'index':
            renderHomePage();
            break;
        case 'tasks':
            renderTasksPage();
            break;
        case 'new-task':
            initNewTaskForm();
            break;
        case 'notes':
            renderNotesPage();
            break;
        case 'new-note':
            initNewNoteForm();
            break;
        case 'view-note':
            renderViewNotePage();
            break;
        case 'history':
            renderHistoryPage();
            break;
    }
    
    // Highlight active navigation tab
    highlightActiveTab(currentPage);
});

// ====================
// STORAGE MANAGEMENT
// ====================

const StorageManager = {
    // Save data to localStorage with the given key
    saveData: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    // Retrieve data from localStorage by key
    getData: function(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    
    // Initialize default data structure if none exists
    initializeDataIfNeeded: function() {
        if (!this.getData('tasks')) {
            this.saveData('tasks', []);
        }
        if (!this.getData('notes')) {
            this.saveData('notes', []);
        }
    }
};

// ====================
// TASK MANAGEMENT
// ====================

const TaskManager = {
    // Generate a unique ID for new tasks
    generateTaskId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },
    
    // Create a new task
    createTask: function(name, description, deadline, deadlineTime, priority) {
        const tasks = StorageManager.getData('tasks') || [];
        
        // Combine date and time for full deadline
        let fullDeadline = deadline;
        if (deadlineTime) {
            fullDeadline = `${deadline}T${deadlineTime}`;
        } else {
            // Default to end of day if no time specified
            fullDeadline = `${deadline}T23:59:00`;
        }
        
        const newTask = {
            id: this.generateTaskId(),
            name: name,
            description: description,
            deadline: deadline,
            deadlineTime: deadlineTime || "23:59",
            fullDeadline: fullDeadline,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        tasks.push(newTask);
        StorageManager.saveData('tasks', tasks);
        return newTask;
    },
    
    // Get all tasks
    getAllTasks: function() {
        return StorageManager.getData('tasks') || [];
    },
    
    // Get active (incomplete) tasks
    getActiveTasks: function() {
        const tasks = this.getAllTasks();
        return tasks.filter(task => !task.completed);
    },
    
    // Get completed tasks
    getCompletedTasks: function() {
        const tasks = this.getAllTasks();
        return tasks.filter(task => task.completed);
    },
    
    // Get today's tasks
    getTodayTasks: function() {
        const tasks = this.getActiveTasks();
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task => task.deadline === today);
    },
    
    // Mark a task as complete
    completeTask: function(taskId) {
        const tasks = this.getAllTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = true;
            tasks[taskIndex].completedAt = new Date().toISOString();
            StorageManager.saveData('tasks', tasks);
            return true;
        }
        return false;
    },
    
    // Update task details
    updateTask: function(taskId, updatedData) {
        const tasks = this.getAllTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...updatedData };
            StorageManager.saveData('tasks', tasks);
            return true;
        }
        return false;
    },
    
    // Delete a task
    deleteTask: function(taskId) {
        const tasks = this.getAllTasks();
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        
        if (updatedTasks.length < tasks.length) {
            StorageManager.saveData('tasks', updatedTasks);
            return true;
        }
        return false;
    },
    
    // Sort tasks by priority and deadline
    sortTasks: function(tasks) {
        return tasks.sort((a, b) => {
            // Sort by priority first (high > low)
            if (a.priority === 'high' && b.priority === 'low') return -1;
            if (a.priority === 'low' && b.priority === 'high') return 1;
            
            // Then sort by deadline with time
            return new Date(a.fullDeadline) - new Date(b.fullDeadline);
        });
    },
    
    // Check if a task is overdue
    isTaskOverdue: function(task) {
        if (task.completed) return false;
        
        const now = new Date();
        const deadline = new Date(task.fullDeadline);
        
        return deadline < now;
    },

    clearCompletedTasks: function() {
        const tasks = this.getAllTasks();
        const activeTasks = tasks.filter(task => !task.completed);
        StorageManager.saveData('tasks', activeTasks);
        return activeTasks.length !== tasks.length; // Return true if any tasks were removed
    },
};

// ====================
// NOTE MANAGEMENT
// ====================

const NoteManager = {
    // Generate a unique ID for new notes
    generateNoteId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },
    
    // Create a new note
    createNote: function(title, content) {
        const notes = StorageManager.getData('notes') || [];
        
        const newNote = {
            id: this.generateNoteId(),
            title: title,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        notes.push(newNote);
        StorageManager.saveData('notes', notes);
        return newNote;
    },
    
    // Get all notes
    getAllNotes: function() {
        return StorageManager.getData('notes') || [];
    },
    
    // Get a specific note by ID
    getNoteById: function(noteId) {
        const notes = this.getAllNotes();
        return notes.find(note => note.id === noteId);
    },
    
    // Update note content
    updateNote: function(noteId, title, content) {
        const notes = this.getAllNotes();
        const noteIndex = notes.findIndex(note => note.id === noteId);
        
        if (noteIndex !== -1) {
            notes[noteIndex].title = title;
            notes[noteIndex].content = content;
            notes[noteIndex].updatedAt = new Date().toISOString();
            StorageManager.saveData('notes', notes);
            return true;
        }
        return false;
    },
    
    // Delete a note
    deleteNote: function(noteId) {
        const notes = this.getAllNotes();
        const updatedNotes = notes.filter(note => note.id !== noteId);
        
        if (updatedNotes.length < notes.length) {
            StorageManager.saveData('notes', updatedNotes);
            return true;
        }
        return false;
    }
};

// ====================
// DATE UTILITIES
// ====================

const DateUtils = {
    // Set the current date in the header of all pages
    setCurrentDate: function() {
        const dateElements = document.querySelectorAll('header p');
        if (dateElements.length > 0) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = new Date().toLocaleDateString('en-US', options);
            
            dateElements.forEach(element => {
                element.textContent = formattedDate;
            });
        }
    },
    
    // Format a date for display
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    },
    
    // Format time for display
    formatTime: function(timeString) {
        if (!timeString) return '';
        
        try {
            // Convert 24-hour format to 12-hour format
            const [hours, minutes] = timeString.split(':');
            const h = parseInt(hours, 10);
            const isPM = h >= 12;
            const displayHours = h > 12 ? h - 12 : (h === 0 ? 12 : h);
            return `${displayHours}:${minutes} ${isPM ? 'PM' : 'AM'}`;
        } catch (e) {
            return timeString;
        }
    },
    
    // Format full deadline with date and time
    formatFullDeadline: function(task) {
        const deadlineDate = this.formatDeadlineRelative(task.deadline);
        const deadlineTime = this.formatTime(task.deadlineTime);
        
        return `${deadlineDate}, ${deadlineTime}`;
    },
    
    // Format deadline with relative time
    formatDeadlineRelative: function(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const deadline = new Date(dateString);
        deadline.setHours(0, 0, 0, 0);
        
        if (deadline.getTime() === today.getTime()) return 'Today';
        if (deadline.getTime() === tomorrow.getTime()) return 'Tomorrow';
        
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
        if (diffDays >= 7 && diffDays < 14) return 'Next week';
        if (diffDays >= 14) return this.formatDate(dateString);
        
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;
        
        return this.formatDate(dateString);
    }
};

// ====================
// PAGE RENDERING
// ====================

// Helper function to get current page
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path.endsWith('/')) return 'index';
    if (path.includes('tasks.html')) return 'tasks';
    if (path.includes('new-task.html')) return 'new-task';
    if (path.includes('notes.html')) return 'notes';
    if (path.includes('new-note.html')) return 'new-note';
    if (path.includes('view-note.html')) return 'view-note';
    if (path.includes('history.html')) return 'history';
    return 'index'; // Default to home page
}

// Highlight the active tab in navigation
function highlightActiveTab(currentPage) {
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if ((currentPage === 'index' && href === 'index.html') ||
            (currentPage === 'tasks' && href === 'tasks.html') ||
            (currentPage === 'new-task' && href === 'tasks.html') ||
            (currentPage === 'notes' && href === 'notes.html') ||
            (currentPage === 'new-note' && href === 'notes.html') ||
            (currentPage === 'view-note' && href === 'notes.html') ||
            (currentPage === 'history' && href === 'history.html')) {
            link.classList.add('active');
        }
    });
}

// Render the home page with today's tasks
function renderHomePage() {
    const todayTasksContainer = document.querySelector('.today-tasks');
    if (!todayTasksContainer) return;
    
    const todayTasks = TaskManager.getTodayTasks();
    const sortedTasks = TaskManager.sortTasks(todayTasks);
    
    let html = '<h2>Today\'s Tasks</h2>';
    
    if (sortedTasks.length === 0) {
        html += `
            <div class="relax-message">
                <p>No tasks for today - Time to relax! 😎</p>
            </div>
        `;
    } else {
        sortedTasks.forEach(task => {
            const isOverdue = TaskManager.isTaskOverdue(task);
            const overdueClass = isOverdue ? 'overdue' : '';
            
            html += `
                <div class="task-item ${overdueClass}" data-task-id="${task.id}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <div class="task-title">${task.name}</div>
                        <div class="task-description">${task.description}</div>
                        <div class="task-meta">
                            <div class="task-deadline">Due: Today, ${DateUtils.formatTime(task.deadlineTime)}</div>
                            <div class="task-priority priority-${task.priority}">${task.priority === 'high' ? 'High' : 'Low'} Priority</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    todayTasksContainer.innerHTML = html;
    
    // Add event listeners to task checkboxes
    addTaskCheckboxListeners();
}

// Render the tasks page with all tasks
function renderTasksPage() {
    const tasksContainer = document.querySelector('.tasks-container');
    if (!tasksContainer) return;
    
    const activeTasks = TaskManager.getActiveTasks();
    const sortedTasks = TaskManager.sortTasks(activeTasks);
    
    let html = '<h2>All Tasks</h2>';
    
    if (sortedTasks.length === 0) {
        html += `
            <div class="no-tasks-message">
                <p>No tasks available. Click the + button to add a new task.</p>
            </div>
        `;
    } else {
        sortedTasks.forEach(task => {
            const isOverdue = TaskManager.isTaskOverdue(task);
            const overdueClass = isOverdue ? 'overdue' : '';
            
            html += `
                <div class="task-item ${overdueClass}" data-task-id="${task.id}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <div class="task-title">${task.name}</div>
                        <div class="task-description">${task.description}</div>
                        <div class="task-meta">
                            <div class="task-deadline">Due: ${DateUtils.formatDeadlineRelative(task.deadline)}, ${DateUtils.formatTime(task.deadlineTime)}</div>
                            <div class="task-priority priority-${task.priority}">${task.priority === 'high' ? 'High' : 'Low'} Priority</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    tasksContainer.innerHTML = html;
    
    // Add event listeners to task checkboxes
    addTaskCheckboxListeners();
}

// Initialize new task form
function initNewTaskForm() {
    const form = document.querySelector('.form-container form');
    if (!form) return;
    
    // Add time input field if it doesn't exist
    const deadlineGroup = document.getElementById('task-deadline').closest('.form-group');
    const timeInputExists = document.getElementById('task-time');
    
    if (!timeInputExists && deadlineGroup) {
        const timeGroup = document.createElement('div');
        timeGroup.className = 'form-group';
        timeGroup.innerHTML = `
            <label for="task-time">Time *</label>
            <input type="time" id="task-time" name="task-time" required>
        `;
        
        // Insert after deadline group
        deadlineGroup.parentNode.insertBefore(timeGroup, deadlineGroup.nextSibling);
    }
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Get form values
        const taskName = document.getElementById('task-name').value.trim();
        const taskDescription = document.getElementById('task-description').value.trim();
        const taskDeadline = document.getElementById('task-deadline').value;
        const taskTime = document.getElementById('task-time').value;
        const taskPriority = document.getElementById('task-priority').value;
        
        // Validate form
        if (!taskName) {
            alert('Please enter a task name');
            return;
        }
        
        if (!taskDeadline) {
            alert('Please select a deadline date');
            return;
        }
        
        if (!taskTime) {
            alert('Please select a deadline time');
            return;
        }
        
        // Create the task
        TaskManager.createTask(taskName, taskDescription, taskDeadline, taskTime, taskPriority);
        
        // Redirect to tasks page
        window.location.href = 'tasks.html';
    });
}

// Render the notes page with all notes
function renderNotesPage() {
    const notesContainer = document.querySelector('.notes-container');
    if (!notesContainer) return;
    
    const notes = NoteManager.getAllNotes();
    
    let html = '';
    
    if (notes.length === 0) {
        html = `
            <div class="no-notes-message">
                <p>No notes available. Click the + button to add a new note.</p>
            </div>
        `;
    } else {
        notes.forEach(note => {
            // Truncate content for preview
            const truncatedContent = note.content.length > 100 
                ? note.content.substring(0, 100) + '...' 
                : note.content;
                
            html += `
                <div class="note-card" data-note-id="${note.id}">
                    <div class="note-title">${note.title}</div>
                    <div class="note-content">${truncatedContent}</div>
                </div>
            `;
        });
    }
    
    notesContainer.innerHTML = html;
    
    // Add event listeners to note cards
    const noteCards = document.querySelectorAll('.note-card');
    noteCards.forEach(card => {
        card.addEventListener('click', function() {
            const noteId = this.getAttribute('data-note-id');
            window.location.href = `view-note.html?id=${noteId}`;
        });
    });
}

// Initialize new note form
function initNewNoteForm() {
    const form = document.querySelector('.note-editor form');
    if (!form) return;
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Get form values
        const noteTitle = document.querySelector('.note-editor-title').value.trim();
        const noteContent = document.querySelector('.note-editor-content').value.trim();
        
        // Validate form
        if (!noteTitle) {
            alert('Please enter a note title');
            return;
        }
        
        // Create the note
        NoteManager.createNote(noteTitle, noteContent);
        
        // Redirect to notes page
        window.location.href = 'notes.html';
    });
}

// Render the view note page
function renderViewNotePage() {
    // Get note ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');
    
    if (!noteId) {
        window.location.href = 'notes.html';
        return;
    }
    
    // Get note by ID
    const note = NoteManager.getNoteById(noteId);
    
    if (!note) {
        window.location.href = 'notes.html';
        return;
    }
    
    // Update note details in the view
    const noteTitle = document.querySelector('.note-title');
    const noteDate = document.querySelector('.note-date');
    const noteContent = document.querySelector('.note-content');
    
    if (noteTitle) noteTitle.textContent = note.title;
    if (noteDate) noteDate.textContent = `Created: ${DateUtils.formatDate(note.createdAt)}`;
    if (noteContent) noteContent.innerHTML = formatNoteContent(note.content);
    
    // Set up edit button event handler
    const editButton = document.querySelector('.edit-btn');
    if (editButton) {
        editButton.href = `edit-note.html?id=${noteId}`;
    }
    // Set up delete button event handler
    const deleteButton = document.getElementById('delete-note-btn');
    if (deleteButton) {
        const modal = document.getElementById('delete-confirmation-modal');
        const cancelBtn = document.getElementById('cancel-delete');
        const confirmBtn = document.getElementById('confirm-delete');
        
        // Show modal when delete button is clicked
        deleteButton.addEventListener('click', function() {
            modal.style.display = 'block';
        });
        
        // Hide modal when cancel is clicked
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Delete note when confirm is clicked
        confirmBtn.addEventListener('click', function() {
            const deleted = NoteManager.deleteNote(noteId);
            if (deleted) {
                window.location.href = 'notes.html';
            } else {
                alert('Failed to delete note. Please try again.');
                modal.style.display = 'none';
            }
        });
        
        // Close modal when clicking outside of it
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

}

// Format note content for display (convert line breaks to paragraphs)
function formatNoteContent(content) {
    return content.split('\n\n')
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('');
}

// Render the history page with completed tasks
function renderHistoryPage() {
    const historyContainer = document.querySelector('.history-container');
    if (!historyContainer) return;
    
    const completedTasks = TaskManager.getCompletedTasks();
    
    // Sort by completion date (most recent first)
    const sortedTasks = completedTasks.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
    );
    
    let html = '<h2>Completed Tasks</h2>';
    
    if (sortedTasks.length === 0) {
        html += `
            <div class="no-tasks-message">
                <p>No completed tasks yet.</p>
            </div>
        `;
    } else {
        sortedTasks.forEach(task => {
            const completedDate = DateUtils.formatDate(task.completedAt);
            
            html += `
                <div class="task-item">
                    <input type="checkbox" class="task-checkbox" checked disabled>
                    <div class="task-content completed-task">
                        <div class="task-title">${task.name}</div>
                        <div class="task-description">${task.description}</div>
                        <div class="task-meta">
                            <div class="task-deadline">Completed: ${completedDate}</div>
                            <div class="task-priority">${task.priority === 'high' ? 'High' : 'Low'} Priority</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    historyContainer.innerHTML = html;
}

// Add event listeners to task checkboxes
function addTaskCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskItem = this.closest('.task-item');
            const taskId = taskItem.getAttribute('data-task-id');
            
            if (this.checked) {
                // Mark task as complete
                TaskManager.completeTask(taskId);
                
                // Add visual feedback
                taskItem.classList.add('completed');
                
                // Reload page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        });
    });
}

// Additional CSS styles for overdue tasks
function addCustomStyles() {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        .task-item.overdue .task-deadline {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .task-item.completed .task-content {
            text-decoration: line-through;
            color: #7f8c8d;
        }
    `;
    document.head.appendChild(styleEl);
}

// Function to handle clearing history
function clearTaskHistory() {
    // Display confirmation dialog
    if (confirm("Are you sure you want to clear all completed tasks? This action cannot be undone.")) {
        // Clear completed tasks from storage
        const result = TaskManager.clearCompletedTasks();
        
        if (result) {
            // If tasks were cleared, reload the page to reflect changes
            window.location.reload();
        } else {
            alert("No completed tasks to clear.");
        }
    }
}

// Add the event listener for the clear history button
function initClearHistoryButton() {
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearTaskHistory);
    }
}

// Update the renderHistoryPage function to initialize the clear button
function renderHistoryPage() {
    const historyContainer = document.querySelector('.history-container');
    if (!historyContainer) return;
    
    const completedTasks = TaskManager.getCompletedTasks();
    
    // Sort by completion date (most recent first)
    const sortedTasks = completedTasks.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
    );
    
    let html = '<h2>Completed Tasks</h2>';
    
    if (sortedTasks.length === 0) {
        html += `
            <div class="no-tasks-message">
                <p>No completed tasks yet.</p>
            </div>
        `;
    } else {
        html += `
            <div class="history-actions">
                <button id="clear-history-btn" class="clear-history-btn">Clear History</button>
            </div>
        `;
        
        sortedTasks.forEach(task => {
            const completedDate = DateUtils.formatDate(task.completedAt);
            
            html += `
                <div class="task-item">
                    <input type="checkbox" class="task-checkbox" checked disabled>
                    <div class="task-content completed-task">
                        <div class="task-title">${task.name}</div>
                        <div class="task-description">${task.description}</div>
                        <div class="task-meta">
                            <div class="task-deadline">Completed: ${completedDate}</div>
                            <div class="task-priority">${task.priority === 'high' ? 'High' : 'Low'} Priority</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    historyContainer.innerHTML = html;
    
    // Initialize the clear history button
    initClearHistoryButton();
}

// Add custom styles when page loads
document.addEventListener('DOMContentLoaded', addCustomStyles);