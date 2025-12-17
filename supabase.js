const SUPABASE_URL = window.SUPABASE_URL || 'https://nfqmwkvfwflojtvmevjj.supabase.co';
const SUPABASE_ANON_KEY =
  window.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcW13a3Zmd2Zsb2p0dm1ldmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzM4NDEsImV4...';

let supabaseClient = null;

// Initialize Supabase client
function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase credentials are not configured. Please provide valid credentials.');
    return null;
  }

  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully.');
    return supabaseClient;
  }

  console.error('Supabase SDK not loaded. Verify your script includes the Supabase library.');
  return null;
}

// Helper functions for local storage
function getLocalData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveLocalData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Generic error logger
function handleError(message, error) {
  console.error(`${message}:`, error);
}

// Fetch all item entries
async function getAllItems() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError('Error fetching items', error);
    }
  }

  return getLocalData('lostFoundItems');
}

// Fetch approved items only
async function getApprovedItems() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('items')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError('Error fetching approved items', error);
    }
  }

  const items = getLocalData('lostFoundItems');
  return items.filter((item) => item.status === 'approved');
}

// Add a single item
async function addItem(item) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('items')
        .insert([item])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      handleError('Error adding item', error);
      throw error;
    }
  }

  // Fallback to local storage
  const items = getLocalData('lostFoundItems');
  const newItem = {
    ...item,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    status: 'pending',
  };
  items.unshift(newItem);
  saveLocalData('lostFoundItems', items);
  return newItem;
}

// Update the status of an item
async function updateItemStatus(id, status) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('items')
        .update({ status })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      handleError('Error updating item status', error);
      throw error;
    }
  }

  // Fallback to local storage
  const items = getLocalData('lostFoundItems');
  const index = items.findIndex((item) => String(item.id) === String(id));
  if (index !== -1) {
    items[index].status = status;
    saveLocalData('lostFoundItems', items);
    return items[index];
  }
  throw new Error('Item not found locally.');
}

// Delete a single item
async function deleteItem(id) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleError('Error deleting item', error);
      throw error;
    }
  }

  // Fallback to local storage
  const items = getLocalData('lostFoundItems');
  const filtered = items.filter((item) => String(item.id) !== String(id));
  saveLocalData('lostFoundItems', filtered);
  return true;
}

// Upload an image
async function uploadImage(file) {
  if (supabaseClient) {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabaseClient.storage
        .from('item-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = await supabaseClient.storage
        .from('item-images')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      handleError('Error uploading image', error);
      throw error;
    }
  }

  // Fallback to base64 for local use
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// Initialize Supabase on load
initSupabase();
