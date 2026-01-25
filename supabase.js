// Simple client wrapper that calls the Python API
const API_BASE = window.API_BASE || (location.protocol + '//' + location.hostname + ':4000');

async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} - ${text}`);
  }
  return res.json();
}

async function getAllItems() {
  try {
    return await safeFetch(`${API_BASE}/api/items`);
  } catch (e) {
    const ls = localStorage.getItem('lostFoundItems');
    return ls ? JSON.parse(ls) : [];
  }
}

async function getApprovedItems() {
  try {
    return await safeFetch(`${API_BASE}/api/items/approved`);
  } catch (e) {
    const ls = localStorage.getItem('lostFoundItems');
    return (ls ? JSON.parse(ls) : []).filter(i => i.status === 'approved');
  }
}

async function addItem(item) {
  try {
    return await safeFetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  } catch (e) {
    // local fallback
    const items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
    const newItem = { ...item, id: String(Date.now()), created_at: new Date().toISOString(), status: 'pending' };
    items.unshift(newItem);
    localStorage.setItem('lostFoundItems', JSON.stringify(items));
    return newItem;
  }
}

async function updateItemStatus(id, status) {
  try {
    return await safeFetch(`${API_BASE}/api/items/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  } catch (e) {
    const items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
    const idx = items.findIndex(it => String(it.id) === String(id));
    if (idx !== -1) {
      items[idx].status = status;
      localStorage.setItem('lostFoundItems', JSON.stringify(items));
      return items[idx];
    }
    throw e;
  }
}

async function deleteItem(id) {
  try {
    return await safeFetch(`${API_BASE}/api/items/${id}`, { method: 'DELETE' });
  } catch (e) {
    const items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
    const filtered = items.filter(it => String(it.id) !== String(id));
    localStorage.setItem('lostFoundItems', JSON.stringify(filtered));
    return { success: true };
  }
}

async function addClaim(claim) {
  try {
    return await safeFetch(`${API_BASE}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim)
    });
  } catch (e) {
    const claims = JSON.parse(localStorage.getItem('lostFoundClaims') || '[]');
    const newClaim = { ...claim, id: String(Date.now()), created_at: new Date().toISOString(), status: 'pending' };
    claims.unshift(newClaim);
    localStorage.setItem('lostFoundClaims', JSON.stringify(claims));
    return newClaim;
  }
}

async function getAllClaims() {
  try {
    return await safeFetch(`${API_BASE}/api/claims`);
  } catch (e) {
    return JSON.parse(localStorage.getItem('lostFoundClaims') || '[]');
  }
}

async function updateClaimStatus(id, status) {
  try {
    return await safeFetch(`${API_BASE}/api/claims/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  } catch (e) {
    const claims = JSON.parse(localStorage.getItem('lostFoundClaims') || '[]');
    const idx = claims.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) {
      claims[idx].status = status;
      localStorage.setItem('lostFoundClaims', JSON.stringify(claims));
      return claims[idx];
    }
    throw e;
  }
}

async function uploadImage(file) {
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.publicUrl;
  } catch (e) {
    // fallback to base64
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
}

// Expose functions globally (old code expects global functions)
window.getAllItems = getAllItems;
window.getApprovedItems = getApprovedItems;
window.addItem = addItem;
window.updateItemStatus = updateItemStatus;
window.deleteItem = deleteItem;
window.addClaim = addClaim;
window.getAllClaims = getAllClaims;
window.updateClaimStatus = updateClaimStatus;
window.uploadImage = uploadImage;
