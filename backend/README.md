# Power Plant Equipment Tracker — Backend

## Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite via `better-sqlite3` (synchronous, zero-config)
- **QR:** `qrcode` (Phase 2)
- **PDF:** `pdfkit` (Phase 2)

## Folder Structure
```
backend/
├── config/
│   └── database.js        # DB connection singleton + schema init
├── controllers/
│   └── equipmentController.js  # Business logic & input validation
├── models/
│   └── equipmentModel.js  # Prepared SQL statements (data-access layer)
├── routes/
│   └── equipmentRoutes.js # HTTP verb → controller mapping
├── data/
│   └── power_plant.db     # Auto-created SQLite file (gitignored)
├── server.js              # App entry point
└── package.json
```

## Running Locally
```bash
cd backend
npm install
npm run dev      # nodemon hot-reload
# or
npm start        # production
```

## API Reference

### Health Check
```
GET /api/health
```

### Add Equipment
```
POST /api/add-equipment
Content-Type: application/json

{
  "asset_number": "PP-TURB-001",
  "name":         "Steam Turbine Alpha",
  "model":        "Siemens-SST-600",
  "specs":        "Output: 150MW, RPM: 3000",
  "description":  "Primary steam turbine for Unit 1 generation block.",
  "status":       "Working"
}
```

### Get All Equipment (Mobile Sync)
```
GET /api/all-equipment
```

### Get Single Equipment
```
GET /api/equipment/:asset_number
```

### Update Equipment
```
PUT /api/equipment/:asset_number
Content-Type: application/json

{
  "status": "Maintenance",
  "description": "Scheduled overhaul Q3 2026."
}
```

### Delete Equipment
```
DELETE /api/equipment/:asset_number
```

## Response Shape
All responses follow:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": "Human-readable message." }
```

## Status Enum
Only these three values are accepted:
- `Working`
- `Maintenance`
- `Faulty`
