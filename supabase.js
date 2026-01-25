const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------- ITEMS -------------------

export async function getAllItems() {
    const { data, error } = await supabaseClient
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getApprovedItems() {
    const { data, error } = await supabaseClient
        .from('items')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function addItem(item) {
    const { data, error } = await supabaseClient
        .from('items')
        .insert([item])
        .select();
    if (error) throw error;
    return data[0];
}

export async function updateItemStatus(id, status) {
    const { data, error } = await supabaseClient
        .from('items')
        .update({ status })
        .eq('id', id)
        .select();
    if (error) throw error;
    return data[0];
}

export async function deleteItem(id) {
    const { error } = await supabaseClient
        .from('items')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
}

// ------------------- CLAIMS -------------------

export async function addClaim(claim) {
    const { data, error } = await supabaseClient
        .from('claims')
        .insert([claim])
        .select();
    if (error) throw error;
    return data[0];
}

export async function getAllClaims() {
    const { data, error } = await supabaseClient
        .from('claims')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function updateClaimStatus(id, status) {
    const { data, error } = await supabaseClient
        .from('claims')
        .update({ status })
        .eq('id', id)
        .select();
    if (error) throw error;
    return data[0];
}

// ------------------- IMAGE UPLOAD -------------------

export async function uploadImage(file) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabaseClient.storage
        .from('item-images')
        .upload(fileName, file);

    if (error) throw error;

    const { data: urlData, error: urlError } = supabaseClient.storage
        .from('item-images')
        .getPublicUrl(fileName);

    if (urlError) throw urlError;
    return urlData.publicUrl;
}
