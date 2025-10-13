# Doctor Verification Document Upload API

This API handles document uploads for doctor verification during the sign-up process. All documents are stored in Supabase storage with a structured folder hierarchy.

## Storage Structure

```
verification-documents/
  └── {doctorId}/
      ├── medical_license_1728654321.pdf
      ├── degree_certificate_1728654456.jpg
      ├── specialization_cert_1728654589.png
      └── identity_proof_1728654723.pdf
```

## Authentication

All endpoints require authentication and appropriate role permissions:
- **Headers Required**: `Authorization: Bearer <JWT_TOKEN>`
- **Allowed Roles**: `doctor`, `admin`

---

## 1. Upload Document

### **Endpoint**: `POST /api/verification/documents/:doctorId`

**Description**: Upload a verification document for a specific doctor.

### **URL Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doctorId` | string | Yes | MongoDB ObjectId of the doctor |

### **Request Headers**
```http
Content-Type: multipart/form-data
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Request Body (FormData)**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document` | File | Yes | Document file to upload |

### **File Constraints**
- **Max Size**: 10MB
- **Allowed Types**: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`
- **Naming**: Original filename + timestamp for uniqueness

### **Example Request (JavaScript)**
```javascript
const formData = new FormData();
formData.append('document', fileInput.files[0]);

const response = await fetch('/api/verification/documents/507f1f77bcf86cd799439011', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  },
  body: formData
});
```

### **Example Request (cURL)**
```bash
curl -X POST \
  http://localhost:5000/api/verification/documents/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@./medical_license.pdf"
```

### **Success Response (200)**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "path": "verification-documents/507f1f77bcf86cd799439011/medical_license_1728654321.pdf",
    "url": "https://supabase-project.supabase.co/storage/v1/object/public/medical-records/verification-documents/507f1f77bcf86cd799439011/medical_license_1728654321.pdf",
    "doctorId": "507f1f77bcf86cd799439011",
    "filename": "medical_license_1728654321.pdf",
    "uploadedAt": "2025-10-11T14:30:21.000Z"
  }
}
```

### **Error Responses**
```json
// 400 - No file uploaded
{
  "message": "No file uploaded"
}

// 400 - Invalid doctor ID
{
  "message": "Doctor ID is required"
}

// 400 - Invalid file type
{
  "message": "Invalid file type. Only PDF, JPG, PNG, DOC, DOCX files are allowed."
}

// 413 - File too large
{
  "message": "File too large. Maximum size is 10MB."
}

// 500 - Upload failed
{
  "message": "Failed to upload document",
  "error": "Storage service error details"
}
```

---

## 2. Get Doctor Documents

### **Endpoint**: `GET /api/verification/documents/:doctorId`

**Description**: Retrieve all documents uploaded by a specific doctor.

### **URL Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doctorId` | string | Yes | MongoDB ObjectId of the doctor |

### **Example Request**
```javascript
const response = await fetch('/api/verification/documents/507f1f77bcf86cd799439011', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
});
```

### **Success Response (200)**
```json
{
  "message": "Documents retrieved successfully",
  "documents": [
    {
      "name": "medical_license_1728654321.pdf",
      "path": "verification-documents/507f1f77bcf86cd799439011/medical_license_1728654321.pdf",
      "size": 2048576,
      "lastModified": "2025-10-11T14:30:21.000Z",
      "url": "https://supabase-project.supabase.co/storage/v1/object/public/medical-records/verification-documents/507f1f77bcf86cd799439011/medical_license_1728654321.pdf"
    },
    {
      "name": "degree_certificate_1728654456.jpg",
      "path": "verification-documents/507f1f77bcf86cd799439011/degree_certificate_1728654456.jpg",
      "size": 1536789,
      "lastModified": "2025-10-11T14:32:15.000Z",
      "url": "https://supabase-project.supabase.co/storage/v1/object/public/medical-records/verification-documents/507f1f77bcf86cd799439011/degree_certificate_1728654456.jpg"
    }
  ]
}
```

### **Error Responses**
```json
// 400 - Missing doctor ID
{
  "message": "Doctor ID is required"
}

// 500 - Retrieval failed
{
  "message": "Failed to retrieve documents",
  "error": "Storage service error details"
}
```

---

## 3. Delete Document

### **Endpoint**: `DELETE /api/verification/documents/:doctorId/:filename`

**Description**: Delete a specific document from a doctor's verification folder.

### **URL Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doctorId` | string | Yes | MongoDB ObjectId of the doctor |
| `filename` | string | Yes | Exact filename to delete |

### **Example Request**
```javascript
const response = await fetch('/api/verification/documents/507f1f77bcf86cd799439011/medical_license_1728654321.pdf', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
});
```

### **Success Response (200)**
```json
{
  "message": "Document deleted successfully",
  "result": {
    "message": "Document deleted successfully",
    "path": "verification-documents/507f1f77bcf86cd799439011/medical_license_1728654321.pdf"
  }
}
```

### **Error Responses**
```json
// 400 - Missing parameters
{
  "message": "Doctor ID and filename are required"
}

// 404 - File not found
{
  "message": "Failed to delete document",
  "error": "File not found"
}

// 500 - Deletion failed
{
  "message": "Failed to delete document",
  "error": "Storage service error details"
}
```

---

## Frontend Integration Example

### **Complete Upload Component (React)**

```jsx
import { useState } from 'react';
import { toast } from 'sonner';

const DocumentUpload = ({ doctorId }) => {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch(`/api/verification/documents/${doctorId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Document uploaded successfully');
        fetchDocuments(); // Refresh document list
      } else {
        toast.error(result.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Network error occurred');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/verification/documents/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const result = await response.json();
      
      if (response.ok) {
        setDocuments(result.documents);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const deleteDocument = async (filename) => {
    try {
      const response = await fetch(`/api/verification/documents/${doctorId}/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        fetchDocuments();
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  return (
    <div className="document-upload">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        disabled={uploading}
      />
      
      {uploading && <p>Uploading...</p>}
      
      <div className="document-list">
        {documents.map(doc => (
          <div key={doc.name} className="document-item">
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              {doc.name}
            </a>
            <button onClick={() => deleteDocument(doc.name)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Environment Variables Required

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_MEDICAL_RECORDS_BUCKET=medical-records
ENABLE_SUPABASE_BACKUP=true
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Role-based access control (doctor/admin)
3. **File Validation**: Strict file type and size restrictions
4. **Unique Naming**: Timestamps prevent filename conflicts
5. **Storage Isolation**: Each doctor has a separate folder
6. **URL Security**: Public URLs are generated securely by Supabase

---

## Error Handling Best Practices

1. **Client-side**: Always check response status before processing
2. **File Validation**: Validate files before upload attempts
3. **Progress Feedback**: Show upload progress to users
4. **Retry Logic**: Implement retry for network failures
5. **User Feedback**: Use toast notifications for status updates