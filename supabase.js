// Supabase configuration
const SUPABASE_URL = 'https://doovebtkpjvkvuzfxohq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvb3ZlYnRrcGp2a3Z1emZ4b2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTAxNDgsImV4cCI6MjA4NDg2NjE0OH0.WUwRsDVZ3lLlG5yWhEP4KxqZpxizouDWkfYxApRhlJ4';

// ✅ Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fallback to localStorage if Supabase fails
function getLocalItems() {
    const items = localStorage.getItem('lostFoundItems');
    return items ? JSON.parse(items) : [];
}

function saveLocalItems(items) {
    localStorage.setItem('lostFoundItems', JSON.stringify(items));
}

function getLocalClaims() {
    const claims = localStorage.getItem('lostFoundClaims');
    return claims ? JSON.parse(claims) : [];
}

function saveLocalClaims(claims) {
    localStorage.setItem('lostFoundClaims', JSON.stringify(claims));
}

// 💾 Items
async function getAllItems() {
    try {
        const { data, error } = await supabaseClient
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.warn('Supabase fetch failed, using localStorage:', err);
        return getLocalItems();
    }
}

async function getApprovedItems() {
    const allItems = await getAllItems();
    return allItems.filter(item => item.status === 'approved');
}

async function addItem(item) {
    try {
        const { data, error } = await supabaseClient
            .from('items')
            .insert([item])
            .select();
        if (error) throw error;
        return data[0];
    } catch {
        const items = getLocalItems();
        const newItem = { ...item, id: Date.now().toString(), status: 'pending', created_at: new Date().toISOString() };
        items.unshift(newItem);
        saveLocalItems(items);
        return newItem;
    }
}

async function updateItemStatus(id, status) {
    try {
        const { data, error } = await supabaseClient
            .from('items')
            .update({ status })
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    } catch {
        const items = getLocalItems();
        const index = items.findIndex(item => String(item.id) === String(id));
        if (index !== -1) {
            items[index].status = status;
            saveLocalItems(items);
            return items[index];
        }
    }
}

async function deleteItem(id) {
    try {
        const { error } = await supabaseClient.from('items').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch {
        const items = getLocalItems();
        saveLocalItems(items.filter(item => String(item.id) !== String(id)));
        return true;
    }
}

// 💾 Claims
async function getAllClaims() {
    try {
        const { data, error } = await supabaseClient
            .from('claims')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch {
        return getLocalClaims();
    }
}

async function addClaim(claim) {
    try {
        const { data, error } = await supabaseClient
            .from('claims')
            .insert([claim])
            .select();
        if (error) throw error;
        return data[0];
    } catch {
        const claims = getLocalClaims();
        const newClaim = { ...claim, id: Date.now().toString(), status: 'pending', created_at: new Date().toISOString() };
        claims.unshift(newClaim);
        saveLocalClaims(claims);
        return newClaim;
    }
}

async function updateClaimStatus(id, status) {
    try {
        const { data, error } = await supabaseClient
            .from('claims')
            .update({ status })
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    } catch {
        const claims = getLocalClaims();
        const index = claims.findIndex(c => String(c.id) === String(id));
        if (index !== -1) {
            claims[index].status = status;
            saveLocalClaims(claims);
            return claims[index];
        }
    }
}
