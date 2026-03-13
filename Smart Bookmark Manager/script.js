class BookmarkManager {
            constructor() {
                this.bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
                this.currentFilter = 'all';
                this.searchTerm = '';
                this.deletingId = null;
                this.editingId = null;
                
                this.init();
            }

            init() {
                this.bindEvents();
                this.render();
                this.updateStats();
            }

            bindEvents() {
                // Add bookmark
                document.getElementById('addBookmark').addEventListener('click', () => this.addBookmark());
                
                // Form inputs
                document.getElementById('bookmarkName').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addBookmark();
                });
                document.getElementById('bookmarkUrl').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addBookmark();
                });

                // Search
                document.getElementById('searchInput').addEventListener('input', (e) => {
                    this.searchTerm = e.target.value.toLowerCase();
                    this.render();
                });

                // Filters
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelector('.filter-btn.active').classList.remove('active');
                        e.target.classList.add('active');
                        this.currentFilter = e.target.dataset.filter;
                        this.render();
                    });
                });

                // Modal events
                document.getElementById('cancelDelete').addEventListener('click', () => this.closeModal('deleteModal'));
                document.getElementById('confirmDelete').addEventListener('click', () => this.deleteBookmark());
                document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal('editModal'));
                document.getElementById('saveEdit').addEventListener('click', () => this.saveEdit());

                // Close modals on outside click
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            this.closeModal(modal.id);
                        }
                    });
                });

                // ESC key to close modals
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.closeAllModals();
                    }
                });
            }

            addBookmark() {
                const name = document.getElementById('bookmarkName').value.trim();
                const url = document.getElementById('bookmarkUrl').value.trim();
                const category = document.getElementById('bookmarkCategory').value;

                if (!name || !url) {
                    this.showNotification('Please fill in both name and URL', 'error');
                    return;
                }

                // Validate URL
                try {
                    new URL(url.startsWith('http') ? url : 'https://' + url);
                } catch {
                    this.showNotification('Please enter a valid URL', 'error');
                    return;
                }

                const bookmark = {
                    id: Date.now().toString(),
                    name: name,
                    url: url.startsWith('http') ? url : 'https://' + url,
                    category: category,
                    createdAt: new Date().toISOString()
                };

                this.bookmarks.unshift(bookmark); // Add to beginning
                this.saveToStorage();
                this.render();
                this.updateStats();
                this.clearForm();

                this.showNotification('Bookmark added successfully! 💖', 'success');
            }

            editBookmark(id) {
                this.editingId = id;
                const bookmark = this.bookmarks.find(b => b.id === id);
                if (bookmark) {
                    document.getElementById('editName').value = bookmark.name;
                    document.getElementById('editUrl').value = bookmark.url;
                    document.getElementById('editCategory').value = bookmark.category;
                    document.getElementById('editModal').classList.add('active');
                }
            }

            saveEdit() {
                const name = document.getElementById('editName').value.trim();
                const url = document.getElementById('editUrl').value.trim();
                const category = document.getElementById('editCategory').value;

                if (!name || !url || !this.editingId) {
                    this.showNotification('Please fill in all fields', 'error');
                    return;
                }

                try {
                    new URL(url.startsWith('http') ? url : 'https://' + url);
                } catch {
                    this.showNotification('Please enter a valid URL', 'error');
                    return;
                }

                const bookmarkIndex = this.bookmarks.findIndex(b => b.id === this.editingId);
                if (bookmarkIndex !== -1) {
                    this.bookmarks[bookmarkIndex] = {
                        ...this.bookmarks[bookmarkIndex],
                        name,
                        url: url.startsWith('http') ? url : 'https://' + url,
                        category
                    };
                    this.saveToStorage();
                    this.render();
                    this.updateStats();
                    this.closeModal('editModal');
                    this.showNotification('Bookmark updated successfully! ✨', 'success');
                }
            }

            showDeleteConfirmation(id) {
                this.deletingId = id;
                const bookmark = this.bookmarks.find(b => b.id === id);
                if (bookmark) {
                    document.getElementById('deleteBookmarkName').textContent = bookmark.name;
                    document.getElementById('deleteModal').classList.add('active');
                }
            }

            deleteBookmark() {
                if (this.deletingId) {
                    this.bookmarks = this.bookmarks.filter(b => b.id !== this.deletingId);
                    this.saveToStorage();
                    this.render();
                    this.updateStats();
                    this.closeModal('deleteModal');
                    this.showNotification('Bookmark deleted successfully!', 'success');
                }
            }

            getFilteredBookmarks() {
                return this.bookmarks.filter(bookmark => {
                    const matchesSearch = !this.searchTerm || 
                        bookmark.name.toLowerCase().includes(this.searchTerm) ||
                        bookmark.url.toLowerCase().includes(this.searchTerm);
                    
                    const matchesFilter = this.currentFilter === 'all' || 
                        bookmark.category === this.currentFilter;
                    
                    return matchesSearch && matchesFilter;
                });
            }

            render() {
                const grid = document.getElementById('bookmarksGrid');
                const filteredBookmarks = this.getFilteredBookmarks();
                
                if (filteredBookmarks.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-bookmark"></i>
                            <h3>No bookmarks found</h3>
                            <p>${this.searchTerm ? 'Try adjusting your search or filter.' : 'Add your first bookmark to get started! 💕'}</p>
                        </div>
                    `;
                    return;
                }

                grid.innerHTML = filteredBookmarks.map(bookmark => this.createBookmarkCard(bookmark)).join('');
            }

            createBookmarkCard(bookmark) {
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(bookmark.url).hostname)}&sz=32`;
                
                return `
                    <div class="bookmark-card" data-id="${bookmark.id}">
                        <div class="bookmark-favicon" style="background-image: url('${faviconUrl}')">
                            ${this.getDomainInitials(new URL(bookmark.url).hostname)}
                        </div>
                        <div class="bookmark-title" onclick="window.open('${bookmark.url}', '_blank')" title="Click to open">
                            ${this.escapeHtml(bookmark.name)}
                        </div>
                        <div class="bookmark-url" title="${bookmark.url}">
                            ${new URL(bookmark.url).hostname}
                        </div>
                        <div class="bookmark-category">${bookmark.category}</div>
                        <div class="bookmark-actions">
                            <button class="action-btn edit-btn" onclick="bookmarkManager.editBookmark('${bookmark.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="bookmarkManager.showDeleteConfirmation('${bookmark.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }

            getDomainInitials(domain) {
                return domain.substring(0, 2).toUpperCase();
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            clearForm() {
                document.getElementById('bookmarkName').value = '';
                document.getElementById('bookmarkUrl').value = '';
                document.getElementById('bookmarkCategory').selectedIndex = 0;
            }

            saveToStorage() {
                localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
            }

            updateStats() {
                document.getElementById('totalBookmarks').textContent = this.bookmarks.length;
                const categories = new Set(this.bookmarks.map(b => b.category));
                document.getElementById('totalCategories').textContent = categories.size;
            }

            closeModal(modalId) {
                document.getElementById(modalId).classList.remove('active');
                this.editingId = null;
                this.deletingId = null;
            }

            closeAllModals() {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
                this.editingId = null;
                this.deletingId = null;
            }

            showNotification(message, type = 'info') {
                // Create notification element
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 12px;
                    color: var(--white);
                    font-weight: 500;
                    z-index: 2000;
                    transform: translateX(400px);
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 25px var(--shadow-medium);
                    background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--cotton-candy)'};
                    max-width: 350px;
                    font-family: 'Inter', sans-serif;
                `;
                notification.textContent = message;

                document.body.appendChild(notification);

                // Animate in
                requestAnimationFrame(() => {
                    notification.style.transform = 'translateX(0)';
                });

                // Remove after 3 seconds
                setTimeout(() => {
                    notification.style.transform = 'translateX(400px)';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, 3000);
            }
        }

        // Initialize the app
        const bookmarkManager = new BookmarkManager();

        // Make bookmarkManager globally accessible for onclick handlers
        window.bookmarkManager = bookmarkManager;