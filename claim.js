// claim.js
import { getApprovedItems, addClaim } from './supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    const itemsContainer = document.getElementById('itemsContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const claimModal = document.getElementById('claimModal');
    const closeModal = document.getElementById('closeModal');
    const claimForm = document.getElementById('claimForm');
    const modalAlertContainer = document.getElementById('modalAlertContainer');

    let allItems = [];

    async function loadItems() {
        try {
            allItems = await getApprovedItems();
            renderItems(allItems);
        } catch (err) {
            console.error(err);
            itemsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">😕</div><p>Error loading items.</p></div>';
        }
    }

    function renderItems(items) {
        if (!items.length) {
            itemsContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No items found</h3></div>';
            return;
        }
        itemsContainer.innerHTML = items.map(item => `
            <div class="item-card">
                ${item.image_url ? `<img src="${item.image_url}" class="item-image">` : `<div class="item-image">📦</div>`}
                <div class="item-details">
                    <h3>${escapeHtml(item.name)}</h3>
                    <p><strong>Category:</strong> ${escapeHtml(item.category)}</p>
                    <p><strong>Location:</strong> ${escapeHtml(item.location)}</p>
                    <p>${escapeHtml(item.description.substring(0,100))}${item.description.length>100?'...':''}</p>
                    <div class="item-meta">
                        <span class="item-date">Found: ${formatDate(item.date_found)}</span>
                        <span class="item-status status-available">Available</span>
                    </div>
                    <button class="btn btn-primary" style="width:100%" onclick="openClaimModal('${item.id}','${escapeHtml(item.name)}')">Claim This Item</button>
                </div>
            </div>
        `).join('');
    }

    function filterItems() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        renderItems(allItems.filter(i => (i.name.toLowerCase().includes(searchTerm) || i.description.toLowerCase().includes(searchTerm) || i.location.toLowerCase().includes(searchTerm)) && (!category || i.category === category)));
    }

    searchInput.addEventListener('input', filterItems);
    categoryFilter.addEventListener('change', filterItems);

    window.openClaimModal = function(itemId, itemName) {
        document.getElementById('claimItemId').value = itemId;
        document.getElementById('claimItemName').value = itemName;
        claimModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    closeModal.addEventListener('click', () => { claimModal.classList.remove('active'); document.body.style.overflow = ''; claimForm.reset(); modalAlertContainer.innerHTML = ''; });
    claimModal.addEventListener('click', e => { if(e.target===claimModal){ claimModal.classList.remove('active'); document.body.style.overflow=''; claimForm.reset(); modalAlertContainer.innerHTML=''; } });

    claimForm.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = claimForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...'; submitBtn.disabled = true;

        try {
            await addClaim({
                item_id: document.getElementById('claimItemId').value,
                item_name: document.getElementById('claimItemName').value,
                claimant_name: document.getElementById('claimantName').value,
                claimant_email: document.getElementById('claimantEmail').value,
                claimant_phone: document.getElementById('claimantPhone').value,
                description: document.getElementById('claimDescription').value,
                status: 'pending'
            });
            modalAlertContainer.innerHTML = '<div class="alert alert-success">Claim submitted successfully!</div>';
            claimForm.reset();
            setTimeout(() => { claimModal.classList.remove('active'); document.body.style.overflow=''; modalAlertContainer.innerHTML=''; }, 2000);
        } catch(err) {
            console.error(err);
            modalAlertContainer.innerHTML = '<div class="alert alert-error">Error submitting claim.</div>';
        } finally { submitBtn.textContent = originalText; submitBtn.disabled=false; }
    });

    function escapeHtml(text){ const div=document.createElement('div'); div.textContent=text; return div.innerHTML; }
    function formatDate(dateString){ return new Date(dateString).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); }

    loadItems();
});
