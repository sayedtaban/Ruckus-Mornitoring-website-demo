"""Access point routes."""
from fastapi import APIRouter, Path, HTTPException
from app.models.access_point import AccessPointResponse, AccessPoint, Radio
from app.database.influx_client import influx_service
from app.config import settings

router = APIRouter(prefix="/zones", tags=["access-points"])


@router.get("/{zone_id}/aps", response_model=AccessPointResponse)
async def get_access_points(zone_id: str = Path(..., description="Zone identifier")):
    """
    Get access points for a specific zone.
    
    Returns detailed information about all access points in the zone,
    including radio configuration, utilization metrics, and client counts.
    """
    try:
        ap_query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            "  |> range(start: -30m)\n"
            "  |> filter(fn: (r) => r[\\\"_measurement\\\"] == \\\"ap_metrics\\\")\n"
            f"  |> filter(fn: (r) => r[\\\"zoneId\\\"] == \\\"{zone_id}\\\")\n"
            "  |> group(columns: [\\\"apMac\\\"])\n"
            "  |> last()\n"
        )
        ap_rows = influx_service.query_dicts(ap_query)
        radio_query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            "  |> range(start: -30m)\n"
            "  |> filter(fn: (r) => r[\\\"_measurement\\\"] == \\\"radio_metrics\\\")\n"
            f"  |> filter(fn: (r) => r[\\\"zoneId\\\"] == \\\"{zone_id}\\\")\n"
            "  |> group(columns: [\\\"apMac\\\",\\\"band\\\"])\n"
            "  |> last()\n"
        )
        radio_rows = influx_service.query_dicts(radio_query)

        ap_index: dict[str, dict] = {}
        for r in ap_rows:
            mac = r.get("apMac")
            if mac not in ap_index:
                ap_index[mac] = {
                    "mac": mac,
                    "name": r.get("apName"),
                    "model": r.get("model"),
                    "status": r.get("status"),
                    "ip": r.get("ip"),
                    "zoneId": r.get("zoneId"),
                    "zoneName": r.get("zoneName"),
                    "firmwareVersion": None,
                    "serialNumber": None,
                    "clientCount": 0,
                    "channelUtilization": 0,
                    "airtimeUtilization": 0,
                    "cpuUtilization": 0,
                    "memoryUtilization": 0,
                    "radios": {},
                }
            field_name = r.get("_field")
            ap_index[mac][field_name] = r.get("_value")

        for rr in radio_rows:
            mac = rr.get("apMac")
            band = rr.get("band")
            if mac in ap_index:
                if band not in ap_index[mac]["radios"]:
                    ap_index[mac]["radios"][band] = {}
                ap_index[mac]["radios"][band][rr.get("_field")] = rr.get("_value")

        aps: list[AccessPoint] = []
        for mac, ap in ap_index.items():
            radios: list[Radio] = []
            for band, rvals in ap["radios"].items():
                radios.append(Radio(
                    band=band,
                    channel=int(rvals.get("channel", 0)),
                    txPower=int(rvals.get("txPower", 0)),
                    noiseFloor=int(rvals.get("noiseFloor", 0)),
                    clientCount=int(rvals.get("clientCount", 0)),
                ))
            aps.append(AccessPoint(
                mac=mac,
                name=str(ap.get("apName")),
                model=str(ap.get("model")),
                status=str(ap.get("status")),
                ip=str(ap.get("ip")),
                zoneId=str(ap.get("zoneId")),
                zoneName=str(ap.get("zoneName")),
                firmwareVersion=str(ap.get("firmwareVersion")),
                serialNumber=str(ap.get("serialNumber")),
                clientCount=int(ap.get("clientCount", 0)),
                channelUtilization=int(ap.get("channelUtilization", 0)),
                airtimeUtilization=int(ap.get("airtimeUtilization", 0)),
                cpuUtilization=int(ap.get("cpuUtilization", 0)),
                memoryUtilization=int(ap.get("memoryUtilization", 0)),
                radios=radios,
            ))

        return AccessPointResponse(total=len(aps), list=aps)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

