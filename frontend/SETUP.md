# Ruckus Monitoring Dashboard

A React-based network monitoring dashboard built with TypeScript, Tailwind CSS, and Supabase.

## Quick Start (Development Mode)

The application now includes mock authentication for development. You can run it immediately without setting up Supabase:

```bash
npm install
npm run dev
```

**Default login credentials:**
- Username: `admin`
- Password: `admin`

## Production Setup

For production use, you'll need to set up Supabase:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a `.env` file in the root directory:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Set up authentication in your Supabase project
4. Run the application:
   ```bash
   npm install
   npm run dev
   ```

## Features

- **Network Overview**: High-level network statistics and performance metrics
- **Zone Analysis**: Detailed analysis of individual network zones
- **Streaming Quality**: Netflix-style quality scoring for network performance
- **Anomaly Detection**: Automated detection of network issues and anomalies
- **User Management**: Authentication and user profile management

## Development

The application uses:
- React 18 with TypeScript
- Tailwind CSS for styling
- Supabase for authentication and data storage
- Vite for build tooling
- Lucide React for icons

## Troubleshooting

If you see a white screen:
1. Check the browser console for errors
2. Ensure all environment variables are set correctly
3. Verify Supabase project configuration
4. In development mode, the app will use mock authentication if Supabase is not configured
