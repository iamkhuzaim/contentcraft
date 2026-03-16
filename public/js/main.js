/**
 * ContentCraft - Main JavaScript
 * Core functionality for the application
 */

const API_BASE_URL = '';

// Toast Notification System
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'success', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// Authentication Module
const Auth = {
    TOKEN_KEY: 'contentcraft_token',
    USER_KEY: 'contentcraft_user',
    
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },
    
    getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    },
    
    setAuth(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.updateUI();
    },
    
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.updateUI();
    },
    
    isLoggedIn() {
        return !!this.getToken();
    },
    
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },
    
    updateUI() {
        const authLinks = document.getElementById('auth-links');
        const userMenu = document.getElementById('user-menu');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (!authLinks || !userMenu) return;
        
        if (this.isLoggedIn()) {
            const user = this.getUser();
            authLinks.style.display = 'none';
            userMenu.style.display = 'block';
            
            if (userName) userName.textContent = user.name;
            if (userAvatar) {
                if (user.avatar_url) {
                    userAvatar.src = user.avatar_url;
                    userAvatar.onerror = () => {
                        userAvatar.src = Avatar.generate(user.name);
                    };
                } else {
                    userAvatar.src = Avatar.generate(user.name);
                }
            }
            
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = this.isAdmin() ? 'flex' : 'none';
            });
        } else {
            authLinks.style.display = 'flex';
            userMenu.style.display = 'none';
        }
    },
    
    async logout() {
        this.clearAuth();
        Toast.success('Logged out successfully');
        setTimeout(() => window.location.href = '/', 1000);
    },
    
    requireAuth() {
        if (!this.isLoggedIn()) {
            Toast.warning('Please login to continue');
            setTimeout(() => window.location.href = '/login', 1500);
            return false;
        }
        return true;
    },
    
    requireAdmin() {
        if (!this.isLoggedIn()) {
            Toast.warning('Please login to continue');
            setTimeout(() => window.location.href = '/login', 1500);
            return false;
        }
        if (!this.isAdmin()) {
            Toast.error('Admin access required');
            setTimeout(() => window.location.href = '/', 1500);
            return false;
        }
        return true;
    }
};

// Avatar Generator
const Avatar = {
    colors: [
        '#667eea', '#764ba2', '#f687b3', '#f56565', '#ecc94b',
        '#48bb78', '#4299e1', '#9f7aea', '#ed64a6', '#38b2ac'
    ],
    
    generate(name) {
        if (!name) return '';
        
        const initials = name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % this.colors.length;
        const bgColor = this.colors[colorIndex];
        
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 100, 100);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 50, 50);
        
        return canvas.toDataURL('image/png');
    }
};

// API Helper
const API = {
    async request(url, options = {}) {
        const token = Auth.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (response.status === 401) {
            Auth.clearAuth();
            Toast.error('Session expired. Please login again.');
            setTimeout(() => window.location.href = '/login', 1500);
            return null;
        }
        
        return response;
    },
    
    async get(url) {
        const response = await this.request(url);
        return response ? response.json() : null;
    },
    
    async post(url, data) {
        const response = await this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response ? response.json() : null;
    },
    
    async put(url, data) {
        const response = await this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response ? response.json() : null;
    },
    
    async delete(url) {
        const response = await this.request(url, { method: 'DELETE' });
        return response ? response.json() : null;
    },
    
    async upload(url, formData) {
        const token = Auth.getToken();
        const response = await fetch(url, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        return response.json();
    }
};

// Blog Card Component
const BlogCard = {
    render(blog) {
        const imageUrl = blog.image_url || 'https://via.placeholder.com/400x200?text=No+Image';
        const avatarUrl = blog.author_avatar_url || Avatar.generate(blog.author_name);
        const rating = blog.avg_rating ? `<i class="fas fa-star" style="color: #fbbf24;"></i> ${blog.avg_rating}` : '';
        
        return `
            <article class="blog-card">
                <div class="blog-card-image">
                    <img src="${imageUrl}" alt="${blog.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
                    <span class="blog-card-category">${blog.category_name}</span>
                </div>
                <div class="blog-card-content">
                    <h3 class="blog-card-title">
                        <a href="/blog/${blog.id}">${blog.title}</a>
                    </h3>
                    <p class="blog-card-description">${blog.description}</p>
                    <div class="blog-card-meta">
                        <div class="blog-card-author">
                            <img src="${avatarUrl}" alt="${blog.author_name}" onerror="this.src='${Avatar.generate(blog.author_name)}'">
                            <span>${blog.author_name}</span>
                        </div>
                        <div class="blog-card-stats">
                            ${rating ? `<span>${rating}</span>` : ''}
                            <span><i class="fas fa-eye"></i> ${blog.views}</span>
                            <span><i class="fas fa-comment"></i> ${blog.comment_count || 0}</span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }
};

// UI Helpers
const UI = {
    showLoading(container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    },
    
    showEmpty(container, title, description) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon"><i class="fas fa-inbox"></i></div>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-description">${description}</p>
            </div>
        `;
    },
    
    showError(container, message) {
        container.innerHTML = `
            <div class="error-state" style="grid-column: 1 / -1;">
                <div class="error-state-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h3 class="empty-state-title">Something went wrong</h3>
                <p class="empty-state-description">${message}</p>
            </div>
        `;
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    formatRelativeDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return this.formatDate(dateString);
    },
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
};

// Form Validation
const Validator = {
    email(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    minLength(value, min) {
        return value && value.length >= min;
    },
    
    maxLength(value, max) {
        return !value || value.length <= max;
    },
    
    required(value) {
        return value && value.trim().length > 0;
    }
};

// Mobile Menu
const MobileMenu = {
    init() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('navbar-nav');
        
        if (menuBtn && nav) {
            menuBtn.addEventListener('click', () => {
                nav.classList.toggle('active');
                const icon = menuBtn.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });
        }
    }
};

// Logout Handler
const LogoutHandler = {
    init() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.logout();
            });
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateUI();
    MobileMenu.init();
    LogoutHandler.init();
});

// Export for use in other scripts
window.ContentCraft = {
    Auth,
    API,
    Toast,
    UI,
    Avatar,
    BlogCard,
    Validator
};