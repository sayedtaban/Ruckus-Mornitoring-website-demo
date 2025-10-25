# Ruckus Network Monitoring Dashboard

A comprehensive full-stack application for monitoring and analyzing Ruckus network infrastructure with real-time metrics, anomaly detection, and streaming quality analysis.

## 🏗️ Architecture

```
Ruckus SmartZone Controller → InfluxDB → FastAPI Backend → React Frontend
```

The application consists of three main components:
- **Backend (FastAPI)**: REST API server that queries InfluxDB for network metrics
- **Frontend (React + TypeScript)**: Modern dashboard UI with real-time data visualization
- **Database (InfluxDB)**: Time-series database storing network metrics

## ✨ Features

- **Network Overview**: Venue-level metrics, zone health status, and AP distribution
- **Zone Analysis**: Detailed zone performance metrics, RF health, and capacity analysis
- **Client Management**: Connected clients listing, data usage tracking, OS distribution
- **Streaming Quality**: Netflix score analysis with 802.11 cause code tracking
- **Anomaly Detection**: ML-powered anomaly detection with severity classification
- **Real-time Updates**: Live data fetching from backend API
- **Responsive UI**: Modern Grafana-inspired interface

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.9+, InfluxDB 2.x
- **Frontend**: Node.js 18+, npm/yarn

### Installation

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Copy .env.example to .env and update with your InfluxDB credentials
cp .env.example .env

# INFLUXDB_URL=http://localhost:8086
# INFLUXDB_TOKEN=your-token-here
# INFLUXDB_ORG=ruckus
# INFLUXDB_BUCKET=ruckus_metrics
```

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

#### 3. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
python -m app.main
# Or with uvicorn:
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`  
The backend API will be available at `http://localhost:3001`  
API documentation at `http://localhost:3001/docs`

## 📁 Project Structure

```
demo/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration settings
│   │   ├── database/
│   │   │   └── influx_client.py # InfluxDB client
│   │   ├── models/              # Pydantic models
│   │   └── routes/              # API route handlers
│   ├── api-samples/             # Sample JSON responses
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment variables template
│   └── README.md               # Backend documentation
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── views/               # Dashboard views
│   │   ├── lib/
│   │   │   └── api.ts          # API client
│   │   ├── contexts/            # React contexts
│   │   ├── pages/               # Auth pages
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utilities
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.ts           # Vite configuration
│   └── README.md               # Frontend documentation
│
└── README.md                    # This file
```

## 🔌 API Endpoints

All API endpoints are prefixed with `/api`:

- `GET /api/venue` - Get venue metrics and zones
- `GET /api/zones/{zoneId}/aps` - Get access points for a zone
- `GET /api/cause-codes` - Get disconnect cause codes
- `GET /api/anomalies` - Get network anomalies
- `GET /api/clients` - Get connected clients
- `GET /api/hosts` - Get host usage statistics
- `GET /api/os-distribution` - Get OS distribution
- `GET /api/load` - Get band load data
- `GET /api/time-series` - Get time-series metrics
- `GET /health` - Health check endpoint

See `backend/api-samples/API_ENDPOINTS.md` for detailed documentation.

## 🎨 Frontend Features

### Dashboard Views

1. **Network Overview** - High-level venue metrics and zone health
2. **Zone Analysis** - Detailed zone performance metrics
3. **Clients** - Connected clients table with filtering
4. **Streaming Quality** - Netflix score and QoS analysis
5. **Anomaly Detection** - ML-powered anomaly detection

### Key Components

- **MetricCard**: Display key metrics with trends
- **LineChart**: Time-series data visualization
- **BarChart**: Cause code analysis
- **PieChart**: Distribution visualization
- **APTable**: Access points listing
- **ZoneTable**: Zone listing with health status
- **ClientsTable**: Client management
- **AnomalyList**: Anomaly detection results

## 🔧 Configuration

### Backend Configuration

Configure the backend using environment variables (`.env`):

```env
# InfluxDB Settings
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-token-here
INFLUXDB_ORG=ruckus
INFLUXDB_BUCKET=ruckus_metrics

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# API Settings
API_PREFIX=/api
```

### Frontend Configuration

The frontend uses Vite's environment variables. Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

Or use the proxy configuration in `vite.config.ts` (already configured for development).

## 🗄️ Database Schema

The application expects InfluxDB with the following measurements:

- `venue_metrics`: Venue-level metrics
- `zone_metrics`: Zone-level metrics
- `ap_metrics`: Access point metrics
- `radio_metrics`: Radio-specific metrics
- `client_metrics`: Client device metrics
- `anomalies`: Anomaly detection results
- `disconnect_codes`: 802.11 disconnect cause codes
- `band_load`: Frequency band load data
- `host_usage`: Host data usage statistics
- `metrics`: Time-series metric data

See `backend/influxdb_schema.md` for detailed schema documentation.

## 🧪 Development

### Backend Development

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Testing

**Backend tests:**
```bash
cd backend
pytest
```

**Frontend type checking:**
```bash
cd frontend
npm run typecheck
```

## 🔒 Authentication

The frontend includes Supabase authentication integration. Configure authentication by following `frontend/AUTH_SETUP.md`.

## 📊 Data Generation

For development/testing, the application includes mock data generators in `frontend/src/utils/dataGenerator.ts`. These are used as fallbacks when the API is unavailable.

To generate real data, implement a connector service that:
1. Connects to Ruckus SmartZone Controller
2. Fetches metrics and transforms data
3. Writes to InfluxDB following the schema

## 🐛 Troubleshooting

### Backend Issues

1. **InfluxDB Connection Failed**: Check `.env` configuration and ensure InfluxDB is running
2. **Import Errors**: Ensure virtual environment is activated and dependencies are installed
3. **Port Already in Use**: Change port in `uvicorn` command or kill existing process

### Frontend Issues

1. **API Calls Failing**: Check backend is running on port 3001, verify CORS configuration
2. **Build Errors**: Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
3. **TypeScript Errors**: Run `npm run typecheck` to identify issues

## 📝 Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `INFLUXDB_URL` | InfluxDB server URL | `http://localhost:8086` |
| `INFLUXDB_TOKEN` | InfluxDB auth token | Required |
| `INFLUXDB_ORG` | InfluxDB organization | `ruckus` |
| `INFLUXDB_BUCKET` | InfluxDB bucket name | `ruckus_metrics` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://localhost:5173` |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `/api` (dev) or `http://localhost:3001/api` (prod) |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[Add your license here]

## 👥 Authors

[Add your name here]

## 🙏 Acknowledgments

- Ruckus Networks for SmartZone Controller
- Grafana for UI inspiration
- FastAPI for excellent Python web framework
- React + Vite for modern frontend development


