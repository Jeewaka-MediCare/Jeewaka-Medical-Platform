import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, FileText, History, AlertCircle, ArrowLeft } from 'lucide-react';
import MedicalRecordsAPI from '../services/medicalRecordsApi';

/**
 * MedicalRecordViewer Component
 * Read-only Markdown viewer for medical records
 */
export default function MedicalRecordViewer({ recordId, onBack, onViewHistory }) {
  const [record, setRecord] = useState(null);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (recordId) {
      fetchRecord();
    }
  }, [recordId]);

  const fetchRecord = async () => {
    setLoading(true);
    setError(null);

    const result = await MedicalRecordsAPI.getRecord(recordId);

    if (result.success) {
      setRecord(result.data.record);
      setVersion(result.data.latestVersion);
    } else {
      setError(result.error || 'Failed to load medical record');
    }

    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading medical record...</p>
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
              <h3 className="font-semibold text-lg mb-2">Error Loading Record</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                {onBack && (
                  <Button onClick={onBack} variant="outline">
                    Go Back
                  </Button>
                )}
                <Button onClick={fetchRecord}>Try Again</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Record not found</p>
        {onBack && (
          <Button onClick={onBack} variant="outline" className="mt-4">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  return (
  <div className="w-full max-w-full mx-auto space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Records
          </Button>
        )}
        {onViewHistory && version && (
          <Button onClick={() => onViewHistory(record)} variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            View History ({version.versionNumber} {version.versionNumber === 1 ? 'version' : 'versions'})
          </Button>
        )}
      </div>

      {/* Record Header */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="h-6 w-6 text-primary mt-1" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{record.title}</h1>
                {record.description && (
                  <p className="text-muted-foreground">{record.description}</p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm border-t pt-4">
              {record.createdBy && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created by:</span>
                  <span className="font-medium">
                    Dr. {record.createdBy.name}
                    {record.createdBy.specialization && (
                      <span className="text-muted-foreground text-xs ml-1">
                        ({record.createdBy.specialization})
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{formatDate(record.createdAt)}</span>
              </div>

              {record.updatedAt !== record.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last updated:</span>
                  <span className="font-medium">{formatDate(record.updatedAt)}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {record.tags && record.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {record.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Record Content */}
      <Card>
        <CardContent className="pt-6">
          {version && version.content ? (
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mb-4 text-foreground">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold mb-3 mt-6 text-foreground">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mb-2 mt-4 text-foreground">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-foreground leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-muted p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono">
                        {children}
                      </code>
                    ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full divide-y divide-border">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2 bg-muted font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2 border-t border-border">{children}</td>
                  ),
                }}
              >
                {version.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No content available for this record</p>
            </div>
          )}

          {/* Version Info */}
          {version && (
            <div className="mt-6 pt-6 border-t text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>
                  Version {version.versionNumber} • 
                  Last modified {formatDate(version.createdAt)}
                  {version.createdBy && ` by Dr. ${version.createdBy.name}`}
                </span>
                {version.contentSize && (
                  <span>{(version.contentSize / 1024).toFixed(1)} KB</span>
                )}
              </div>
              {version.changeDescription && (
                <p className="mt-2 italic">
                  Change note: {version.changeDescription}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
