import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  const username = 'admin';
  const password = '1qaz@WSX#EDC!';
  const email = `${username}@smartzone.local`;

  console.log('Creating admin user...');
  console.log(`Username: ${username}`);
  console.log(`Email: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('Admin user already exists!');
      return;
    }
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }

  console.log('Admin user created successfully!');
  console.log('User ID:', data.user?.id);
}

createAdminUser();
