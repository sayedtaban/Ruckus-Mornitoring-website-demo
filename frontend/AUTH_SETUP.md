# Authentication Setup Guide

This dashboard includes full authentication using Supabase. Here's how to set it up and use it.

## Setup Instructions

### 1. Supabase Configuration

The Supabase credentials are already configured in the `.env` file:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 2. Create Admin User

You have two options to create the admin user:

#### Option A: Through the UI (Recommended for Demo)
1. Start the development server: `npm run dev`
2. Navigate to the application in your browser
3. Click "Create one" on the login page to go to the register page
4. Fill in the registration form:
   - **Username**: `admin`
   - **Password**: `1qaz@WSX#EDC!`
   - Confirm password
5. Click "Create Account"
6. You'll be automatically redirected to login
7. Sign in with the admin credentials

#### Option B: Using the Script
If your Supabase instance is accessible:
```bash
npm run create-admin
```

This will create the admin user with:
- Username: `admin`
- Password: `1qaz@WSX#EDC!`

## Demo Credentials

**Default Admin Account:**
- Username: `admin`
- Password: `1qaz@WSX#EDC!`

## Features

### Login Page
- Username-based authentication (converted to email internally)
- Password validation
- Error handling
- Navigation to registration
- Demo credentials displayed for convenience

### Register Page
- Username creation (minimum 3 characters)
- Strong password requirements:
  - At least 8 characters
  - One uppercase letter
  - One lowercase letter
  - One number
  - One special character (!@#$%^&*)
- Real-time password validation indicator
- Automatic redirect to login on success

### User Profile Page
- Display user information
- Account status indicators
- Quick stats
- Sign out functionality
- Session management

### Protected Routes
- Authentication required to access dashboard
- Automatic redirect to login when not authenticated
- Loading state during authentication checks

## Security Notes

- Passwords are securely hashed by Supabase
- Email confirmation is disabled by default for demo purposes
- Sessions are managed securely using Supabase Auth
- Username is stored in internal email format (`username@smartzone.local`)

## Troubleshooting

### "Failed to sign in"
- Ensure you've created an account first through registration
- Verify the username and password are correct
- Check that Supabase credentials in `.env` are valid

### "Missing Supabase environment variables"
- Ensure `.env` file exists in the project root
- Verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Cannot create admin user via script
- This is normal if Supabase instance is not accessible
- Use Option A (UI registration) instead
- The script is provided for convenience in production setups

