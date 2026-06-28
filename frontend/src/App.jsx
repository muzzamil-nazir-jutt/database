// src/App.jsx
import { useState, useEffect } from 'react';
import {
  getAllEquipment,
  addEquipment,
  updateEquipment,
  deleteEquipment,
  downloadQrPdf,
  checkHealth
} from './api/equipment';
import StatsBar from './components/StatsBar';
import StatusBadge from './components/StatusBadge';
import Toast from './components/Toast';

export default function App() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Form State
  const [formData, setFormData] = useState({
    asset_number: '',
    name: '',
    model: '',
    specs: '',
    description: '',
    status: 'Working',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await checkHealth();
      setApiOnline(true);
      const data = await getAllEquipment();
      setEquipment(data);
    } catch (err) {
      setApiOnline(false);
      showToast(err.message || 'Failed to connect to the backend server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        await checkHealth();
        setApiOnline(true);
      } catch {
        setApiOnline(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.asset_number || !formData.name || !formData.model) {
      showToast('Asset Number, Name, and Model are required.', 'error');
      return;
    }

    setFormLoading(true);
    try {
      if (isEditing) {
        // Update - asset_number remains unchanged, preserving the QR code
        const updated = await updateEquipment(formData.asset_number, {
          name: formData.name,
          model: formData.model,
          specs: formData.specs,
          description: formData.description,
          status: formData.status,
        });
        showToast(`Equipment ${updated.asset_number} updated successfully!`, 'success');
        setIsEditing(false);
      } else {
        // Create new
        const created = await addEquipment(formData);
        showToast(`Equipment ${created.asset_number} added successfully!`, 'success');
      }
      
      setFormData({
        asset_number: '',
        name: '',
        model: '',
        specs: '',
        description: '',
        status: 'Working',
      });
      
      const data = await getAllEquipment();
      setEquipment(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setFormData({
      asset_number: item.asset_number,
      name: item.name,
      model: item.model,
      specs: item.specs || '',
      description: item.description || '',
      status: item.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      asset_number: '',
      name: '',
      model: '',
      specs: '',
      description: '',
      status: 'Working',
    });
  };

  const handleDeleteClick = async (assetNumber) => {
    if (!window.confirm(`Are you sure you want to delete asset ${assetNumber}?`)) {
      return;
    }

    try {
      await deleteEquipment(assetNumber);
      showToast(`Asset ${assetNumber} deleted successfully.`, 'success');
      if (isEditing && formData.asset_number === assetNumber) {
        handleCancelEdit();
      }
      const data = await getAllEquipment();
      setEquipment(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ─── Export Database to JSON File ──────────────────────────────────────────
  const handleExportDatabase = () => {
    try {
      if (equipment.length === 0) {
        showToast('No equipment records to export.', 'error');
        return;
      }
      
      // Convert equipment list to JSON string
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(equipment, null, 2)
      )}`;
      
      // Create temporary anchor to trigger download
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `equipment.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      showToast('Database JSON exported successfully! Upload this file to GitHub.', 'success');
    } catch (err) {
      showToast('Failed to export database.', 'error');
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.asset_number.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.model.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-navy-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                VoltSync <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/20">Admin</span>
              </h1>
              <p className="text-xxs text-slate-400 hidden sm:block">Power Plant Equipment Tracking System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Export JSON Button */}
            <button
              onClick={handleExportDatabase}
              disabled={equipment.length === 0}
              className={`btn-secondary flex items-center gap-2 ${equipment.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Export database to JSON file to upload on GitHub"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export JSON (for Cloud Sync)</span>
            </button>

            {/* Global PDF Action Button */}
            <button
              onClick={downloadQrPdf}
              disabled={equipment.length === 0}
              className={`btn-primary ${equipment.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download QR Sheets (PDF)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <StatsBar equipment={equipment} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`glass-card p-6 ${isEditing ? 'glow-border ring-1 ring-cyan-500/30' : ''} transition-all duration-300`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {isEditing ? 'Edit Asset Details' : 'Register New Asset'}
                </h2>
                {isEditing && (
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs text-slate-400 hover:text-white transition-colors underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Asset Number (Locked when editing) */}
                <div>
                  <label className="form-label">Asset Number</label>
                  <input
                    type="text"
                    name="asset_number"
                    value={formData.asset_number}
                    onChange={handleInputChange}
                    placeholder="e.g. PP-TURB-001"
                    disabled={isEditing}
                    className={`form-input uppercase ${isEditing ? 'opacity-60 cursor-not-allowed bg-white/[0.02]' : ''}`}
                    required
                  />
                  {isEditing ? (
                    <p className="text-xxs text-amber-400/80 mt-1">Asset code is locked to preserve the printed QR code.</p>
                  ) : (
                    <p className="text-xxs text-slate-500 mt-1">Unique alphanumeric code. Cannot be changed later.</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Equipment Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Steam Turbine Alpha"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Model / Manufacturer</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g. Siemens-SST-600"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Operational Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input appearance-none bg-no-repeat bg-right"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                      backgroundSize: '1.25rem',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="Working" className="bg-navy-900 text-slate-200">Working</option>
                    <option value="Maintenance" className="bg-navy-900 text-slate-200">Maintenance</option>
                    <option value="Faulty" className="bg-navy-900 text-slate-200">Faulty</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Technical Specs</label>
                  <input
                    type="text"
                    name="specs"
                    value={formData.specs}
                    onChange={handleInputChange}
                    placeholder="e.g. Output: 150MW, RPM: 3000"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Equipment Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide operational logs, location details, or maintenance history..."
                    rows={4}
                    className="form-input resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary w-full mt-2"
                >
                  {formLoading ? (
                    <div className="spinner" />
                  ) : isEditing ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Equipment</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Table Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input pl-9"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto self-start md:self-auto">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 hidden sm:inline">Filter:</span>
                {['All', 'Working', 'Maintenance', 'Faulty'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === status
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-white/[0.03] text-slate-400 border border-white/[0.04] hover:bg-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset Info</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Model</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Specs</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-3">
                            <div className="spinner !w-6 !h-6" />
                            <span className="text-sm font-medium">Loading inventory...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredEquipment.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-500">
                            <svg className="w-10 h-10 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <span className="text-sm font-medium">No matching equipment found.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEquipment.map((item) => (
                        <tr key={item.id} className="table-row-hover">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white text-sm">{item.name}</div>
                            <div className="text-xs font-mono text-cyan-400/80 mt-0.5">{item.asset_number}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">{item.model}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 max-w-[180px] truncate" title={item.specs}>
                            {item.specs || '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditClick(item)}
                                className="btn-secondary !px-2.5 !py-1 text-xs font-medium flex items-center gap-1"
                              >
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item.asset_number)}
                                className="btn-danger flex items-center gap-1"
                              >
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
