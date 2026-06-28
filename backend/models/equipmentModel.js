// models/equipmentModel.js
// Data-access layer — all SQL queries via knex.
// All functions are async; controllers must await them.

const { db } = require('../config/database');

const TABLE = 'equipment';

/**
 * Insert a new equipment record.
 * @param {Object} data - { asset_number, name, model, specs, description, status }
 * @returns {Object} The newly created row.
 */
async function createEquipment(data) {
  const [id] = await db(TABLE).insert(data);
  return findByAssetNumber(data.asset_number);
}

/**
 * Retrieve all equipment records, ordered newest first.
 * @returns {Array} Array of equipment objects.
 */
async function getAllEquipment() {
  return db(TABLE)
    .select('id', 'asset_number', 'name', 'model', 'specs', 'description', 'status', 'created_at')
    .orderBy('created_at', 'desc');
}

/**
 * Find a single record by its unique asset_number.
 * @param {string} assetNumber
 * @returns {Object|undefined}
 */
async function findByAssetNumber(assetNumber) {
  return db(TABLE)
    .select('id', 'asset_number', 'name', 'model', 'specs', 'description', 'status', 'created_at')
    .where({ asset_number: assetNumber })
    .first();
}

/**
 * Check whether an asset_number already exists.
 * @param {string} assetNumber
 * @returns {boolean}
 */
async function assetNumberExists(assetNumber) {
  const row = await db(TABLE).where({ asset_number: assetNumber }).count('id as cnt').first();
  return parseInt(row.cnt, 10) > 0;
}

/**
 * Update an existing equipment record by asset_number.
 * @param {string} assetNumber
 * @param {Object} fields - Partial or full updatable fields.
 * @returns {Object|undefined} Updated record.
 */
async function updateEquipment(assetNumber, fields) {
  await db(TABLE).where({ asset_number: assetNumber }).update(fields);
  return findByAssetNumber(assetNumber);
}

/**
 * Delete an equipment record by asset_number.
 * @param {string} assetNumber
 * @returns {boolean} True if a row was deleted.
 */
async function deleteEquipment(assetNumber) {
  const count = await db(TABLE).where({ asset_number: assetNumber }).delete();
  return count > 0;
}

module.exports = {
  createEquipment,
  getAllEquipment,
  findByAssetNumber,
  assetNumberExists,
  updateEquipment,
  deleteEquipment,
};
