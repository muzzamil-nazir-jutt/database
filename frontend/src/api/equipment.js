// src/api/equipment.js
// Axios-based API client for all equipment operations.
// All calls point to the Node.js backend at localhost:3001.

import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptors ────────────────────────────────────────────────────────────
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ─── Equipment API ───────────────────────────────────────────────────────────

/** Fetch all equipment records. */
export const getAllEquipment = () =>
  API.get('/all-equipment').then((r) => r.data.data);

/** Add a new equipment record. */
export const addEquipment = (payload) =>
  API.post('/add-equipment', payload).then((r) => r.data.data);

/** Update an existing equipment record. */
export const updateEquipment = (assetNumber, payload) =>
  API.put(`/equipment/${assetNumber}`, payload).then((r) => r.data.data);

/** Delete an equipment record. */
export const deleteEquipment = (assetNumber) =>
  API.delete(`/equipment/${assetNumber}`).then((r) => r.data.data);

/** Trigger PDF download — opens in new tab / browser download. */
export const downloadQrPdf = () => {
  window.open('http://localhost:3001/api/download-qrs', '_blank');
};

/** Health check. */
export const checkHealth = () =>
  API.get('/health').then((r) => r.data.data);
