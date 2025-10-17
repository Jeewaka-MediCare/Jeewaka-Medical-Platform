import { supabase } from './supabaseClient';

const BUCKET = 'verification-documents';

// Upload a certificate file to Supabase Storage under the doctor's folder
export async function uploadCertificateFile(doctorId, file) {
  const filePath = `${doctorId}/${file.name}`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    upsert: true // Overwrite if file with same name exists
  });
  if (error) throw error;
  // Get the public URL
  const publicData = supabase.storage.from(BUCKET).getPublicUrl(filePath).data || {};
  return publicData.publicUrl || publicData.publicURL || null;
}

// List all certificate files for a doctor
export async function listCertificateFiles(doctorId) {
  const { data, error } = await supabase.storage.from(BUCKET).list(doctorId + '/');
  if (error) throw error;
  // Return array of { name, url }
  return (data || []).map(item => ({
    name: item.name,
    url: (supabase.storage.from(BUCKET).getPublicUrl(`${doctorId}/${item.name}`).data || {}).publicUrl || null
  }));
}

// Delete a certificate file from Supabase Storage
export async function deleteCertificateFile(doctorId, fileName) {
  const filePath = `${doctorId}/${fileName}`;
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) throw error;
  return true;
}
