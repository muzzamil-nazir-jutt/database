// routes/equipmentRoutes.js
// Mounts all equipment-related API endpoints.
// Each route maps to a controller function — no logic lives here.

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/equipmentController');
const pdfCtrl  = require('../controllers/pdfController');

// ─── Equipment CRUD Routes ───────────────────────────────────────────────────

// POST   /api/add-equipment          → Create a new equipment record
router.post('/add-equipment', ctrl.addEquipment);

// GET    /api/all-equipment          → Retrieve all equipment (mobile sync endpoint)
router.get('/all-equipment', ctrl.getAllEquipment);

// GET    /api/equipment/:asset_number → Retrieve single record by asset_number
router.get('/equipment/:asset_number', ctrl.getEquipmentByAssetNumber);

// PUT    /api/equipment/:asset_number → Update a record by asset_number
router.put('/equipment/:asset_number', ctrl.updateEquipment);

// DELETE /api/equipment/:asset_number → Delete a record by asset_number
router.delete('/equipment/:asset_number', ctrl.deleteEquipment);

// ─── Phase 2: PDF Generation ─────────────────────────────────────────────────
// GET    /api/download-qrs           → Stream PDF of all equipment QR labels
router.get('/download-qrs', pdfCtrl.downloadQrPdf);

module.exports = router;
