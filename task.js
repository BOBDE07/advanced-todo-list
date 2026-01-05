/* ============================================
   TO-DO LIST APPLICATION
   ============================================
   Architecture:
   - Storage module (localStorage)
   - TaskManager (business logic)
   - UI (DOM + events)
   ============================================ */


/* ============================================
   STORAGE MODULE
   ============================================ */
const Storage = {
    STORAGE_KEY: 'todoAppData',
    THEME_KEY: 'todoAppTheme',

    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },

    loadData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },

    saveTheme(theme) {
        localStorage.setItem(this.THEME_KEY, theme);
    },

    loadTheme() {
        return localStorage.getItem(this.THEME_KEY) || 'light';
    },

    initializeSampleData() {
        if (!this.loadData()) {
            const sampleTasks = [
                {
                    id: Date.now() + 1,
                    title: 'Welcome to your task list!',
                    completed: false,
                    priority: 'high',
                    dueDate: '',
                    dateCreated: Date.now()
                },
                {
                    id: Date.now() + 2,
                    title: 'Double-click a task to edit',
                    completed: false,
                    priority: 'medium',
                    dueDate: '',
                    dateCreated: Date.now() + 1
                }
            ];

            this.saveData({
                tasks: sampleTasks,
                filters: { status: 'all', priority: null },
                sortBy: 'custom'
            });
        }
    }
};


/* ============================================
   TASK MANAGER
   ============================================ */
class TaskManager {
    constructor() {
        const data = Storage.loadData();
        this.tasks = data?.tasks || [];
        this.filters = data?.filters || { status: 'all', priority: null };
        this.sortBy = data?.sortBy || 'custom';
        this.searchQuery = '';
    }

    save() {
        Storage.saveData({
            tasks: this.tasks,
            filters: this.filters,
            sortBy: this.sortBy
        });
    }

    addTask(title, dueDate, priority) {
        if (!title.trim()) {
            return { success: false, error: 'Task title cannot be empty' };
        }

        this.tasks.push({
            id: Date.now(),
            title: title.trim(),
            completed: false,
            priority,
            dueDate,
            dateCreated: Date.now()
        });

        this.save();
        return { success: true };
    }

    removeTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) task.completed = !task.completed;
        this.save();
    }

    setSearchQuery(query) {
        this.searchQuery = query;
    }

    setSortBy(sortBy) {
        this.sortBy = sortBy;
        this.save();
    }

    setFilter(type, value) {
        if (type === 'status') this.filters.status = value;
        if (type === 'priority')
            this.filters.priority =
                this.filters.priority === value ? null : value;

        this.save();
    }

    getFilteredTasks() {
        let list = [...this.tasks];

        if (this.searchQuery) {
            list = list.filter(t =>
                t.title.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }

        if (this.filters.status === 'active')
            list = list.filter(t => !t.completed);
        if (this.filters.status === 'completed')
            list = list.filter(t => t.completed);

        if (this.filters.priority)
            list = list.filter(t => t.priority === this.filters.priority);

        if (this.sortBy === 'dateCreated')
            list.sort((a, b) => b.dateCreated - a.dateCreated);

        if (this.sortBy === 'priority') {
            const order = { high: 0, medium: 1, low: 2 };
            list.sort((a, b) => order[a.priority] - order[b.priority]);
        }

        return list;
    }
}


/* ============================================
   UI CLASS
   ============================================ */
class UI {
    constructor(manager) {
        this.manager = manager;

        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.taskInput = document.getElementById('taskInput');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.priorityInput = document.getElementById('priorityInput');
        this.addBtn = document.getElementById('addTaskBtn');
        this.errorBox = document.getElementById('taskError');
        this.searchInput = document.getElementById('searchInput');
        this.sortSelect = document.getElementById('sortSelect');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');

        this.initTheme();
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTask());

        this.searchInput.addEventListener('input', e => {
            this.manager.setSearchQuery(e.target.value);
            this.render();
        });

        this.sortSelect.addEventListener('change', e => {
            this.manager.setSortBy(e.target.value);
            this.render();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', e => this.handleFilter(e));
        });

        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    addTask() {
        const result = this.manager.addTask(
            this.taskInput.value,
            this.dueDateInput.value,
            this.priorityInput.value
        );

        if (!result.success) {
            this.showError(result.error);
            return;
        }

        this.taskInput.value = '';
        this.dueDateInput.value = '';
        this.priorityInput.value = 'medium';
        this.hideError();
        this.render();
    }

    handleFilter(e) {
        const filter = e.target.dataset.filter;

        if (filter.startsWith('priority-')) {
            this.manager.setFilter('priority', filter.replace('priority-', ''));
            e.target.classList.toggle('active');
        } else {
            this.manager.setFilter('status', filter);
            document
                .querySelectorAll('[data-filter="all"],[data-filter="active"],[data-filter="completed"]')
                .forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        }

        this.render();
    }

    render() {
        const tasks = this.manager.getFilteredTasks();
        this.taskList.innerHTML = '';

        if (!tasks.length) {
            this.emptyState.style.display = 'block';
            return;
        }

        this.emptyState.style.display = 'none';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;

            li.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span>${task.title}</span>
                <button class="icon-btn delete">🗑</button>
            `;

            li.querySelector('input').addEventListener('change', () => {
                this.manager.toggleTask(task.id);
                this.render();
            });

            li.querySelector('.delete').addEventListener('click', () => {
                this.manager.removeTask(task.id);
                this.render();
            });

            this.taskList.appendChild(li);
        });
    }

    showError(msg) {
        this.errorBox.textContent = msg;
        this.errorBox.classList.add('show');
        setTimeout(() => this.hideError(), 3000);
    }

    hideError() {
        this.errorBox.classList.remove('show');
    }

    initTheme() {
        const theme = Storage.loadTheme();
        document.documentElement.setAttribute('data-theme', theme);
        this.themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        this.themeIcon.textContent = next === 'light' ? '🌙' : '☀️';
        Storage.saveTheme(next);
    }
}


/* ============================================
   APP START
   ============================================ */
Storage.initializeSampleData();
const taskManager = new TaskManager();
new UI(taskManager);
