import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle, Trash2, Clock } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import api from '../services/api';


export default function AdminVerificationPending() {
  const navigate = useNavigate();
    const location = useLocation();
    console.log("Location state:", location.state);
  const initialDoctor = (location.state && location.state[0]) || {};
  if (!initialDoctor.certificates) initialDoctor.certificates = [];
  const [doctorData, setDoctorData] = useState(initialDoctor);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  // Sync uploadedFiles with doctorData.certificates on mount and when certificates change
  useEffect(() => {
    if (doctorData.certificates && doctorData.certificates.length > 0) {
      // Use a unique id for each file (index + url) to avoid duplicate keys/names
      setUploadedFiles(
        doctorData.certificates.map((url, idx) => {
          let filename = url.split('/').pop() || '';
          if (filename.includes('?')) filename = filename.split('?')[0];
          return {
            id: `${idx}-${filename}`,
            name: filename,
            url,
            uploadedAt: doctorData.updatedAt || new Date().toISOString(),
            raw: { url },
          };
        })
      );
    } else {
      setUploadedFiles([]);
    }
  }, [doctorData.certificates, doctorData.updatedAt]);
  const [uploading, setUploading] = useState(false);

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
      }
      alert('Certificates uploaded successfully! Waiting for admin verification.');
    } catch (error) {
      console.error('Upload error', error);
      const msg = error?.response?.data?.message || error.message || 'Failed to upload document';
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

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
      setDoctorData(prev => ({
        ...prev,
        certificates: prev.certificates.filter(url => url !== fileToRemove.url),
        updatedAt: new Date().toISOString()
      }));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top bar with login redirection button */}
      <div className="w-full flex justify-end items-center h-16 px-6 bg-white/80 shadow-sm sticky top-0 z-20">
        <button
          onClick={() => navigate('/login')}
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          className="px-6 py-2 rounded-lg font-semibold shadow hover:brightness-90 transition-colors"
        >
          Back to Login
        </button>
      </div>
      <div className="max-w-5xl mx-auto py-8 px-4">
        
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

        {/* Admin Comment Section */}
        <div className="mt-6">
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
        </div>

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
              <span
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                className="px-8 py-3 rounded-lg cursor-pointer hover:brightness-90 inline-block font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
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
                        download={file.name}
                        className="font-semibold text-blue-700 hover:underline break-all"
                      >
                        {file.name}
                      </a>
                      <p className="text-xs text-gray-500 break-all">{file.url}</p>
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
              style={doctorData.certificates.length === 0 || uploading
                ? { backgroundColor: '#94a3b8', color: '#fff', cursor: 'not-allowed' }
                : { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              className={`px-10 py-3 rounded-lg font-semibold shadow-lg transition-colors hover:shadow-xl ${doctorData.certificates.length === 0 || uploading ? '' : 'hover:brightness-90'}`}
            >
              Save Certificates
            </button>
          </div>
        </div>

        
      </div>
    </div>
  );
}