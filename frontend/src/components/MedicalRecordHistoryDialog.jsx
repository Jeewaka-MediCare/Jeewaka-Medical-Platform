import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import '../styles/dialogWide.css';
import { diffLines } from 'diff';
import { Button } from '@/components/ui/button';
import { History, FileText } from 'lucide-react';
import MedicalRecordsAPI from '../services/medicalRecordsApi';

export default function MedicalRecordHistoryDialog({ recordId, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    if (open && recordId) {
      setLoading(true);
      setError(null);
      MedicalRecordsAPI.getVersionHistory(recordId, 20).then((result) => {
        if (result.success) {
          setVersions(result.data.versions || result.data); // API may return { versions: [...] } or just [...]
        } else {
          setError(result.error || 'Failed to load version history');
        }
        setLoading(false);
      });
    }
  }, [open, recordId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="dialog-wide w-full max-w-[70vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Record Version History
          </DialogTitle>
          <DialogDescription>
            All previous versions of this medical record, including change notes and timestamps.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-gray-700">Loading version history...</div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">{error}</div>
        ) : (
          <div className="space-y-4">
            {versions.length === 0 ? (
              <div className="text-center text-gray-700">No version history found.</div>
            ) : (
              versions.map((v, idx) => {
                let diff = null;
                // Reverse the diff order: compare current to previous (before, after)
                if (idx < versions.length - 1) {
                  const prev = versions[idx + 1];
                  diff = diffLines(prev.content || '', v.content || '');
                }
                return (
                  <div key={v.versionNumber} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">
                        Version {v.versionNumber}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(v.createdAt).toLocaleString()}
                        {v.createdBy?.name && ` • Dr. ${v.createdBy.name}`}
                      </div>
                    </div>
                    <div className="mb-2 text-sm text-gray-800">
                      {v.changeDescription || <span className="italic text-gray-400">No change note</span>}
                    </div>
                    {/* Show diff for all but the first version, and only if there are changes */}
                    {idx < versions.length - 1 && diff && diff.some(part => part.added || part.removed) && (
                      <div className="mb-2 text-xs">
                        <span className="font-semibold text-gray-900">What was updated:</span>
                        <pre className="whitespace-pre-wrap break-words mt-1">
                          {diff.map((part, i) => (
                            <span
                              key={i}
                              style={{
                                backgroundColor: part.added
                                  ? '#d1fae5'
                                  : part.removed
                                  ? '#fee2e2'
                                  : undefined,
                                color: part.added
                                  ? '#065f46'
                                  : part.removed
                                  ? '#991b1b'
                                  : '#222',
                                textDecoration: part.removed ? 'line-through' : undefined,
                              }}
                            >
                              {part.value}
                            </span>
                          ))}
                        </pre>
                      </div>
                    )}
                    {/* For the oldest version, show initial content only */}
                    {idx === versions.length - 1 && (
                      <div className="mb-2 text-xs text-gray-500 italic">Initial content</div>
                    )}
                    <div className="prose prose-sm max-w-none bg-gray-50 rounded p-2 border">
                      <pre className="whitespace-pre-wrap break-words text-xs text-gray-900">{v.content}</pre>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// You must install 'diff' package: npm install diff
