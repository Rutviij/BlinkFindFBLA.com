document.addEventListener('DOMContentLoaded', function () {
    const itemsTableBody = document.getElementById('itemsTableBody');
    const alertContainer = document.getElementById('alertContainer');
    let allItems = [];

    loadData();

    // Fetch all items from Supabase
    async function loadData() {
        try {
            allItems = await getAllItems(); // Fetch all items
            console.log('Fetched items:', allItems); // Debugging: Log fetched items
            renderItems(allItems);
        } catch (error) {
            console.error('Error loading items:', error);
            showAlert('Error loading data. Please refresh the page.', 'error');
        }
    }

    // Render items in the admin table
    function renderItems(items) {
        if (items.length === 0) {
            itemsTableBody.innerHTML =
                '<tr><td colspan="6" class="empty-state">No items reported yet.</td></tr>';
            return;
        }

        itemsTableBody.innerHTML = items
            .map((item) => `
                <tr>
                    <td>
                        <strong>${escapeHtml(item.name)}</strong>
                        <br><small>Reported by: ${escapeHtml(item.finder_name)}</small>
                    </td>
                    <td>${escapeHtml(item.category)}</td>
                    <td>${escapeHtml(item.location)}</td>
                    <td>${formatDate(item.date_found)}</td>
                    <td>
                        <span class="item-status status-${item.status}">
                            ${capitalize(item.status)}
                        </span>
                    </td>
                    <td>
                        <div class="admin-actions">
                            ${item.status === 'pending' ? `
                                <button class="btn-small btn-approve" onclick="approveItem('${item.id}')">Approve</button>
                            ` : ''}
                            <button class="btn-small btn-delete" onclick="deleteItemConfirm('${item.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `)
            .join('');
    }

    // Approve an item
    window.approveItem = async function (id) {
        try {
            console.log(`Approving item ID: ${id}`); // Debugging: Log approval action
            await updateItemStatus(id, 'approved'); // Update status in Supabase
            showAlert('Item approved successfully!', 'success');
            loadData(); // Reload table data
        } catch (error) {
            console.error('Error approving item:', error);
            showAlert('Error approving item.', 'error');
        }
    };

    // Delete an item
    window.deleteItemConfirm = async function (id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                console.log(`Deleting item ID: ${id}`); // Debugging: Log deletion action
                await deleteItem(id); // Delete the item in Supabase
                showAlert('Item deleted successfully!', 'success');
                loadData(); // Reload table data
            } catch (error) {
                console.error('Error deleting item:', error);
                showAlert('Error deleting item.', 'error');
            }
        }
    };

    // Utility to display alerts
    function showAlert(message, type) {
        alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }

    // Utility to escape HTML content
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Utility to format dates
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Utility to capitalize text
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});
