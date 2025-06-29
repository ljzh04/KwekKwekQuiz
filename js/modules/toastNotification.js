// js/modules/toastNotification.js

let toastContainer = null;

function createToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-24 right-4 ml-4 z-50 space-y-2';
        document.body.appendChild(toastContainer);
    }
}

export function showToast(message, type = 'info', duration = 3000) {
    createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `
        px-4 py-3 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300 translate-x-full opacity-0
        ${getToastClasses(type)}
    `;
    
    // Add icon based on type
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">${icon}</div>
            <div class="flex-1 text-sm font-medium">${message}</div>
            <button class="flex-shrink-0 ml-2 text-current opacity-70 hover:opacity-100 transition-opacity" onclick="this.parentElement.parentElement.remove()">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
    
    return toast;
}

function removeToast(toast) {
    if (toast && toast.parentNode) {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }
}

function getToastClasses(type) {
    const baseClasses = 'text-white';
    switch (type) {
        case 'success':
            return `${baseClasses} bg-green-600 dark:bg-green-700`;
        case 'error':
            return `${baseClasses} bg-red-600 dark:bg-red-700`;
        case 'warning':
            return `${baseClasses} bg-yellow-600 dark:bg-yellow-700`;
        case 'info':
        default:
            return `${baseClasses} bg-blue-600 dark:bg-blue-700`;
    }
}

function getToastIcon(type) {
    switch (type) {
        case 'success':
            return `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>`;
        case 'error':
            return `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>`;
        case 'warning':
            return `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>`;
        case 'info':
        default:
            return `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>`;
    }
}