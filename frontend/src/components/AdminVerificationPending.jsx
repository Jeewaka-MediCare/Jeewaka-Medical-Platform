import React, { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Trash2, Clock } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import api from '../services/api';
import useAuthStore from '../store/authStore';


export default function AdminVerificationPending() {
    const location = useLocation();
  console.log("Location state:", location.state);
  console.log('AdminVerificationPending: initialDoctor (from location):', initialDoctor);
  console.log('AdminVerificationPending: initial doctorData state:', doctorData);
    // Support both navigate(state) that passes an object or an array [doctor]
    const initialDoctor = (location.state && (Array.isArray(location.state) ? location.state[0] : location.state)) || {};
  if (!initialDoctor.certificates) initialDoctor.certificates = [];
  const [doctorData, setDoctorData] = useState(initialDoctor);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // On mount or when authUser becomes available, fetch existing verification data and stored documents for this doctor
  const authUser = useAuthStore(state => state.user);

  // helper to resolve a usable doctorId from various shapes
  const resolveDoctorId = (obj) => {
    if (!obj) return null;
    return obj.doctorId || obj._id || obj.id || obj.uuid || obj.userId || null;
  };

  useEffect(() => {
    const loadExisting = async () => {
      try {
  // Prefer explicit doctorId from local state, then fall back to authenticated user
  const doctorId = resolveDoctorId(doctorData) || resolveDoctorId(authUser);
  console.log('AdminVerificationPending: resolved doctorId =', doctorId);
        // If doctorData is empty but we have an authenticated doctor profile, merge it in so UI shows consistent info
        if ((!doctorData || !resolveDoctorId(doctorData)) && authUser) {
          // Merge authUser fields and ensure both _id and doctorId are set for compatibility
          const merged = { ...(doctorData || {}), ...authUser };
          const resolvedId = resolveDoctorId(merged);
          if (resolvedId) {
            merged._id = merged._id || resolvedId;
            merged.doctorId = merged.doctorId || resolvedId;
          }
          setDoctorData(merged);
        }
        if (!doctorId) {
          console.log('AdminVerificationPending: no doctorId resolved, aborting loadExisting. doctorData:', doctorData, 'authUser:', authUser);
          return;
        }

        // Fetch verification record (if any) to populate doctorData
        let verificationFound = false;
        try {
          const verUrl = `/api/admin-verification/${doctorId}`;
          console.log('AdminVerificationPending: about to GET verification at', verUrl);
          const verRes = await api.get(verUrl);
          console.log('AdminVerificationPending: verification GET response:', verRes.data);
          // API returns an array in backend controller; pick first
          const ver = Array.isArray(verRes.data) ? verRes.data[0] : verRes.data;
          console.log('AdminVerificationPending: selected verification object:', ver);
          if (ver) {
            verificationFound = true;
            // Update doctor data with verification fields
            setDoctorData(prev => ({ ...prev, ...ver }));

            // If the verification record includes a certificates array, prefer that as the source of truth
            if (Array.isArray(ver.certificates) && ver.certificates.length > 0) {
              console.log('AdminVerificationPending: verification.certificates (from DB):', ver.certificates);
              const filesFromCerts = ver.certificates.map((c, idx) => ({
                id: `${Date.now()}_cert_${idx}`,
                name: (typeof c === 'string' ? c.split('/').pop() : `certificate_${idx}`),
                url: c,
                uploadedAt: ver.updatedAt || ver.createdAt || new Date().toISOString(),
                raw: c
              }));
              console.log('AdminVerificationPending: filesFromCerts built:', filesFromCerts);
              setUploadedFiles(filesFromCerts);
              // Ensure doctorData.certificates is set from verification
              setDoctorData(prev => ({ ...prev, certificates: ver.certificates }));
            }
          }
        } catch (e) {
          console.error('AdminVerificationPending: verification GET failed:', e?.response?.status, e?.response?.data || e.message || e);
        }

        // If verification record didn't provide certificates, fetch stored documents (signed URLs) from backend storage service
        if (!verificationFound) {
          console.log('AdminVerificationPending: no verificationFound; falling back to storage listing');
          try {
            const docsRes = await api.get(`/api/admin-verification/documents/${doctorId}`);
            console.log('AdminVerificationPending: documents listing response:', docsRes.data);
            const docs = docsRes.data?.documents || [];
            const files = (docs || []).map((d, idx) => ({
              id: `${Date.now()}_${idx}`,
              name: d.name || d.filename || `file_${idx}`,
              url: d.url || d.signedUrl || d.publicUrl || d.path || '',
              uploadedAt: d.uploadedAt || d.lastModified || new Date().toISOString(),
              raw: d
            }));
            setUploadedFiles(files);
            setDoctorData(prev => ({ ...prev, certificates: files.map(f => f.url) }));
          } catch (e) {
            // ignore errors listing files
            console.error('Failed to load existing documents', e);
          }
        }
      } catch (err) {
        console.error('Error loading existing verification data', err);
      }
    };

    loadExisting();
    // Re-run when authUser or location changes (e.g. after page refresh/auth hydration)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, location.key]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // client-side constraints
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];

    const invalid = files.find(f => {
      const ext = (f.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
      return f.size > MAX_SIZE || !allowed.includes(ext);
    });

    if (invalid) {
      if (invalid.size > MAX_SIZE) {
        alert('File too large. Maximum size is 10MB.');
      } else {
        alert('Invalid file type. Only PDF, JPG, PNG, DOC, DOCX files are allowed.');
      }
      return;
    }

    setUploading(true);

    const doctorId = doctorData && doctorData.doctorId;
    if (!doctorId || doctorId === 'undefined') {
      alert('Doctor ID is missing. Please contact support.');
      setUploading(false);
      return;
    }

    try {
      const newUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const form = new FormData();
        form.append('document', file);
        // Upload to backend API
        const res = await api.post(`/api/admin-verification/documents/${doctorId}`, form, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        const body = res.data;
        const doc = body.document || {};
        const newFile = {
          id: Date.now() + i,
          name: doc.filename || file.name,
          url: doc.url || doc.path || '',
          uploadedAt: doc.uploadedAt || new Date().toISOString(),
          raw: doc
        };
        setUploadedFiles(prev => [...prev, newFile]);
        setDoctorData(prev => ({
          ...prev,
          certificates: [...(prev.certificates || []), newFile.url],
          updatedAt: new Date().toISOString()
        }));
        if (newFile.url) newUrls.push(newFile.url);
      }
      // After successful upload(s), persist the certificates list to backend
      try {
        const doctorIdResolved = resolveDoctorId(doctorData) || resolveDoctorId(authUser);
        if (doctorIdResolved) {
          const existing = doctorData.certificates || [];
          const certificatesList = Array.from(new Set([...existing, ...newUrls]));
          await saveCertificates(doctorIdResolved, certificatesList);
        }
      } catch (saveErr) {
        console.error('Failed to auto-save certificates after upload', saveErr);
      }
      alert('Certificates uploaded successfully! Saved to your profile and waiting for admin verification.');
    } catch (error) {
      console.error('Upload error', error);
      const msg = error?.response?.data?.message || error.message || 'Failed to upload document';
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  // Persist certificates list to backend (used after upload/delete)
  async function saveCertificates(doctorId, certificatesList) {
    if (!doctorId) throw new Error('Doctor ID is required to save certificates');
    try {
      // Check if verification exists
      let exists = false;
      try {
        await api.get(`/api/admin-verification/${doctorId}`);
        exists = true;
      } catch (err) {
        exists = false;
      }
      if (exists) {
        await api.put(`/api/admin-verification/${doctorId}`, {
          certificates: certificatesList
        });
      } else {
        await api.post(`/api/admin-verification/`, {
          doctorId,
          certificates: certificatesList
        });
      }
      // Update local state to reflect saved list
      setDoctorData(prev => ({ ...prev, certificates: certificatesList, updatedAt: new Date().toISOString() }));
      return true;
    } catch (error) {
      console.error('Error saving certificates', error);
      throw error;
    }
  }

  const removeFile = async (id) => {
    const fileToRemove = uploadedFiles.find(f => f.id === id);
    if (!fileToRemove) return;
    const doctorId = doctorData && doctorData.doctorId;
    if (!doctorId || doctorId === 'undefined') {
      alert('Doctor ID is missing. Please contact support.');
      return;
    }
    try {
      // Call backend API to delete the file
      await api.delete(`/api/admin-verification/documents/${doctorId}/${encodeURIComponent(fileToRemove.name)}`);
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
      const newCerts = (doctorData.certificates || []).filter(url => url !== fileToRemove.url);
      setDoctorData(prev => ({
        ...prev,
        certificates: newCerts,
        updatedAt: new Date().toISOString()
      }));
      // Persist deletion to backend
      try {
        const did = resolveDoctorId(doctorData) || resolveDoctorId(authUser);
        if (did) await saveCertificates(did, newCerts);
      } catch (saveErr) {
        console.error('Failed to auto-save certificates after delete', saveErr);
      }
    } catch (error) {
      alert('Failed to delete file from storage.');
    }
  };

  const handleSaveCertificates = async () => {
    if (doctorData.certificates.length === 0) {
      alert("Please upload at least one certificate");
      return;
    }
    try {
      const doctorId = doctorData && doctorData.doctorId;
      if (!doctorId || doctorId === 'undefined') {
        alert('Doctor ID is missing. Please contact support.');
        return;
      }
      // Check if verification exists
      let exists = false;
      try {
        await api.get(`/api/admin-verification/${doctorId}`);
        exists = true;
      } catch (err) {
        exists = false;
      }
      if (exists) {
        await api.put(`/api/admin-verification/${doctorId}`, {
          certificates: doctorData.certificates
        });
      } else {
        await api.post(`/api/admin-verification/`, {
          doctorId,
          certificates: doctorData.certificates
        });
      }
      alert("Certificates saved successfully! Waiting for admin verification.");
    } catch (error) {
      alert("Failed to save certificates to backend.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Verification Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Doctor Verification</h1>
              <p className="text-gray-600">Upload your certificates to complete verification process</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              doctorData.isVerified 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {doctorData.isVerified ? '✓ Verified' : '⏳ Pending Verification'}
            </div>
          </div>

          {/* Doctor Data Display */}
          <div className="grid md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-5">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Doctor ID</p>
                <p className="font-mono text-sm text-gray-800">{doctorData.doctorId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Record ID</p>
                <p className="font-mono text-sm text-gray-800">{doctorData._id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Verification Status</p>
                <p className="text-sm font-semibold text-gray-800">
                  {doctorData.isVerified ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Created At</p>
                <p className="text-sm text-gray-800">{formatDate(doctorData.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</p>
                <p className="text-sm text-gray-800">{formatDate(doctorData.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Version</p>
                <p className="text-sm text-gray-800">v{doctorData.__v}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Comment Section */}
        {doctorData.commentFromAdmin ? (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 mb-6 rounded-r-lg shadow">
            <div className="flex items-start">
              <AlertCircle className="text-blue-500 mr-3 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">Message from Admin</h3>
                <p className="text-blue-700">{doctorData.commentFromAdmin}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 border-l-4 border-gray-400 p-5 mb-6 rounded-r-lg">
            <div className="flex items-center text-gray-600">
              <Clock className="mr-2" size={20} />
              <p className="text-sm">No comments from admin yet</p>
            </div>
          </div>
        )}

        {/* Certificate Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Certificates</h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload your medical certificates and licenses
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Certificates</p>
              <p className="text-3xl font-bold text-blue-600">{doctorData.certificates.length}</p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-500 transition-all hover:bg-blue-50 mb-6">
            <Upload className="mx-auto text-gray-400 mb-4" size={56} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {uploading ? "Uploading..." : "Upload Certificates"}
            </h3>
            <p className="text-gray-500 mb-4">PDF, JPG, PNG files up to 10MB each</p>
            
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <span className="bg-blue-600 text-white px-8 py-3 rounded-lg cursor-pointer hover:bg-blue-700 inline-block font-medium transition-colors disabled:bg-gray-400">
                {uploading ? "Processing..." : "Choose Files"}
              </span>
            </label>
          </div>

          {/* Certificates List */}
          {doctorData.certificates.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 mb-4">
                Uploaded Certificates ({uploadedFiles.length})
              </h3>
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <FileText className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-700 hover:underline break-all"
                      >
                        {file.name}
                      </a>
                      {/* Don't show raw signed URL to avoid clutter; filename is a clickable link */}
                      <p className="text-xs text-gray-400 mt-1">
                        Uploaded: {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 flex items-start">
              <AlertCircle className="text-orange-500 mr-3 flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-semibold text-orange-800 mb-1">No Certificates Uploaded</h4>
                <p className="text-sm text-orange-700">
                  Your certificates array is empty. Please upload at least one certificate to proceed with admin verification.
                </p>
              </div>
            </div>
          )}

          {/* Debug panel - developer only */}
          <div className="mt-6 p-4 bg-gray-50 border rounded text-xs text-gray-700">
            <div className="font-semibold mb-2">Debug (developer):</div>
            <div>
              <strong>doctorData:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(doctorData, null, 2)}</pre>
            </div>
            <div>
              <strong>uploadedFiles:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(uploadedFiles, null, 2)}</pre>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {doctorData.certificates.length > 0 
                ? "Ready to save your certificates" 
                : "Upload certificates to continue"}
            </p>
            <button
              onClick={handleSaveCertificates}
              disabled={doctorData.certificates.length === 0 || uploading}
              className="bg-blue-600 text-white px-10 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              Save Certificates
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <CheckCircle className="text-green-500 mr-2" size={22} />
            Verification Process
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>→ Upload all your medical certificates and licenses</p>
            <p>→ Admin team will review your documents within 24-48 hours</p>
            <p>→ You'll receive an email notification once verified</p>
            <p>→ After verification, your profile will be activated</p>
          </div>
        </div>
      </div>
    </div>
  );
}