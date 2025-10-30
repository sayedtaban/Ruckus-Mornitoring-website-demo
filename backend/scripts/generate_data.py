from __future__ import annotations

from datetime import datetime, timedelta
import random
from typing import List, Dict, Optional
import argparse

from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

from app.config import settings


ZONE_NAMES = [
    'BC83386-P - Dogwood',
    'CA28283 - Ventana Residences',
    'FL01313 - Palomar Core MEC',
    'FL21908-P - Pier Sixty-Six',
    'FL21966-P - Town Hollywood',
    'FL28242-P - Serenity Lane',
    'FL28243-P - Imperial Village',
    'FL28244-P - Sunpointe Place',
    'FL28245-P - ParkVillage I and',
    'FL29325-P - Harbor Cay',
    'GA29532-P - Signal House',
    'IL23336-P - Concordia Village',
    'IL23640-P - Lutheran Hillside',
    'IL62034-P - Meridian Village',
    'IN28254-P - EMC2',
    'MO23626-P - Lenoir Woods',
    'MO63144-P - Mason Pointe',
    'MO63304-P - Breeze Park',
    'MOXXXXX-P - Mason Pointe',
    'NC29384-P - SAU',
    'SBA Lab',
    'Staging Zone',
    'TN21944-P - Opus East Memphis',
    'TX29328-P - The Gabriel',
]

CAUSE_CODE_DESCRIPTIONS: Dict[int, str] = {
    1: 'Unspecified reason',
    2: 'Previous authentication no longer valid',
    3: 'Deauthenticated - leaving or left BSS',
    4: 'Disassociated due to inactivity',
    5: 'Disassociated - AP unable to handle all STAs',
    6: 'Class 2 frame from non-authenticated STA',
    7: 'Class 3 frame from non-associated STA',
    8: 'Disassociated - STA has left BSS',
    25: 'Disassociated due to insufficient QoS',
    34: 'Disassociated for unspecified QoS reason',
    45: 'Peer unreachable',
    47: 'Requested from peer',
}

VENUE_VALUES: Dict[str, int] = {
    'BC83386-P - Dogwood': 653,
    'CA28283 - Ventana Residences': 541,
    'FL01313 - Palomar Core MEC': 0,
    'FL21908-P - Pier Sixty-Six': 999,
    'FL21966-P - Town Hollywood': 2019,
    'FL28242-P - Serenity Lane': 5,
    'FL28243-P - Imperial Village': 363,
    'FL28244-P - Sunpointe Place': 0,
    'FL28245-P - ParkVillage I and': 2,
    'FL29325-P - Harbor Cay': 0,
    'GA29532-P - Signal House': 921,
    'IL23336-P - Concordia Village': 688,
    'IL23640-P - Lutheran Hillside': 371,
    'IL62034-P - Meridian Village': 0,
    'IN28254-P - EMC2': 23,
    'MO23626-P - Lenoir Woods': 668,
    'MO63144-P - Mason Pointe': 0,
    'MO63304-P - Breeze Park': 402,
    'MOXXXXX-P - Mason Pointe': 0,
    'NC29384-P - SAU': 0,
    'SBA Lab': 0,
    'Staging Zone': 0,
    'TN21944-P - Opus East Memphis': 687,
    'TX29328-P - The Gabriel': 843,
}

OS_LIST = [
    { 'os': 'iOS', 'percentage': 26.48, 'color': '#8B5CF6' },
    { 'os': 'Android', 'percentage': 18.35, 'color': '#3B82F6' },
    { 'os': 'Unknown', 'percentage': 27.13, 'color': '#1E3A5F' },
    { 'os': 'Chrome OS/Chromebook', 'percentage': 7.2, 'color': '#10B981' },
    { 'os': 'macOS', 'percentage': 5.57, 'color': '#D1D5DB' },
    { 'os': 'Windows', 'percentage': 3.44, 'color': '#6B7280' },
]

AP_MODELS = ['R750', 'R850', 'T350', 'T370', 'H550']


def rand(min_v: float, max_v: float) -> float:
    return random.random() * (max_v - min_v) + min_v


def gen_mac() -> str:
    chars = '0123456789ABCDEF'
    return ':'.join(''.join(random.choice(chars) for _ in range(2)) for _ in range(6))


def gen_ip(zone_index: int, ap_index: int) -> str:
    return f"192.168.{(zone_index // 10) + 1}.{ap_index + 100}"


def gen_serial() -> str:
    return ''.join(str(random.randint(0, 9)) for _ in range(10))


def gen_fw() -> str:
    versions = ['6.1.0.0.1234', '6.1.0.0.1235', '6.0.9.0.1200', '6.1.1.0.1240', '6.0.8.0.1199']
    return random.choice(versions)


def generate_zone(name: str, index: int) -> Dict:
    base_clients = VENUE_VALUES.get(name, int(rand(50, 100)))
    if base_clients == 0:
        return {
            'id': f'zone-{index}',
            'name': name,
            'totalAPs': int(rand(10, 50)),
            'connectedAPs': 0,
            'disconnectedAPs': int(rand(10, 50)),
            'clients': 0,
            'apAvailability': 0.0,
            'clientsPerAP': 0.0,
            'experienceScore': 0.0,
            'utilization': 0.0,
            'rxDesense': 0.0,
            'netflixScore': 0.0,
        }

    total_aps = max(10, int(base_clients / 4) + int(rand(5, 25)))
    disconnected = int(rand(0, min(3, int(total_aps * 0.05))))
    connected = total_aps - disconnected
    clients = base_clients
    ap_availability = (connected / total_aps) * 100
    clients_per_ap = clients / connected if connected else 0

    if base_clients > 1500:
        base_ex = max(20, 40 - (clients_per_ap * 3))
    elif base_clients > 800:
        base_ex = max(40, 70 - (clients_per_ap * 4))
    else:
        base_ex = max(60, 100 - (clients_per_ap * 5))

    experience = max(0, min(100, base_ex + rand(-5, 5)))

    if base_clients > 1500:
        utilization = min(99, max(85, clients_per_ap * 20 + rand(5, 15)))
    elif base_clients > 800:
        utilization = min(95, max(70, clients_per_ap * 18 + rand(0, 10)))
    else:
        utilization = min(95, max(20, clients_per_ap * 15 + rand(-10, 10)))

    rx_desense = rand(2, min(25, clients_per_ap * 3))
    netflix = max(0, experience - (rx_desense * 2) - (15 if utilization > 70 else 0))

    return {
        'id': f'zone-{index}',
        'name': name,
        'totalAPs': total_aps,
        'connectedAPs': connected,
        'disconnectedAPs': disconnected,
        'clients': clients,
        'apAvailability': round(ap_availability, 1),
        'clientsPerAP': float(f"{clients_per_ap:.2f}"),
        'experienceScore': float(f"{experience:.1f}"),
        'utilization': float(f"{utilization:.1f}"),
        'rxDesense': float(f"{rx_desense:.1f}"),
        'netflixScore': float(f"{netflix:.1f}"),
    }


def generate_venue() -> Dict:
    zones = [generate_zone(n, i) for i, n in enumerate(ZONE_NAMES)]
    total_aps = sum(z['totalAPs'] for z in zones)
    total_clients = sum(z['clients'] for z in zones)
    avg_ex = sum(z['experienceScore'] for z in zones) / len(zones)
    sla = len([z for z in zones if z['apAvailability'] >= 95]) / len(zones) * 100
    return {
        'name': 'GA29532-P - Signal House',
        'totalZones': len(zones),
        'totalAPs': total_aps,
        'totalClients': total_clients,
        'avgExperienceScore': float(f"{avg_ex:.1f}"),
        'slaCompliance': float(f"{sla:.1f}"),
        'zones': zones,
    }


def generate_ap_data_for_zone(zone: Dict, zone_index: int) -> Dict:
    ap_count = zone['connectedAPs']
    ap_list: List[Dict] = []
    for i in range(ap_count):
        model = random.choice(AP_MODELS)
        is_online = i >= zone['disconnectedAPs']
        clients_5 = int(zone['clients'] * 0.8 / max(1, zone['connectedAPs']))
        clients_24 = max(0, int(zone['clients'] / max(1, zone['connectedAPs'])) - clients_5)
        radios = [
            {
                'band': '5GHz',
                'channel': random.choice([36, 40, 44, 48, 149, 153, 157, 161]),
                'txPower': int(rand(15, 23)),
                'noiseFloor': int(rand(-100, -80)),
                'clientCount': max(0, int(clients_5 * rand(0.8, 1.2))),
            },
            {
                'band': '2.4GHz',
                'channel': random.choice([1, 6, 11]),
                'txPower': int(rand(12, 20)),
                'noiseFloor': int(rand(-95, -75)),
                'clientCount': max(0, int(clients_24 * rand(0.8, 1.2))),
            },
        ]
        ap = {
            'mac': gen_mac(),
            'name': f"AP-{zone['name'][:2]}-{str(i + 1).zfill(2)}",
            'model': model,
            'status': 'online' if is_online else 'offline',
            'ip': gen_ip(zone_index, i),
            'zoneId': zone['id'],
            'zoneName': zone['name'],
            'firmwareVersion': gen_fw(),
            'serialNumber': gen_serial(),
            'clientCount': int(rand(0, max(1, int(zone['clients'] / max(1, zone['connectedAPs']))))) if is_online else 0,
            'channelUtilization': int(rand(30, 85)) if is_online else 0,
            'airtimeUtilization': int(rand(40, 90)) if is_online else 0,
            'cpuUtilization': int(rand(20, 60)) if is_online else 0,
            'memoryUtilization': int(rand(40, 75)) if is_online else 0,
            'radios': radios,
        }
        ap_list.append(ap)
    return { 'total': ap_count, 'list': ap_list }


def generate_clients(count: int) -> List[Dict]:
    ap_list = [
        { 'name': 'Commons_AP', 'mac': '2C:AB:46:08:B4:10' },
        { 'name': 'Eastwood_u486', 'mac': '34:15:93:1B:78:42' },
        { 'name': 'u-C4', 'mac': '34:15:93:1B:5E:8A' },
        { 'name': 'AL_Room 22', 'mac': 'B0:7C:51:36:0F:92' },
        { 'name': 'AP144', 'mac': '2C:AB:46:08:9E:11' },
        { 'name': 'Main_Hall', 'mac': '6A:3D:1C:2F:4E:8D' },
        { 'name': 'Wing_B', 'mac': '9F:E2:4D:1A:3C:7B' },
        { 'name': 'Floor_2_North', 'mac': '5C:8A:4E:1F:3D:9A' },
    ]
    wlan_list = ['LSS VOICE', 'LSS DATA', 'LSS GUEST']

    def gen_hostname() -> str:
        types = ['iPhone', 'Samsung', 'DESKTOP-', 'Harry-s-', 'AZULFD']
        t = random.choice(types)
        if 'iPhone' in t or 'Samsung' in t:
            return f"{t}{random.randint(0,9)}"
        return f"{t}{random.random():.7f}".upper().replace('0.', '')

    def os_from_device(hostname: str) -> str:
        if 'iPhone' in hostname:
            return 'iOS'
        if 'Samsung' in hostname or 'Galaxy' in hostname:
            return 'Android'
        if 'DESKTOP-' in hostname:
            return 'Windows'
        if 'MacBook' in hostname or 'Mac-' in hostname:
            return 'macOS'
        if 'Surface' in hostname or 'ThinkPad' in hostname:
            return 'Windows'
        if 'Chromebook' in hostname:
            return 'Chrome OS'
        return 'Unknown'

    clients: List[Dict] = []
    for _ in range(count):
        hostname = gen_hostname()
        ap = random.choice(ap_list)
        wlan = random.choice(wlan_list)
        os_name = os_from_device(hostname)
        clients.append({
            'hostname': hostname,
            'modelName': 'Unknown',
            'ipAddress': f"10.{random.randint(160,162)}.{random.randint(15,24)}.{random.randint(100,199)} /::",
            'macAddress': gen_mac(),
            'wlan': wlan,
            'apName': ap['name'],
            'apMac': ap['mac'],
            'dataUsage': rand(100, 2000),
            'os': os_name,
            'deviceType': 'phone' if ('iPhone' in hostname or 'Samsung' in hostname) else 'laptop',
        })
    clients.sort(key=lambda c: c['dataUsage'], reverse=True)
    return clients


def generate_host_usage(count: int = 10) -> List[Dict]:
    hosts: List[Dict] = []
    for _ in range(count):
        hosts.append({ 'hostname': f"HOST-{random.randint(1000,9999)}", 'dataUsage': rand(200, 1500) })
    hosts.sort(key=lambda h: h['dataUsage'], reverse=True)
    return hosts


def generate_load_points(hours: int = 1) -> List[Dict]:
    data: List[Dict] = []
    start_time = datetime.utcnow() - timedelta(hours=hours)
    total_minutes = hours * 60
    for i in range(total_minutes + 1):
        ts = start_time + timedelta(minutes=i)
        time_ratio = i / total_minutes if total_minutes else 0
        base24 = 0.3 + (random.random() - 0.5) * 0.1 + (0.2 * (random.random()))
        base5 = 0.25 + (random.random() - 0.5) * 0.08 + (0.15 * (random.random()))
        base65 = 0.02 + (random.random() - 0.5) * 0.005 + (0.01 * (random.random()))
        data.append({
            'timestamp': ts,
            'band24G': round(max(0.0, base24), 2),
            'band5G': round(max(0.0, base5), 2),
            'band6G5G': round(max(0.0, base65), 2),
        })
    return data


def write_points(client: InfluxDBClient, points: List[Point], *, org: str, bucket: str):
    write_api = client.write_api(write_options=SYNCHRONOUS)
    if points:
        write_api.write(bucket=bucket, org=org, record=points)


def seed_influx(
    hours: int = 1,
    client_count: int = 100,
    *,
    url: Optional[str] = None,
    token: Optional[str] = None,
    org: Optional[str] = None,
    bucket: Optional[str] = None,
):
    url = url or settings.influxdb_url
    token = token or settings.influxdb_token
    org = org or settings.influxdb_org
    bucket = bucket or settings.influxdb_bucket

    client = InfluxDBClient(url=url, token=token, org=org)
    points: List[Point] = []

    venue = generate_venue()

    # Venue metrics
    points.append(
        Point('venue_metrics')
            .tag('venueId', 'main-venue')
            .field('totalZones', venue['totalZones'])
            .field('totalAPs', venue['totalAPs'])
            .field('totalClients', venue['totalClients'])
            .field('avgExperienceScore', venue['avgExperienceScore'])
            .field('slaCompliance', venue['slaCompliance'])
            .time(datetime.utcnow())
    )

    # Zone metrics
    for z in venue['zones']:
        points.append(
            Point('zone_metrics')
                .tag('zoneId', z['id'])
                .tag('zoneName', z['name'])
                .tag('venueId', 'main-venue')
                .field('totalAPs', z['totalAPs'])
                .field('connectedAPs', z['connectedAPs'])
                .field('disconnectedAPs', z['disconnectedAPs'])
                .field('clients', z['clients'])
                .field('apAvailability', z['apAvailability'])
                .field('clientsPerAP', z['clientsPerAP'])
                .field('experienceScore', z['experienceScore'])
                .field('utilization', z['utilization'])
                .field('rxDesense', z['rxDesense'])
                .field('netflixScore', z['netflixScore'])
                .time(datetime.utcnow())
        )

    # AP + Radio metrics per zone
    for idx, z in enumerate(venue['zones']):
        ap_bundle = generate_ap_data_for_zone(z, idx)
        for ap in ap_bundle['list']:
            points.append(
                Point('ap_metrics')
                    .tag('apMac', ap['mac'])
                    .tag('apName', ap['name'])
                    .tag('model', ap['model'])
                    .tag('zoneId', ap['zoneId'])
                    .tag('zoneName', ap['zoneName'])
                    .tag('status', ap['status'])
                    .tag('ip', ap['ip'])
                    .field('clientCount', ap['clientCount'])
                    .field('channelUtilization', ap['channelUtilization'])
                    .field('airtimeUtilization', ap['airtimeUtilization'])
                    .field('cpuUtilization', ap['cpuUtilization'])
                    .field('memoryUtilization', ap['memoryUtilization'])
                    .field('firmwareVersion', ap['firmwareVersion'])
                    .field('serialNumber', ap['serialNumber'])
                    .time(datetime.utcnow())
            )
            for radio in ap['radios']:
                points.append(
                    Point('radio_metrics')
                        .tag('apMac', ap['mac'])
                        .tag('zoneId', ap['zoneId'])
                        .tag('band', radio['band'])
                        .field('channel', radio['channel'])
                        .field('txPower', radio['txPower'])
                        .field('noiseFloor', radio['noiseFloor'])
                        .field('clientCount', radio['clientCount'])
                        .time(datetime.utcnow())
                )

    # Client metrics
    for client_row in generate_clients(client_count):
        points.append(
            Point('client_metrics')
                .tag('macAddress', client_row['macAddress'])
                .tag('apMac', client_row['apMac'])
                .tag('apName', client_row['apName'])
                .tag('zoneId', 'zone-001')
                .tag('wlan', client_row['wlan'])
                .tag('os', client_row['os'])
                .tag('deviceType', client_row['deviceType'])
                .field('hostname', client_row['hostname'])
                .field('modelName', client_row['modelName'])
                .field('ipAddress', client_row['ipAddress'])
                .field('dataUsage', float(f"{client_row['dataUsage']:.1f}"))
                .time(datetime.utcnow())
        )

    # Host usage
    for host in generate_host_usage(10):
        points.append(
            Point('host_usage')
                .tag('hostname', host['hostname'])
                .field('dataUsage', float(f"{host['dataUsage']:.1f}"))
                .time(datetime.utcnow())
        )

    # OS distribution as derived (optional write for caching)
    for item in OS_LIST:
        points.append(
            Point('os_distribution')
                .tag('os', item['os'])
                .field('percentage', item['percentage'])
                .field('color', item['color'])
                .time(datetime.utcnow())
        )

    # Disconnect cause codes
    for code, desc in CAUSE_CODE_DESCRIPTIONS.items():
        base_count = rand(10, 100)
        if code == 25:
            base_count = rand(150, 300)
        impact = rand(70, 95) if code == 25 else rand(20, 60)
        points.append(
            Point('disconnect_codes')
                .tag('code', str(code))
                .tag('zoneId', 'zone-001')
                .field('description', desc)
                .field('count', int(base_count))
                .field('impactScore', float(f"{impact:.1f}"))
                .time(datetime.utcnow())
        )

    # Anomalies from zone data
    now = datetime.utcnow()
    for i, z in enumerate(venue['zones']):
        if z['clientsPerAP'] > 4:
            points.append(
                Point('anomalies')
                    .tag('anomalyId', f"anomaly-{i}-1")
                    .tag('type', 'high_client_density')
                    .tag('severity', 'critical' if z['clientsPerAP'] > 5 else 'major')
                    .tag('zoneId', z['id'])
                    .tag('affectedZone', z['name'])
                    .field('description', f"High client density detected: {z['clientsPerAP']:.2f} clients per AP")
                    .field('metric', 'clients_per_ap')
                    .field('value', float(f"{z['clientsPerAP']:.2f}"))
                    .time(now - timedelta(hours=random.randint(0, 24)))
            )
        if z['rxDesense'] > 10:
            points.append(
                Point('anomalies')
                    .tag('anomalyId', f"anomaly-{i}-2")
                    .tag('type', 'interference')
                    .tag('severity', 'warning')
                    .tag('zoneId', z['id'])
                    .tag('affectedZone', z['name'])
                    .field('description', f"High RxDesense detected: {z['rxDesense']:.1f}%")
                    .field('metric', 'rx_desense')
                    .field('value', float(f"{z['rxDesense']:.1f}"))
                    .time(now - timedelta(hours=random.randint(0, 24)))
            )
        if z['experienceScore'] < 70:
            points.append(
                Point('anomalies')
                    .tag('anomalyId', f"anomaly-{i}-3")
                    .tag('type', 'poor_experience')
                    .tag('severity', 'critical')
                    .tag('zoneId', z['id'])
                    .tag('affectedZone', z['name'])
                    .field('description', f"Poor experience score: {z['experienceScore']:.1f}")
                    .field('metric', 'experience_score')
                    .field('value', float(f"{z['experienceScore']:.1f}"))
                    .time(now - timedelta(hours=random.randint(0, 24)))
            )

    # Band load points (as time series per band)
    load_points = generate_load_points(hours)
    for lp in load_points:
        ts = lp['timestamp']
        points.append(Point('band_load').tag('band', '2.4G').field('band24G', lp['band24G']).field('band5G', 0.0).field('band6G5G', 0.0).time(ts))
        points.append(Point('band_load').tag('band', '5G').field('band24G', 0.0).field('band5G', lp['band5G']).field('band6G5G', 0.0).time(ts))
        points.append(Point('band_load').tag('band', '6G/5G').field('band24G', 0.0).field('band5G', 0.0).field('band6G5G', lp['band6G5G']).time(ts))

    # Time series metrics (experienceScore) per zone hourly for hours
    for z in venue['zones']:
        for i in range(hours + 1):
            ts = datetime.utcnow() - timedelta(hours=(hours - i))
            value = max(0.0, z['experienceScore'] + rand(-5, 5))
            points.append(
                Point('metrics')
                    .tag('metric', 'experienceScore')
                    .tag('zoneId', z['id'])
                    .tag('zoneName', z['name'])
                    .field('value', float(f"{value:.1f}"))
                    .time(ts)
            )

    # Write all points
    write_points(client, points, org=org, bucket=bucket)
    client.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Seed InfluxDB with demo data')
    parser.add_argument('--hours', type=int, default=1, help='Hours of time-series data to generate')
    parser.add_argument('--clients', type=int, default=120, help='Number of client records to generate')
    parser.add_argument('--url', type=str, default=None, help='InfluxDB URL (overrides default)')
    parser.add_argument('--org', type=str, default=None, help='InfluxDB org (overrides default)')
    parser.add_argument('--bucket', type=str, default=None, help='InfluxDB bucket (overrides default)')
    parser.add_argument('--token', type=str, default=None, help='InfluxDB token (overrides default)')
    args = parser.parse_args()

    random.seed()
    print(f"Seeding InfluxDB -> url={args.url or settings.influxdb_url}, org={args.org or settings.influxdb_org}, bucket={args.bucket or settings.influxdb_bucket}")
    try:
        seed_influx(
            hours=max(1, args.hours),
            client_count=max(1, args.clients),
            url=args.url,
            token=args.token,
            org=args.org,
            bucket=args.bucket,
        )
        print('Seeding completed successfully.')
    except Exception as e:
        print(f"Seeding failed: {e}")
        raise

