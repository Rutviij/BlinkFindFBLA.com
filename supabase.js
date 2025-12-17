const SUPABASE_URL = window.SUPABASE_URL || 'https://nfqmwkvfwflojtvmevjj.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcW13a3Zmd2Zsb2p0dm1ldmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzM4NDEsImV4cCI6MjA4MTI0OTg0MX0.YVDgMLxuTzLDUulKM5O-cEVqEZKW1Fc__j_o6om8WHQ';

let supabaseClient = null;

function initSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Supabase credentials not configured. Using local storage fallback.');
        return null;
    }

    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabaseClient;
    }

    return null;
}

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

async function getAllItems() {
    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching items:', error);
            return getLocalItems();
        }
        return data || [];
    }
    return getLocalItems();
}

async function getApprovedItems() {
    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('items')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching items:', error);
            return getLocalItems().filter(item => item.status === 'approved');
        }
        return data || [];
    }
    return getLocalItems().filter(item => item.status === 'approved');
}

async function addItem(item) {
    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('items')
            .insert([item])
            .select();

        if (error) {
            console.error('Error adding item:', error);
            throw error;
        }
        return data[0];
    }

    const items = getLocalItems();
    const newItem = {
        ...item,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        status: 'pending'
    };
    items.unshift(newItem);
    saveLocalItems(items);
    return newItem;
}

async function updateItemStatus(id, status) {
    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('items')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating item:', error);
            throw error;
        }
        return data[0];
    }

    const items = getLocalItems();
    const idStr = String(id);
    const index = items.findIndex(item => String(item.id) === idStr);
    if (index !== -1) {
        items[index].status = status;
        saveLocalItems(items);
        return items[index];
    }
    throw new Error('Item not found');
}

async function deleteItem(id) {
    if (supabaseClient) {
        const { error } = await supabaseClient
            .from('items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting item:', error);
            throw error;
        }
        return true;
    }

    const items = getLocalItems();
    const idStr = String(id);
    const filtered = items.filter(item => String(item.id) !== idStr);
    saveLocalItems(filtered);
    return true;
}

async function addClaim(claim) {
    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('claims')
            .insert([claim])
            .select();

        if (error) {
            console.error('Error adding claim:', error);
            throw error;
        }
        return data[0];
    }

    const claims = getLocalClaims();
    const newClaim = {
        ...claim,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        status: 'pending'
    };
    claims.unshift(newClaim);
    saveLocalClaims(claims);
    return newClaim;
}

async function getAllClaims() {
    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('claims')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching claims:', error);
            return getLocalClaims();
        }
        return data || [];
    }
    return getLocalClaims();
}

async function updateClaimStatus(id, status) {
    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('claims')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating claim:', error);
            throw error;
        }
        return data[0];
    }

    const claims = getLocalClaims();
    const idStr = String(id);
    const index = claims.findIndex(claim => String(claim.id) === idStr);
    if (index !== -1) {
        claims[index].status = status;
        saveLocalClaims(claims);
        return claims[index];
    }
    throw new Error('Claim not found');
}

async function uploadImage(file) {
    if (supabaseClient) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabaseClient.storage
            .from('item-images')
            .upload(fileName, file);

        if (error) {
            console.error('Error uploading image:', error);
            throw error;
        }

        const { data: urlData } = supabaseClient.storage
            .from('item-images')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

initSupabase();
