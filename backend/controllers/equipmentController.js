// controllers/equipmentController.js
// Business logic layer — validates input, calls the model, shapes responses.
// All controller functions are async to handle knex Promises cleanly.

const model = require('../models/equipmentModel');

// ─── Allowed Status Values ──────────────────────────────────────────────────
const VALID_STATUSES = ['Working', 'Maintenance', 'Faulty'];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Trim and collapse internal whitespace. */
function sanitize(str) {
  return typeof str === 'string' ? str.trim().replace(/\s+/g, ' ') : '';
}

/** Standard JSON success response. */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/** Standard JSON error response. */
function fail(res, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error: message });
}

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/add-equipment
 * Creates a new equipment entry after strict input validation.
 */
async function addEquipment(req, res) {
  try {
    const { asset_number, name, model: mdl, specs, description, status } = req.body;

    // Required fields
    if (!sanitize(asset_number)) {
      return fail(res, 'asset_number is required and must be a non-empty string.');
    }
    if (!sanitize(name)) {
      return fail(res, 'name is required and must be a non-empty string.');
    }
    if (!sanitize(mdl)) {
      return fail(res, 'model is required and must be a non-empty string.');
    }

    // asset_number format: letters, digits, hyphens, underscores only
    const assetNumberClean = sanitize(asset_number).toUpperCase();
    if (!/^[A-Z0-9\-_]+$/.test(assetNumberClean)) {
      return fail(
        res,
        'asset_number may only contain letters, numbers, hyphens, and underscores (e.g., PP-TURB-001).'
      );
    }

    // Status validation
    const statusClean = sanitize(status) || 'Working';
    if (!VALID_STATUSES.includes(statusClean)) {
      return fail(res, `status must be one of: ${VALID_STATUSES.join(', ')}.`);
    }

    // Uniqueness check
    if (await model.assetNumberExists(assetNumberClean)) {
      return fail(
        res,
        `asset_number "${assetNumberClean}" already exists. It must be unique.`,
        409
      );
    }

    const newRecord = {
      asset_number: assetNumberClean,
      name:         sanitize(name),
      model:        sanitize(mdl),
      specs:        sanitize(specs) || null,
      description:  sanitize(description) || null,
      status:       statusClean,
    };

    const created = await model.createEquipment(newRecord);
    return success(res, created, 201);

  } catch (err) {
    console.error('[addEquipment] Unexpected error:', err.message);
    return fail(res, 'Internal server error.', 500);
  }
}

/**
 * GET /api/all-equipment
 * Returns the full equipment list — the primary mobile sync endpoint.
 */
async function getAllEquipment(req, res) {
  try {
    const records = await model.getAllEquipment();
    return success(res, records);
  } catch (err) {
    console.error('[getAllEquipment] Unexpected error:', err.message);
    return fail(res, 'Internal server error.', 500);
  }
}

/**
 * GET /api/equipment/:asset_number
 * Returns a single record by its asset_number.
 */
async function getEquipmentByAssetNumber(req, res) {
  try {
    const assetNumberClean = req.params.asset_number.toUpperCase();
    const record = await model.findByAssetNumber(assetNumberClean);
    if (!record) {
      return fail(res, `No equipment found with asset_number "${assetNumberClean}".`, 404);
    }
    return success(res, record);
  } catch (err) {
    console.error('[getEquipmentByAssetNumber] Unexpected error:', err.message);
    return fail(res, 'Internal server error.', 500);
  }
}

/**
 * PUT /api/equipment/:asset_number
 * Updates an existing equipment record — partial update supported.
 */
async function updateEquipment(req, res) {
  try {
    const assetNumberClean = req.params.asset_number.toUpperCase();

    if (!(await model.assetNumberExists(assetNumberClean))) {
      return fail(res, `No equipment found with asset_number "${assetNumberClean}".`, 404);
    }

    const { name, model: mdl, specs, description, status } = req.body;
    const fields = {};

    if (name        !== undefined) fields.name        = sanitize(name);
    if (mdl         !== undefined) fields.model       = sanitize(mdl);
    if (specs       !== undefined) fields.specs       = sanitize(specs) || null;
    if (description !== undefined) fields.description = sanitize(description) || null;
    if (status      !== undefined) {
      const statusClean = sanitize(status);
      if (!VALID_STATUSES.includes(statusClean)) {
        return fail(res, `status must be one of: ${VALID_STATUSES.join(', ')}.`);
      }
      fields.status = statusClean;
    }

    if (Object.keys(fields).length === 0) {
      return fail(res, 'No valid fields provided for update.');
    }

    const updated = await model.updateEquipment(assetNumberClean, fields);
    return success(res, updated);

  } catch (err) {
    console.error('[updateEquipment] Unexpected error:', err.message);
    return fail(res, 'Internal server error.', 500);
  }
}

/**
 * DELETE /api/equipment/:asset_number
 * Permanently deletes an equipment record.
 */
async function deleteEquipment(req, res) {
  try {
    const assetNumberClean = req.params.asset_number.toUpperCase();
    const deleted = await model.deleteEquipment(assetNumberClean);

    if (!deleted) {
      return fail(res, `No equipment found with asset_number "${assetNumberClean}".`, 404);
    }
    return success(res, { message: `Equipment "${assetNumberClean}" deleted successfully.` });

  } catch (err) {
    console.error('[deleteEquipment] Unexpected error:', err.message);
    return fail(res, 'Internal server error.', 500);
  }
}

module.exports = {
  addEquipment,
  getAllEquipment,
  getEquipmentByAssetNumber,
  updateEquipment,
  deleteEquipment,
};
