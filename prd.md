# PRD - NetManager Pro

## PC Inventory & Network Management System

**Version** : 6.0.0
**Date** : 20 Aout 2026
**Statut** : Production

---

## 1. Resume Executif

NetManager Pro est une application web Full-Stack professionnelle de gestion d'inventaire de parc informatique et reseau d'entreprise. Elle offre un tableau de bord ultra-complet pour surveiller, gerer et diagnostiquer l'ensemble des equipements reseau (PC, serveurs, imprimantes, equipements reseau).

---

## 2. Objectifs

| Objectif | Mesure de succes |
|----------|-----------------|
| Inventaire centralise | 100% des equipements du parc enregistres |
| Detection automatique | Scan ARP/ICMP fonctionnel |
| Diagnostic reseau temps reel | Ping et latence pour chaque PC |
| Export des donnees | Export Excel (.xlsx) et CSV |
| Interface moderne | Dashboard responsive Tailwind CSS |
| Accessible en local | Serveur Node.js sur port 3000 |

---

## 3. Architecture Technique

### 3.1 Tech Stack

| Couche | Technologie | Version |
|--------|------------|---------|
| Runtime | Node.js | v20+ |
| Frontend | React | 19 |
| Language | TypeScript | 5.8 |
| Bundler | Vite | 6.x |
| Backend | Express | 4.x |
| Styles | Tailwind CSS | 4.x |
| Icons | Lucide React | 0.546 |
| Export | xlsx (SheetJS) | 0.18.5 |
| Database | SQLite | 11.x |
| Realtime | Socket.IO | 4.x |
| Auth | JWT | 9.x |

### 3.2 Architecture

```
Frontend (React 19 + TS + Tailwind v4)
  Vite Dev Server -> Proxy -> :3000

Backend (Express - server.ts - Port 3000)
  /api/network/*      scan, local-ip
  /api/usb/*          printers
  /api/diagnostics/*  ping
  /api/devices/*      CRUD inventaire
  /api/auth/*         JWT login/logout
  /api/dashboard/*    KPI
  /api/logs/*         security logs
  Socket.IO           metrics live

Database (SQLite - netmanager.db)
  devices           inventaire equipements
  users             comptes utilisateurs
  security_logs     journaux securite
  audit_logs        traçabilite
  refresh_tokens    sessions JWT
```

### 3.3 Scripts NPM

| Script | Commande | Description |
|--------|----------|-------------|
| dev | tsx server.ts | Serveur dev avec HMR |
| build | vite build && esbuild server.ts | Build prod frontend + backend |
| start | node dist/server.cjs | Lancer en production |

---

## 4. Fonctionnalites

### 4.1 Tableau de Bord (KPI Dashboard)

- Compteur total d'equipements
- Equipements en ligne / hors ligne / avertissement
- Memoire RAM totale allouee
- Utilisation moyenne des disques
- Repartition des OS
- Sante materiel (antivirus, firewall)
- Topologie reseau visuelle

### 4.2 Inventaire Complet (InventoryTableView)

#### Colonnes du tableau :

| N | Colonne | Source | Type |
|---|---------|--------|------|
| 1 | N | Index auto | number |
| 2 | NOM | device.name + IP | string |
| 3 | Numero de serie | hardware.serialNumber | string |
| 4 | Marque / Modele | hardware.brandModel | string |
| 5 | Processeur | hardware.cpu | string |
| 6 | Generation CPU | hardware.cpuGen | string |
| 7 | RAM (Go) | hardware.ramGB | number |
| 8 | Disque | hardware.storage | string |
| 9 | Architecture | software.osArchitecture | string |
| 10 | Observation | notes | string |
| 11 | Statut | status | enum |
| 12 | Lieu | location | string |
| 13 | OS | software.osName | string |
| 14 | Actions | boutons action | - |

#### Boutons d'action par PC :

| Action | Icone | Description |
|--------|-------|-------------|
| Voir les details | Eye | Fiche complete de l'equipement |
| Diagnostics / Ping | Activity | Ping reseau vers l'equipement |
| Modifier la fiche | Edit3 | Modal d'edition |
| Supprimer | Trash2 | Suppression avec confirmation |

#### Filtres :

- Recherche globale (nom, IP, MAC, Serie, CPU, OS, lieu)
- Filtre statut : Tous / En ligne / Problemes
- Filtre departement

### 4.3 Export Excel (.xlsx)

- Format Microsoft Excel natif (.xlsx)
- Bibliotheque xlsx (SheetJS)
- Colonnes auto-ajustees
- Fichier : Inventaire_PCs_YYYY-MM-DD.xlsx
- Export CSV complementaire

---

## 5. API Backend

### 5.1 Detection IP Locale

```
GET /api/network/local-ip
```

Reponse :
```json
{
  "localIp": "192.168.1.100",
  "subnet": "192.168.1.0",
  "netmask": "255.255.255.0",
  "interfaceName": "Ethernet",
  "mac": "AA:BB:CC:DD:EE:FF",
  "allInterfaces": []
}
```

### 5.2 Scan Reseau ARP/ICMP

```
POST /api/network/scan
Body: { "subnet": "10.10.0.0", "startIp": 1, "endIp": 254 }
```

Reponse :
```json
{
  "subnet": "10.10.0.0",
  "totalScanned": 254,
  "hostsFound": 45,
  "results": [
    {
      "ip": "10.10.0.1",
      "mac": "AA:BB:CC:DD:EE:FF",
      "hostname": "pc-directeur",
      "reachable": true,
      "latencyMs": 2,
      "vendor": "Dell"
    }
  ]
}
```

### 5.3 Detection Imprimantes USB

```
GET /api/usb/printers
```

Reponse :
```json
{
  "count": 3,
  "usbPrinters": [
    {
      "name": "HP LaserJet Pro M404",
      "port": "USB001",
      "driver": "HP Universal Printing PCL 6",
      "isUSB": true,
      "status": "idle"
    }
  ],
  "allPrinters": []
}
```

### 5.4 Diagnostic Ping

```
POST /api/diagnostics/ping
Body: { "ip": "10.10.0.1", "count": 4 }
```

Reponse :
```json
{
  "output": ["Reply from 10.10.0.1: bytes=32 time=2ms TTL=128"],
  "reachable": true,
  "latencyMs": 2.3,
  "targetIp": "10.10.0.1",
  "packetsSent": 4,
  "packetsReceived": 4,
  "packetLoss": "0%"
}
```

### 5.5 CRUD Equipements

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/devices | Liste paginee avec filtres |
| GET | /api/devices/:id | Detail equipement |
| POST | /api/devices | Creer equipement |
| PUT | /api/devices/:id | Modifier equipement |
| DELETE | /api/devices/:id | Supprimer equipement |
| POST | /api/devices/import | Import bulk |
| POST | /api/devices/clear | Vider inventaire |

### 5.6 Authentification

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/login | Connexion JWT |
| POST | /api/auth/refresh | Rafraichir token |
| POST | /api/auth/logout | Deconnexion |
| GET | /api/auth/me | Profil utilisateur |

### 5.7 Dashboard KPI

```
GET /api/dashboard/kpi
```

Retourne : totalDevices, onlineCount, warningCount, criticalCount, totalRamGB, avgLatencyMs, healthPercent, categories, criticalDevices, osDistribution, security stats.

### 5.8 Logs Securite

```
GET /api/logs?page=1&limit=50&severity=CRITICAL
GET /api/logs/stats
```

---

## 6. Modeles de Donnees

### 6.1 Device (Inventaire)

```
id              TEXT PRIMARY KEY
name            TEXT NOT NULL
category        TEXT (computer/printer/network/server/iot)
type            TEXT (Desktop PC, Laptop, etc.)
ip              TEXT
mac             TEXT
vlan            INTEGER
status          TEXT (online/warning/critical/offline)
uptime          TEXT
latency_ms      REAL
tx_rate         TEXT
rx_rate         TEXT
department      TEXT
assigned_user   TEXT
location        TEXT
notes           TEXT
hardware_json   TEXT (JSON serialise)
software_json   TEXT (JSON serialise)
last_seen       TEXT
created_at      TEXT
updated_at      TEXT
```

### 6.2 HardwareSpecs (JSON)

```
brandModel      string    Dell OptiPlex 7090
cpu             string    Intel Core i7-12700
cpuGen          string    12th Gen
cpuCores        number    12
ramGB           number    16
ramType         string    DDR4
storage         string    512GB NVMe SSD
diskUsagePercent number  65
gpu             string    Intel UHD 770
motherboard     string    Dell 0K3CM8
serialNumber    string    SN12345678
powerSupply     string    200W
macAddress      string    AA:BB:CC:DD:EE:FF
portsCount      number    6
```

### 6.3 SoftwareSpecs (JSON)

```
osName          string    Windows 11 Pro 23H2
osArchitecture  string    64-bit
kernelVersion   string    22631
firmwareVersion string    1.0.5
installedApps   array     [{name, version, publisher, installDate, licenseStatus}]
antivirusStatus string    Active & Updated
firewallEnabled boolean   true
lastPatchDate   string    2026-08-15
```

### 6.4 User

```
id              INTEGER PRIMARY KEY
username        TEXT UNIQUE
password_hash   TEXT
role            TEXT (admin/operator/viewer)
display_name    TEXT
created_at      TEXT
updated_at      TEXT
```

### 6.5 SecurityLog

```
id              TEXT PRIMARY KEY
timestamp       TEXT
severity        TEXT (CRITICAL/WARNING/INFO)
source_ip       TEXT
message         TEXT
message_ar      TEXT
protocol        TEXT
```

---

## 7. Securite

- Authentification JWT (access token 15min + refresh token 7j)
- Roles : admin, operator, viewer
- CORS configure par origine
- Helmet.js pour les headers HTTP
- Rate limiting sur les endpoints sensibles
- Audit logging de toutes les actions

---

## 8. Interface Utilisateur

### 8.1 Design System

- Fond : #0A0D14 (dark navy)
- Cartes : #111520, #151A25
- Bordures : #1E2536
- Texte : #C8CCD4
- Accent cyan : #22D3EE
- Accent emeraude : #34D399
- Accent ambre : #FBBF24
- Accent rouge : #EF4444
- Police : System font sans-serif + mono pour les donnees

### 8.2 Composants

| Composant | Fichier | Description |
|-----------|---------|-------------|
| SidebarNav | SidebarNav.tsx | Navigation laterale |
| HeaderBar | HeaderBar.tsx | Barre superieure |
| KpiDashboardView | KpiDashboardView.tsx | Tableau de bord KPI |
| InventoryTableView | InventoryTableView.tsx | Tableau d'inventaire |
| DeviceDetailModal | DeviceDetailModal.tsx | Fiche detaillee |
| EditDeviceModal | EditDeviceModal.tsx | Modal d'edition |
| AddDeviceModal | AddDeviceModal.tsx | Modal d'ajout |
| IpScanModal | IpScanModal.tsx | Scanner reseau |
| TopologyView | TopologyView.tsx | Carte topologie |
| SecurityLogsView | SecurityLogsView.tsx | Journaux securite |

### 8.3 Navigation

| Section | Cle | Description |
|---------|-----|-------------|
| dashboard | Dashboard KPI | Vue d'ensemble |
| inventory | Inventaire | Tous les equipements |
| computers | PC | Ordinateurs uniquement |
| printers | Imprimantes | Imprimantes et peripheriques |
| network | Reseau | Switch, routeur, firewall |
| servers | Serveurs | Serveurs et stockage |
| topology | Topologie | Carte reseau visuelle |
| security | Securite | Journaux syslog |

---

## 9. Deploiement

### 9.1 Production

```bash
npm run build
NODE_ENV=production node dist/server.cjs
```

Le serveur sert les fichiers statiques depuis dist/ et lance l'API sur le port 3000.

### 9.2 Docker

Le projet inclut un Dockerfile et docker-compose pour le deploiement conteneurise.

### 9.3 Environnement

| Variable | Defaut | Description |
|----------|--------|-------------|
| PORT | 3000 | Port du serveur |
| NODE_ENV | development | Environnement |
| JWT_SECRET | dev-secret | Secret JWT |
| DB_PATH | ./data/netmanager.db | Chemin SQLite |
| SCAN_SUBNET | 10.10.0.0 | Sous-reseau par defaut |

---

## 10. Roadmap

| Phase | Priorite | Fonctionnalite |
|-------|----------|----------------|
| v6.0 | Done | Inventaire complet 14 colonnes |
| v6.0 | Done | Export Excel xlsx |
| v6.0 | Done | Scan ARP/ICMP reseau |
| v6.0 | Done | Detection imprimantes USB |
| v6.0 | Done | Diagnostic Ping |
| v6.1 | High | RDP Web (Guacamole) |
| v6.1 | High | Deploiement Docker |
| v6.2 | Medium | Rapports PDF |
| v6.2 | Medium | Alerte email SMTP |
| v6.3 | Low | API REST publique |
| v6.3 | Low | Plugin Active Directory |
