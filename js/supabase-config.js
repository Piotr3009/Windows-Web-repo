// Supabase Configuration
// IMPORTANT: Replace with your actual Supabase credentials from https://app.supabase.com

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Your anon/public key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export to window for global access
window.supabaseClient = supabase;

// Check if user is logged in
async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return user;
}

// Check if user is admin
async function isAdmin() {
    const user = await getCurrentUser();
    if (!user) return false;
    
    // Check user role from database
    const { data, error } = await supabase
        .from('customers')
        .select('role')
        .eq('user_id', user.id)
        .single();
    
    return data?.role === 'admin';
}

window.getCurrentUser = getCurrentUser;
window.isAdmin = isAdmin;
