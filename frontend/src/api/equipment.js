// src/api/equipment.js
// Axios-based API client pointing to the live Render backend

import axios from 'axios';

// Connects to the live Render backend API
const API_BASE_URL = 'https://voltsync-api.onrender.com/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000, // Increased timeout for Render free tier spin-up
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

/** Trigger PDF download. */
export const downloadQrPdf = () => {
  window.open(`${API_BASE_URL}/download-qrs`, '_blank');
};

/** Health check. */
export const checkHealth = () =>
  API.get('/health').then((r) => r.data.data);
