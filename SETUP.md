# Complete Setup Guide

This guide will walk you through setting up the complete Ruckus Network Monitoring Dashboard with backend and frontend integration.

## Prerequisites

- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **InfluxDB 2.x** (for storing time-series data)
- **Git** (for cloning the repository)

## Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 1.2 Configure InfluxDB

1. Start your InfluxDB instance
2. Create a bucket named `ruckus_metrics`
3. Create an organization named `ruckus` (or update the config)
4. Generate an API token with read permissions

### 1.3 Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
# InfluxDB Settings
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-actual-token-here
INFLUXDB_ORG=ruckus
INFLUXDB_BUCKET=ruckus_metrics

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT Settings (for future authentication)
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# API Settings
API_TITLE=Ruckus Dashboard API
API_VERSION=1.0.0
API_PREFIX=/api
```

### 1.4 Start Backend Server

```bash
cd backend
python -m app.main
# OR
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001
```

The backend will start on `http://localhost:3001`  
API documentation at `http://localhost:3001/docs`

## Step 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd frontend
npm install
```

### 2.2 Configure API Endpoint (Optional)

If you need to customize the API endpoint, create a `.env` file in the `frontend` directory:

```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

By default, the frontend uses a proxy configuration for development.

### 2.3 Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

## Step 3: Verify Integration

### 3.1 Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 3.2 Check Frontend Connection

1. Open `http://localhost:5173` in your browser
2. Check the browser console for any API errors
3. Verify that data is loading from the backend

### 3.3 Test API Endpoints

Visit `http://localhost:3001/docs` to access the interactive API documentation (Swagger UI).

## Step 4: Populating Test Data

If you don't have real data yet, you can:

### Option 1: Use Mock Data Generator

The frontend includes mock data generators that will be used as fallback when the API is unavailable.

### Option 2: Use InfluxDB Script

You can use the included script to generate sample data:

```bash
cd backend/scripts
python generate_data.py
```

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError`  
**Solution**: Activate virtual environment and install dependencies

**Problem**: `InfluxDB connection failed`  
**Solution**: 
- Verify InfluxDB is running
- Check `.env` configuration
- Test connection: `curl http://localhost:8086/health`

**Problem**: `Port 3001 already in use`  
**Solution**: 
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Frontend Issues

**Problem**: `Cannot connect to API`  
**Solution**: 
- Verify backend is running on port 3001
- Check CORS configuration in backend
- Verify proxy settings in `vite.config.ts`

**Problem**: `Module not found`  
**Solution**: 
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Problem**: TypeScript errors  
**Solution**: 
```bash
npm run typecheck
```

## Development Workflow

### Running Both Servers

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m app.main
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Hot Reload

Both servers support hot reload:
- Backend: Restart with `--reload` flag (already configured)
- Frontend: Automatic with Vite

## Production Build

### Backend

```bash
cd backend
# Install production dependencies
pip install -r requirements.txt

# Run with production settings
uvicorn app.main:app --host 0.0.0.0 --port 3001
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Next Steps

1. Configure real InfluxDB data ingestion from Ruckus SmartZone Controller
2. Set up authentication (see `frontend/AUTH_SETUP.md`)
3. Configure alerts and notifications
4. Set up CI/CD pipeline
5. Deploy to production environment

## Additional Resources

- Backend API Documentation: `backend/api-samples/API_ENDPOINTS.md`
- InfluxDB Schema: `backend/influxdb_schema.md`
- Frontend Features: `frontend/FEATURES.md`
- Authentication Setup: `frontend/AUTH_SETUP.md`

## Support

For issues or questions, please refer to the main README or open an issue on GitHub.

