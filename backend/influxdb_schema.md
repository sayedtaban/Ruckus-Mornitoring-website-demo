# InfluxDB Schema Documentation

This document describes the InfluxDB schema structure for the Ruckus Dashboard backend. The connector Python server should write data to InfluxDB following these schemas.

## Database Setup

- **Database/Bucket**: `ruckus_metrics`
- **Organization**: `ruckus` (or as configured)
- **Retention Policy**: Recommended 90 days for real-time metrics, 365 days for aggregated data

## Measurement Schemas

### 1. Venue Metrics (`venue_metrics`)

Aggregated venue-level metrics.

**Tags**:
- `venueId` (string): Venue identifier (e.g., "main-venue")

**Fields**:
- `totalZones` (integer): Total number of zones
- `totalAPs` (integer): Total number of access points
- `totalClients` (integer): Total connected clients
- `avgExperienceScore` (float): Average experience score (0-100)
- `slaCompliance` (float): SLA compliance percentage (0-100)

**Timestamp**: Current time

**Example Write**:
```python
point = Point("venue_metrics") \
    .tag("venueId", "main-venue") \
    .field("totalZones", 24) \
    .field("totalAPs", 3255) \
    .field("totalClients", 11473) \
    .field("avgExperienceScore", 81.0) \
    .field("slaCompliance", 100.0) \
    .time(datetime.utcnow())
```

---

### 2. Zone Metrics (`zone_metrics`)

Zone-level metrics aggregated from APs and clients.

**Tags**:
- `zoneId` (string): Zone identifier (e.g., "zone-001")
- `zoneName` (string): Zone name (e.g., "BC83386-P - Dogwood")
- `venueId` (string): Parent venue ID

**Fields**:
- `totalAPs` (integer): Total APs in zone
- `connectedAPs` (integer): Currently connected APs
- `disconnectedAPs` (integer): Disconnected APs
- `clients` (integer): Number of connected clients
- `apAvailability` (float): AP availability percentage
- `clientsPerAP` (float): Average clients per AP
- `experienceScore` (float): Zone experience score (0-100)
- `utilization` (float): Channel utilization percentage (0-100)
- `rxDesense` (float): RX desense percentage (0-100)
- `netflixScore` (float): Netflix score (0-100)

**Timestamp**: Current time

**Example Write**:
```python
point = Point("zone_metrics") \
    .tag("zoneId", "zone-001") \
    .tag("zoneName", "BC83386-P - Dogwood") \
    .tag("venueId", "main-venue") \
    .field("totalAPs", 120) \
    .field("connectedAPs", 118) \
    .field("disconnectedAPs", 2) \
    .field("clients", 450) \
    .field("apAvailability", 98.3) \
    .field("clientsPerAP", 3.81) \
    .field("experienceScore", 85.5) \
    .field("utilization", 65.2) \
    .field("rxDesense", 8.5) \
    .field("netflixScore", 82.3) \
    .time(datetime.utcnow())
```

---

### 3. Access Point Metrics (`ap_metrics`)

Individual access point metrics.

**Tags**:
- `apMac` (string): AP MAC address (e.g., "AA:BB:CC:11:22:33")
- `apName` (string): AP name (e.g., "AP-HQ-01")
- `model` (string): AP model (e.g., "R750", "R850")
- `zoneId` (string): Zone identifier
- `zoneName` (string): Zone name
- `status` (string): "online" or "offline"
- `ip` (string): AP IP address

**Fields**:
- `clientCount` (integer): Number of connected clients
- `channelUtilization` (integer): Channel utilization (0-100)
- `airtimeUtilization` (integer): Airtime utilization (0-100)
- `cpuUtilization` (integer): CPU utilization (0-100)
- `memoryUtilization` (integer): Memory utilization (0-100)
- `firmwareVersion` (string): Firmware version
- `serialNumber` (string): Serial number

**Timestamp**: Current time

**Example Write**:
```python
point = Point("ap_metrics") \
    .tag("apMac", "AA:BB:CC:11:22:33") \
    .tag("apName", "AP-HQ-01") \
    .tag("model", "R750") \
    .tag("zoneId", "zone-001") \
    .tag("zoneName", "BC83386-P - Dogwood") \
    .tag("status", "online") \
    .tag("ip", "192.168.1.101") \
    .field("clientCount", 28) \
    .field("channelUtilization", 65) \
    .field("airtimeUtilization", 72) \
    .field("cpuUtilization", 45) \
    .field("memoryUtilization", 68) \
    .field("firmwareVersion", "6.1.0.0.1234") \
    .field("serialNumber", "1234567890") \
    .time(datetime.utcnow())
```

---

### 4. Radio Metrics (`radio_metrics`)

Radio-specific metrics for each AP radio.

**Tags**:
- `apMac` (string): AP MAC address
- `zoneId` (string): Zone identifier
- `band` (string): "2.4GHz" or "5GHz"

**Fields**:
- `channel` (integer): Channel number
- `txPower` (integer): Transmit power (dBm)
- `noiseFloor` (integer): Noise floor (dBm, negative value)
- `clientCount` (integer): Clients on this radio

**Timestamp**: Current time

**Example Write**:
```python
# For 5GHz radio
point = Point("radio_metrics") \
    .tag("apMac", "AA:BB:CC:11:22:33") \
    .tag("zoneId", "zone-001") \
    .tag("band", "5GHz") \
    .field("channel", 36) \
    .field("txPower", 20) \
    .field("noiseFloor", -95) \
    .field("clientCount", 25) \
    .time(datetime.utcnow())
```

---

### 5. Client Metrics (`client_metrics`)

Client/device connection metrics.

**Tags**:
- `macAddress` (string): Client MAC address
- `apMac` (string): Connected AP MAC address
- `apName` (string): AP name
- `zoneId` (string): Zone identifier
- `wlan` (string): WLAN name (e.g., "LSS VOICE", "LSS DATA")
- `os` (string): Operating system (e.g., "iOS", "Android", "Windows")
- `deviceType` (string): "phone", "laptop", "tablet", "other"

**Fields**:
- `hostname` (string): Client hostname
- `modelName` (string): Device model name
- `ipAddress` (string): IP address (IPv4/IPv6)
- `dataUsage` (float): Data usage in MB
- `rxBytes` (integer): Received bytes
- `txBytes` (integer): Transmitted bytes

**Timestamp**: Current time (or connection timestamp)

**Example Write**:
```python
point = Point("client_metrics") \
    .tag("macAddress", "00:01:3E:60:2D:2C") \
    .tag("apMac", "2C:AB:46:08:B4:10") \
    .tag("apName", "Commons_AP") \
    .tag("zoneId", "zone-001") \
    .tag("wlan", "LSS VOICE") \
    .tag("os", "iOS") \
    .tag("deviceType", "phone") \
    .field("hostname", "iPhone1") \
    .field("modelName", "Unknown") \
    .field("ipAddress", "10.165.16.164") \
    .field("dataUsage", 1300.5) \
    .field("rxBytes", 1040000000) \
    .field("txBytes", 520000000) \
    .time(datetime.utcnow())
```

---

### 6. Disconnect Cause Codes (`disconnect_codes`)

802.11 disconnect/deauthentication cause codes.

**Tags**:
- `code` (integer): Cause code number (e.g., 25, 45, 47)
- `zoneId` (string): Zone identifier (optional)

**Fields**:
- `description` (string): Human-readable description
- `count` (integer): Number of disconnects with this code
- `impactScore` (float): Impact score (0-100)

**Timestamp**: Current time (or disconnect event timestamp)

**Note**: This can be written as a counter that increments, or as a cumulative count.

**Example Write**:
```python
point = Point("disconnect_codes") \
    .tag("code", "25") \
    .tag("zoneId", "zone-001") \
    .field("description", "Disassociated due to insufficient QoS") \
    .field("count", 298) \
    .field("impactScore", 94.6) \
    .time(datetime.utcnow())
```

---

### 7. Anomalies (`anomalies`)

Detected network anomalies.

**Tags**:
- `anomalyId` (string): Unique anomaly identifier
- `type` (string): Anomaly type (e.g., "poor_experience", "interference", "high_utilization")
- `severity` (string): "critical", "major", "warning", "info"
- `zoneId` (string): Zone identifier (optional)
- `affectedZone` (string): Zone name

**Fields**:
- `description` (string): Anomaly description
- `metric` (string): Affected metric (e.g., "experience_score", "rx_desense")
- `value` (float): Metric value at time of anomaly

**Timestamp**: Anomaly detection timestamp

**Example Write**:
```python
point = Point("anomalies") \
    .tag("anomalyId", "anomaly-001") \
    .tag("type", "poor_experience") \
    .tag("severity", "critical") \
    .tag("zoneId", "zone-004") \
    .tag("affectedZone", "FL21908-P - Pier Sixty-Six") \
    .field("description", "Poor experience score: 54.6") \
    .field("metric", "experience_score") \
    .field("value", 54.6) \
    .time(datetime.utcnow())
```

---

### 8. Host Usage (`host_usage`)

Aggregated host usage statistics.

**Tags**:
- `hostname` (string): Hostname or MAC address

**Fields**:
- `dataUsage` (float): Total data usage in MB

**Timestamp**: Current time

**Note**: This should be written as cumulative or aggregated over a time window.

**Example Write**:
```python
point = Point("host_usage") \
    .tag("hostname", "iPhone1") \
    .field("dataUsage", 1300.0) \
    .time(datetime.utcnow())
```

---

### 9. Band Load (`band_load`)

Frequency band load/utilization over time.

**Tags**:
- `band` (string): "2.4G", "5G", or "6G/5G"
- `zoneId` (string): Zone identifier (optional)

**Fields**:
- `band24G` (float): 2.4G load (0-1)
- `band5G` (float): 5G load (0-1)
- `band6G5G` (float): 6G/5G load (0-1)

**Timestamp**: Time for this data point

**Example Write**:
```python
# For 2.4G band
point = Point("band_load") \
    .tag("band", "2.4G") \
    .tag("zoneId", "zone-001") \
    .field("band24G", 0.30) \
    .field("band5G", 0.0) \
    .field("band6G5G", 0.0) \
    .time(datetime.utcnow())
```

---

### 10. Time Series Metrics (`metrics`)

Time-series data for various metrics.

**Tags**:
- `metric` (string): Metric name ("experienceScore", "utilization", "netflixScore")
- `zoneId` (string): Zone identifier
- `zoneName` (string): Zone name

**Fields**:
- `value` (float): Metric value

**Timestamp**: Time for this data point

**Example Write**:
```python
point = Point("metrics") \
    .tag("metric", "experienceScore") \
    .tag("zoneId", "zone-001") \
    .tag("zoneName", "BC83386-P - Dogwood") \
    .field("value", 85.5) \
    .time(datetime.utcnow())
```

---

## Data Collection Recommendations

### Update Frequency

1. **Real-time metrics** (APs, clients, zone metrics): Update every 1-5 minutes
2. **Time-series data**: Collect every 1 minute
3. **Aggregated metrics** (venue, OS distribution, host usage): Update every 5-15 minutes
4. **Anomalies**: Write immediately upon detection
5. **Disconnect codes**: Write immediately or aggregate hourly

### Data Retention

- **Real-time metrics**: 90 days
- **Time-series data**: 90 days (can be downsampled to hourly after 7 days)
- **Anomalies**: 365 days
- **Historical aggregates**: 365 days

### Batch Writing

For performance, batch multiple points together:

```python
from influxdb_client import Point
from influxdb_client.client.write_api import SYNCHRONOUS

points = []
for ap in access_points:
    point = Point("ap_metrics") \
        .tag("apMac", ap.mac) \
        .tag("zoneId", ap.zone_id) \
        # ... more fields
        .time(ap.timestamp)
    points.append(point)

write_api.write(bucket="ruckus_metrics", org="ruckus", record=points)
```

## Flux Query Examples

### Query Venue Metrics
```flux
from(bucket: "ruckus_metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "venue_metrics")
  |> last()
```

### Query Zone Metrics for Specific Zone
```flux
from(bucket: "ruckus_metrics")
  |> range(start: -15m)
  |> filter(fn: (r) => r["_measurement"] == "zone_metrics")
  |> filter(fn: (r) => r["zoneId"] == "zone-001")
  |> last()
```

### Query APs for Zone
```flux
from(bucket: "ruckus_metrics")
  |> range(start: -15m)
  |> filter(fn: (r) => r["_measurement"] == "ap_metrics")
  |> filter(fn: (r) => r["zoneId"] == "zone-001")
  |> group(columns: ["apMac"])
  |> last()
```

### Aggregate Time Series Data
```flux
from(bucket: "ruckus_metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "metrics")
  |> filter(fn: (r) => r["metric"] == "experienceScore")
  |> filter(fn: (r) => r["zoneId"] == "zone-001")
  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
```

## Python Connector Example

```python
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime

# Initialize client
client = InfluxDBClient(
    url="http://localhost:8086",
    token="your-token",
    org="ruckus"
)

write_api = client.write_api(write_options=SYNCHRONOUS)

def write_zone_metrics(zone_data):
    """Write zone metrics to InfluxDB."""
    point = Point("zone_metrics") \
        .tag("zoneId", zone_data["id"]) \
        .tag("zoneName", zone_data["name"]) \
        .tag("venueId", "main-venue") \
        .field("totalAPs", zone_data["totalAPs"]) \
        .field("connectedAPs", zone_data["connectedAPs"]) \
        .field("disconnectedAPs", zone_data["disconnectedAPs"]) \
        .field("clients", zone_data["clients"]) \
        .field("apAvailability", zone_data["apAvailability"]) \
        .field("clientsPerAP", zone_data["clientsPerAP"]) \
        .field("experienceScore", zone_data["experienceScore"]) \
        .field("utilization", zone_data["utilization"]) \
        .field("rxDesense", zone_data["rxDesense"]) \
        .field("netflixScore", zone_data["netflixScore"]) \
        .time(datetime.utcnow())
    
    write_api.write(bucket="ruckus_metrics", org="ruckus", record=point)

def write_ap_metrics(ap_data):
    """Write access point metrics to InfluxDB."""
    point = Point("ap_metrics") \
        .tag("apMac", ap_data["mac"]) \
        .tag("apName", ap_data["name"]) \
        .tag("model", ap_data["model"]) \
        .tag("zoneId", ap_data["zoneId"]) \
        .tag("zoneName", ap_data["zoneName"]) \
        .tag("status", ap_data["status"]) \
        .tag("ip", ap_data["ip"]) \
        .field("clientCount", ap_data["clientCount"]) \
        .field("channelUtilization", ap_data["channelUtilization"]) \
        .field("airtimeUtilization", ap_data["airtimeUtilization"]) \
        .field("cpuUtilization", ap_data["cpuUtilization"]) \
        .field("memoryUtilization", ap_data["memoryUtilization"]) \
        .field("firmwareVersion", ap_data["firmwareVersion"]) \
        .field("serialNumber", ap_data["serialNumber"]) \
        .time(datetime.utcnow())
    
    write_api.write(bucket="ruckus_metrics", org="ruckus", record=point)
    
    # Write radio metrics separately
    for radio in ap_data["radios"]:
        radio_point = Point("radio_metrics") \
            .tag("apMac", ap_data["mac"]) \
            .tag("zoneId", ap_data["zoneId"]) \
            .tag("band", radio["band"]) \
            .field("channel", radio["channel"]) \
            .field("txPower", radio["txPower"]) \
            .field("noiseFloor", radio["noiseFloor"]) \
            .field("clientCount", radio["clientCount"]) \
            .time(datetime.utcnow())
        
        write_api.write(bucket="ruckus_metrics", org="ruckus", record=radio_point)

def write_client_metrics(client_data):
    """Write client metrics to InfluxDB."""
    point = Point("client_metrics") \
        .tag("macAddress", client_data["macAddress"]) \
        .tag("apMac", client_data["apMac"]) \
        .tag("apName", client_data["apName"]) \
        .tag("zoneId", client_data.get("zoneId", "")) \
        .tag("wlan", client_data["wlan"]) \
        .tag("os", client_data["os"]) \
        .tag("deviceType", client_data["deviceType"]) \
        .field("hostname", client_data["hostname"]) \
        .field("modelName", client_data["modelName"]) \
        .field("ipAddress", client_data["ipAddress"]) \
        .field("dataUsage", client_data["dataUsage"]) \
        .time(datetime.utcnow())
    
    write_api.write(bucket="ruckus_metrics", org="ruckus", record=point)
```

## Notes

1. **Tag vs Field**: Use tags for values you'll filter by (zoneId, apMac, etc.). Use fields for numeric values you'll aggregate.
2. **Cardinality**: Keep tag cardinality low to avoid performance issues. Don't use timestamps or high-cardinality values as tags.
3. **Points per Write**: Batch writes for better performance (1000-5000 points per write).
4. **Error Handling**: Implement retry logic for failed writes.
5. **Time Precision**: Use nanosecond precision for timestamps (InfluxDB default).


