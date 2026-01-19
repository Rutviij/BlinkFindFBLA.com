document.addEventListener('DOMContentLoaded', function() {
    const itemsContainer = document.getElementById('itemsContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const claimModal = document.getElementById('claimModal');
    const closeModal = document.getElementById('closeModal');
    const claimForm = document.getElementById('claimForm');
    const modalAlertContainer = document.getElementById('modalAlertContainer');

    let allItems = [];

    loadItems();

    async function loadItems() {
        try {
            allItems = await getApprovedItems();
            renderItems(allItems);
        } catch (error) {
            console.error('Error loading items:', error);
            itemsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">😕</div><p>Error loading items. Please refresh the page.</p></div>';
        }
    }

    function renderItems(items) {
        if (items.length === 0) {
            itemsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No items found</h3><p>Check back later or try a different search.</p></div>';
            return;
        }

        itemsContainer.innerHTML = items.map(item => `
            <div class="item-card">
                ${item.image_url 
                    ? `<img src="${item.image_url}" alt="${item.name}" class="item-image">` 
                    : `<div class="item-image" style="display: flex; align-items: center; justify-content: center; font-size: 50px;">📦</div>`
                }
                <div class="item-details">
                    <h3>${escapeHtml(item.name)}</h3>
                    <p><strong>Category:</strong> ${escapeHtml(item.category)}</p>
                    <p><strong>Location Found:</strong> ${escapeHtml(item.location)}</p>
                    <p>${escapeHtml(item.description.substring(0, 100))}${item.description.length > 100 ? '...' : ''}</p>
                    <div class="item-meta">
                        <span class="item-date">Found: ${formatDate(item.date_found)}</span>
                        <span class="item-status status-available">Available</span>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 15px;" onclick="openClaimModal('${item.id}', '${escapeHtml(item.name)}')">Claim This Item</button>
                </div>
            </div>
        `).join('');
    }

    function filterItems() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        const filtered = allItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                                  item.description.toLowerCase().includes(searchTerm) ||
                                  item.location.toLowerCase().includes(searchTerm);
            const matchesCategory = !category || item.category === category;
            return matchesSearch && matchesCategory;
        });

        renderItems(filtered);
    }

    searchInput.addEventListener('input', filterItems);
    categoryFilter.addEventListener('change', filterItems);

    window.openClaimModal = function(itemId, itemName) {
        document.getElementById('claimItemId').value = itemId;
        document.getElementById('claimItemName').value = itemName;
        claimModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    closeModal.addEventListener('click', () => {
        claimModal.classList.remove('active');
        document.body.style.overflow = '';
        claimForm.reset();
        modalAlertContainer.innerHTML = '';
    });

    claimModal.addEventListener('click', (e) => {
        if (e.target === claimModal) {
            claimModal.classList.remove('active');
            document.body.style.overflow = '';
            claimForm.reset();
            modalAlertContainer.innerHTML = '';
        }
    });

    claimForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = claimForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        try {
            const claimData = {
                item_id: document.getElementById('claimItemId').value,
                item_name: document.getElementById('claimItemName').value,
                claimant_name: document.getElementById('claimantName').value,
                claimant_email: document.getElementById('claimantEmail').value,
                claimant_phone: document.getElementById('claimantPhone').value,
                description: document.getElementById('claimDescription').value,
                status: 'pending'
            };

            await addClaim(claimData);

            modalAlertContainer.innerHTML = '<div class="alert alert-success">Claim submitted successfully! You will be contacted soon.</div>';
            claimForm.reset();

            setTimeout(() => {
                claimModal.classList.remove('active');
                document.body.style.overflow = '';
                modalAlertContainer.innerHTML = '';
            }, 2000);

        } catch (error) {
            console.error('Error submitting claim:', error);
            modalAlertContainer.innerHTML = '<div class="alert alert-error">Error submitting claim. Please try again.</div>';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
});
