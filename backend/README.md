# Ruckus Dashboard Backend

FastAPI backend for the Ruckus Dashboard application. This backend provides REST API endpoints for network monitoring and analytics data.

## Architecture

```
Ruckus SmartZone Controller → Connector Python Server → InfluxDB → FastAPI Backend → React Frontend
```

## Features

- RESTful API endpoints for all dashboard metrics
- InfluxDB integration for time-series data storage
- Pydantic models for request/response validation
- CORS support for frontend integration
- Health check endpoints
- Comprehensive error handling

## API Endpoints

All endpoints are prefixed with `/api`:

- `GET /api/venue` - Get venue metrics and zones
- `GET /api/zones/{zoneId}/aps` - Get access points for a zone
- `GET /api/cause-codes` - Get disconnect cause codes
- `GET /api/anomalies` - Get network anomalies
- `GET /api/clients` - Get connected clients
- `GET /api/hosts` - Get host usage statistics
- `GET /api/os-distribution` - Get OS distribution
- `GET /api/load` - Get band load data
- `GET /api/time-series` - Get time-series metrics

See `api-samples/API_ENDPOINTS.md` for detailed endpoint documentation.

## Installation

1. Clone the repository

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
# Edit .env with your InfluxDB credentials
```

5. Run the server:
```bash
python -m app.main
# Or with uvicorn:
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

## Configuration

Configuration is managed through environment variables (see `.env.example`):

- `INFLUXDB_URL`: InfluxDB server URL
- `INFLUXDB_TOKEN`: InfluxDB authentication token
- `INFLUXDB_ORG`: InfluxDB organization
- `INFLUXDB_BUCKET`: InfluxDB bucket name
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database/
│   │   ├── __init__.py
│   │   └── influx_client.py # InfluxDB client
│   ├── models/
│   │   ├── __init__.py
│   │   ├── common.py        # Common models
│   │   ├── venue.py         # Venue models
│   │   ├── access_point.py  # AP models
│   │   ├── cause_code.py    # Cause code models
│   │   ├── anomaly.py       # Anomaly models
│   │   ├── client.py        # Client models
│   │   ├── host_usage.py    # Host usage models
│   │   ├── os_distribution.py # OS distribution models
│   │   ├── load.py          # Load models
│   │   └── time_series.py   # Time series models
│   └── routes/
│       ├── __init__.py
│       ├── venue.py         # Venue routes
│       ├── access_points.py # AP routes
│       ├── cause_codes.py   # Cause code routes
│       ├── anomalies.py     # Anomaly routes
│       ├── clients.py       # Client routes
│       ├── hosts.py         # Host routes
│       ├── os_distribution.py # OS distribution routes
│       ├── load.py          # Load routes
│       └── time_series.py    # Time series routes
├── api-samples/             # Sample JSON data
├── influxdb_schema.md       # InfluxDB schema documentation
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
└── README.md               # This file
```

## InfluxDB Schema

See `influxdb_schema.md` for detailed documentation on:
- Measurement schemas
- Tag and field definitions
- Data collection recommendations
- Python connector examples

## Development

### Running the server in development mode:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001
```

### API Documentation

Once the server is running:
- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

### Testing

```bash
pytest
```

## Current Status

⚠️ **Note**: The API endpoints are currently returning 501 (Not Implemented) responses. You need to:

1. Implement the InfluxDB queries in each route handler
2. Map InfluxDB query results to the Pydantic models
3. Test with actual data from your connector server

The connector Python server should write data to InfluxDB following the schema defined in `influxdb_schema.md`.

## Next Steps

1. **Connector Server**: Implement the Python connector server that:
   - Connects to Ruckus SmartZone Controller
   - Fetches metrics and transforms data
   - Writes to InfluxDB following the schema

2. **Backend Implementation**: Complete the FastAPI route handlers:
   - Replace placeholder queries with actual InfluxDB Flux queries
   - Map query results to response models
   - Add error handling and validation

3. **Authentication**: Implement JWT authentication if needed

4. **Caching**: Consider adding Redis for frequently accessed data

## License

[Add your license here]

