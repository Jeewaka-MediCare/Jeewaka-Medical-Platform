import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, User, ChevronRight, AlertCircle } from 'lucide-react';
import MedicalRecordsAPI from '../services/medicalRecordsApi';

/**
 * MedicalRecordsList Component
 * Displays a list of medical records for a patient (read-only view)
 */
export default function MedicalRecordsList({ patientId, onRecordClick }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (patientId) {
      fetchRecords();
    }
  }, [patientId, pagination.page]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);

    const result = await MedicalRecordsAPI.getPatientRecords(
      patientId,
      pagination.page,
      pagination.limit
    );

    if (result.success) {
      setRecords(result.data.records || []);
      if (result.data.pagination) {
        setPagination(prev => ({
          ...prev,
          ...result.data.pagination
        }));
      }
    } else {
      setError(result.error || 'Failed to load medical records');
    }

    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading medical records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Error Loading Records</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchRecords} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Medical Records</h3>
              <p className="text-muted-foreground">
                You don't have any medical records yet. Your doctor will create records during your appointments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Medical Records</h2>
        <span className="text-sm text-muted-foreground">
          {pagination.total} {pagination.total === 1 ? 'record' : 'records'}
        </span>
      </div>

      <div className="grid gap-4">
        {records.map((record) => (
          <Card
            key={record._id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onRecordClick && onRecordClick(record)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{record.title}</h3>
                  </div>
                  {record.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {record.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(record.updatedAt || record.createdAt)}
                  </span>
                </div>
                {record.createdBy && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      Dr. {record.createdBy.name}
                      {record.createdBy.specialization && (
                        <span className="text-xs ml-1">
                          ({record.createdBy.specialization})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {record.tags && record.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {record.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {record.currentVersionId && (
                <div className="mt-3 text-xs text-muted-foreground">
                  Version {record.currentVersionId.versionNumber} • 
                  {record.currentVersionId.contentSize ? 
                    ` ${(record.currentVersionId.contentSize / 1024).toFixed(1)} KB` : 
                    ' Content available'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
