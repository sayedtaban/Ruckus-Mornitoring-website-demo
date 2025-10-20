"""Venue and zone routes."""
from fastapi import APIRouter, HTTPException
from app.models.venue import VenueResponse, Zone
from app.database.influx_client import influx_service
from app.config import settings

router = APIRouter(prefix="/venue", tags=["venue"])


@router.get("", response_model=VenueResponse)
async def get_venue():
    """
    Get overall venue metrics and all zones.
    """
    try:
        venue_query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            "  |> range(start: -2h)\n"
            "  |> filter(fn: (r) => r[\"_measurement\"] == \"venue_metrics\")\n"
            "  |> last()\n"
        )
        venue_rows = influx_service.query_dicts(venue_query)

        zone_query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            "  |> range(start: -2h)\n"
            "  |> filter(fn: (r) => r[\"_measurement\"] == \"zone_metrics\")\n"
            "  |> group(columns: [\"zoneId\"])\n"
            "  |> last()\n"
        )
        zone_rows = influx_service.query_dicts(zone_query)

        if not venue_rows:
            raise HTTPException(status_code=404, detail="No venue data")

        latest = {}
        for r in venue_rows:
            latest[r.get("_field")] = r.get("_value")

        zones_index: dict[str, dict] = {}
        for r in zone_rows:
            zid = r.get("zoneId")
            if zid not in zones_index:
                zones_index[zid] = {"id": zid, "name": r.get("zoneName")}
            zones_index[zid][r.get("_field")] = r.get("_value")

        zones: list[Zone] = []
        for z in zones_index.values():
            zones.append(Zone(
                id=z["id"],
                name=z.get("name", z["id"]),
                totalAPs=int(z.get("totalAPs", 0)),
                connectedAPs=int(z.get("connectedAPs", 0)),
                disconnectedAPs=int(z.get("disconnectedAPs", 0)),
                clients=int(z.get("clients", 0)),
                apAvailability=float(z.get("apAvailability", 0.0)),
                clientsPerAP=float(z.get("clientsPerAP", 0.0)),
                experienceScore=float(z.get("experienceScore", 0.0)),
                utilization=float(z.get("utilization", 0.0)),
                rxDesense=float(z.get("rxDesense", 0.0)),
                netflixScore=float(z.get("netflixScore", 0.0)),
            ))

        return VenueResponse(
            name="GA29532-P - Signal House",
            totalZones=int(latest.get("totalZones", len(zones))),
            totalAPs=int(latest.get("totalAPs", 0)),
            totalClients=int(latest.get("totalClients", 0)),
            avgExperienceScore=float(latest.get("avgExperienceScore", 0.0)),
            slaCompliance=float(latest.get("slaCompliance", 0.0)),
            zones=sorted(zones, key=lambda z: z.id)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

