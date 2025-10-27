"""InfluxDB client for reading metrics."""
from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS
from typing import Optional, List, Dict, Any
from app.config import settings


class InfluxDBService:
    """Service for interacting with InfluxDB."""
    
    def __init__(self):
        self.client: Optional[InfluxDBClient] = None
        self.write_api = None
        self.query_api = None
    
    def connect(self):
        """Connect to InfluxDB."""
        self.client = InfluxDBClient(
            url=settings.influxdb_url,
            token=settings.influxdb_token,
            org=settings.influxdb_org
        )
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
        self.query_api = self.client.query_api()
    
    def close(self):
        """Close InfluxDB connection."""
        if self.client:
            self.client.close()
    
    def query(self, query: str):
        """Execute a Flux query."""
        if not self.query_api:
            self.connect()
        return self.query_api.query(query)

    def query_dicts(self, query: str) -> List[Dict[str, Any]]:
        """Execute a Flux query and return list of dictionaries.

        Each record is converted into a dictionary combining values and tags.
        """
        tables = self.query(query)
        rows: List[Dict[str, Any]] = []
        for table in tables:
            for record in table.records:
                data = {
                    "_measurement": record.get_measurement(),
                    "_field": record.get_field(),
                    "_time": record.get_time(),
                    "_value": record.get_value(),
                }
                for key in record.values:
                    if key not in data:
                        data[key] = record.values[key]
                rows.append(data)
        return rows
    
    def get_health(self) -> bool:
        """Check if InfluxDB is healthy."""
        try:
            if not self.client:
                self.connect()
            health = self.client.health()
            return health.status == "pass"
        except Exception:
            return False


# Global instance
influx_service = InfluxDBService()


