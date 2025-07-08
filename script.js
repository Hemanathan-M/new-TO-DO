class TaskManager {
    constructor() {
        this.tasks = [];
        this.editingTaskId = null;
        this.taskInput = document.getElementById('taskInput');
        this.addButton = document.getElementById('addButton');
        this.tasksContainer = document.getElementById('tasksContainer');
        this.backgroundUpload = document.getElementById('backgroundUpload');
        
        this.init();
    }

    init() {
        // Event listeners
        this.addButton.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Background upload listener
        if (this.backgroundUpload) {
            this.backgroundUpload.addEventListener('change', (e) => this.handleBackgroundUpload(e));
        }

        // Load tasks and background from localStorage
        this.loadTasks();
        this.loadBackground();
        this.renderTasks();

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to add task from anywhere
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.taskInput.focus();
            }
            
            // Escape to cancel editing
            if (e.key === 'Escape' && this.editingTaskId) {
                this.editingTaskId = null;
                this.renderTasks();
            }
        });
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        
        if (taskText) {
            const task = {
                id: Date.now(),
                text: taskText,
                createdAt: new Date().toISOString(),
                completed: false
            };
            
            this.tasks.push(task);
            this.taskInput.value = '';
            this.saveTasks();
            this.renderTasks();
            
            // Show success feedback
            this.showFeedback('Task added successfully!', 'success');
        } else {
            this.showFeedback('Please enter a task!', 'error');
        }
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const deletedTask = this.tasks[taskIndex];
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            this.renderTasks();
            
            // Show success feedback with undo option
            this.showFeedback(`Task "${deletedTask.text}" deleted!`, 'success');
        }
    }

    toggleEdit(taskId) {
        if (this.editingTaskId === taskId) {
            // Save the edit
            this.saveEdit(taskId);
        } else {
            // Start editing
            this.editingTaskId = taskId;
            this.renderTasks();
            
            // Focus on the input
            setTimeout(() => {
                const taskInput = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskInput) {
                    taskInput.focus();
                    taskInput.select();
                }
            }, 100);
        }
    }

    saveEdit(taskId) {
        const taskInput = document.querySelector(`[data-task-id="${taskId}"]`);
        const newText = taskInput.value.trim();
        
        if (newText) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                const oldText = task.text;
                task.text = newText;
                task.updatedAt = new Date().toISOString();
                this.saveTasks();
                this.showFeedback('Task updated successfully!', 'success');
            }
        } else {
            this.showFeedback('Task cannot be empty!', 'error');
            return;
        }
        
        this.editingTaskId = null;
        this.renderTasks();
    }
toggleComplete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        this.saveTasks();
        this.renderTasks();
        
        // Show feedback
        const status = task.completed ? 'completed' : 'incomplete';
        this.showFeedback(`Task marked as ${status}!`, 'success');
    }
}
    handleBackgroundUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showFeedback('Image too large! Please choose an image under 5MB.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                this.setBackground(imageUrl);
                this.saveBackground(imageUrl);
                this.showFeedback('Background updated!', 'success');
            };
            reader.onerror = () => {
                this.showFeedback('Error loading image!', 'error');
            };
            reader.readAsDataURL(file);
        } else {
            this.showFeedback('Please select a valid image file!', 'error');
        }
    }

    setBackground(imageUrl) {
        document.body.style.backgroundImage = `url(${imageUrl})`;
    }

    resetBackground() {
        document.body.style.backgroundImage = "url('/placeholder.svg?height=1080&width=1920')";
        localStorage.removeItem('backgroundImage');
        this.showFeedback('Background reset to default!', 'success');
    }

    saveBackground(imageUrl) {
        try {
            localStorage.setItem('backgroundImage', imageUrl);
        } catch (e) {
            console.error('Error saving background:', e);
            this.showFeedback('Error saving background!', 'error');
        }
    }

    loadBackground() {
        try {
            const savedBackground = localStorage.getItem('backgroundImage');
            if (savedBackground) {
                this.setBackground(savedBackground);
            }
        } catch (e) {
            console.error('Error loading background:', e);
        }
    }

    showFeedback(message, type = 'info') {
        // Remove existing feedback
        const existingFeedback = document.querySelector('.feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = `feedback feedback-${type}`;
        feedback.textContent = message;
        
        // Add styles
        feedback.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background-color: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 
                              type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                              'rgba(59, 130, 246, 0.9)'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1001;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideDown 0.3s ease-out;
        `;

        // Add animation keyframes
        if (!document.querySelector('#feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'feedback-styles';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(feedback);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.style.animation = 'slideDown 0.3s ease-out reverse';
                setTimeout(() => feedback.remove(), 300);
            }
        }, 3000);
    }

    renderTasks() {
        this.tasksContainer.innerHTML = '';
        
        if (this.tasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <div style="
                    text-align: center;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 16px;
                    padding: 40px 20px;
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                ">
                    📝 No tasks yet. Add your first task above!
                </div>
            `;
            this.tasksContainer.appendChild(emptyState);
            return;
        }
        
        this.tasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            
            const isEditing = this.editingTaskId === task.id;
            
            taskElement.innerHTML = `
    <div class="task-content">
        <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.completed ? 'checked' : ''}
            onchange="taskManager.toggleComplete(${task.id})"
            title="Mark as ${task.completed ? 'incomplete' : 'complete'}"
        >
        <div class="task-text-wrapper">
            <input 
                type="text" 
                class="task-text" 
                value="${this.escapeHtml(task.text)}"
                data-task-id="${task.id}"
                ${isEditing ? '' : 'readonly'}
                onkeypress="if(event.key==='Enter') taskManager.saveEdit(${task.id})"
                onkeydown="if(event.key==='Escape') { taskManager.editingTaskId = null; taskManager.renderTasks(); }"
            >
        </div>
    </div>
    <div class="task-buttons">
        <button class="task-button delete-button" onclick="taskManager.deleteTask(${task.id})" title="Delete task">
            Delete
        </button>
        <button class="task-button edit-button ${isEditing ? 'editing' : ''}" onclick="taskManager.toggleEdit(${task.id})" title="${isEditing ? 'Save changes' : 'Edit task'}">
            ${isEditing ? 'Save' : 'Edit'}
        </button>
    </div>
`;

// Add completed class if task is completed
if (task.completed) {
    taskElement.classList.add('completed');
}
            
            this.tasksContainer.appendChild(taskElement);
        });
    }

    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.error('Error saving tasks:', e);
            this.showFeedback('Error saving tasks!', 'error');
        }
    }

    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                // Ensure all tasks have required properties
                this.tasks = this.tasks.map(task => ({
                    id: task.id || Date.now(),
                    text: task.text || '',
                    createdAt: task.createdAt || new Date().toISOString(),
                    updatedAt: task.updatedAt || null,
                    completed: task.completed || false
                }));
            }
        } catch (e) {
            console.error('Error loading tasks:', e);
            this.tasks = [];
            this.showFeedback('Error loading saved tasks!', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export tasks as JSON
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.showFeedback('Tasks exported successfully!', 'success');
    }

    // Clear all tasks
    clearAllTasks() {
        if (this.tasks.length === 0) {
            this.showFeedback('No tasks to clear!', 'info');
            return;
        }
        
        if (confirm(`Are you sure you want to delete all ${this.tasks.length} tasks? This cannot be undone.`)) {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.showFeedback('All tasks cleared!', 'success');
        }
    }
}

// Initialize the task manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});

// Add global keyboard shortcuts info
document.addEventListener('keydown', (e) => {
    // Show help with Ctrl/Cmd + ?
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        alert(`Keyboard Shortcuts:
        
• Enter: Add new task
• Ctrl/Cmd + Enter: Focus input field
• Escape: Cancel editing
• Ctrl/Cmd + /: Show this help

Tips:
• Tasks are automatically saved
• Upload custom backgrounds
• Click Edit to modify tasks
• All data persists between sessions`);
    }
});