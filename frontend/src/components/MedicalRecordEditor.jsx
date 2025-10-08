import { useState, useEffect, useMemo } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, FileText, AlertCircle, History } from 'lucide-react';
import MedicalRecordsAPI from '../services/medicalRecordsApi';
import useAuthStore from '../store/authStore';

/**
 * MedicalRecordEditor Component
 * Markdown editor for doctors to create/edit medical records
 */
export default function MedicalRecordEditor({ 
  patientId, 
  recordId = null, 
  onSave, 
  onCancel,
  onViewHistory
}) {
  const { user, userRole } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(!recordId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tags: [],
    changeDescription: ''
  });
  
  const [tagInput, setTagInput] = useState('');

  // SimpleMDE options
  const editorOptions = useMemo(() => ({
    spellChecker: false,
    placeholder: 'Enter medical record content in Markdown format...',
    status: ['lines', 'words', 'cursor'],
    toolbar: [
      'bold', 'italic', 'heading', '|',
      'quote', 'unordered-list', 'ordered-list', '|',
      'link', 'image', '|',
      'preview', 'side-by-side', 'fullscreen', '|',
      'guide'
    ],
    minHeight: '400px',
  }), []);

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
      const { record, latestVersion } = result.data;
      setFormData({
        title: record.title || '',
        description: record.description || '',
        content: latestVersion?.content || '',
        tags: record.tags || [],
        changeDescription: ''
      });
    } else {
      setError(result.error || 'Failed to load record');
    }

    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title for the record');
      return;
    }

    if (!formData.content.trim()) {
      setError('Please enter content for the record');
      return;
    }

    setSaving(true);
    setError(null);

    let result;
    if (recordId) {
      // Update existing record
      result = await MedicalRecordsAPI.updateRecord(recordId, {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        tags: formData.tags,
        changeDescription: formData.changeDescription || 'Updated record'
      });
    } else {
      // Create new record
      result = await MedicalRecordsAPI.createRecord(patientId, {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        tags: formData.tags
      });
    }

    if (result.success) {
      if (onSave) {
        onSave(result.data);
      }
    } else {
      setError(result.error || 'Failed to save record');
    }

    setSaving(false);
  };

  // Only doctors can edit
  if (userRole !== 'doctor') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Access Denied</h3>
        <p className="text-muted-foreground">
          Only doctors can create or edit medical records.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">
            {recordId ? 'Edit Medical Record' : 'Create New Medical Record'}
          </h2>
        </div>
        <div className="flex gap-2">
          {recordId && onViewHistory && (
            <Button variant="outline" size="sm" onClick={() => onViewHistory({ recordId })}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata Form */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Record Information</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Annual Physical Examination, Follow-up Visit"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief summary of this medical record"
              rows={2}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag (e.g., Cardiology, Diabetes)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Change Description (for updates) */}
          {recordId && (
            <div className="space-y-2">
              <Label htmlFor="changeDescription">Change Description (Optional)</Label>
              <Input
                id="changeDescription"
                placeholder="Describe what changed in this version"
                value={formData.changeDescription}
                onChange={(e) => handleInputChange('changeDescription', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Markdown Editor */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Medical Record Content *</h3>
          <p className="text-sm text-muted-foreground">
            Use Markdown formatting to structure your medical notes
          </p>
        </CardHeader>
        <CardContent>
          <SimpleMDE
            value={formData.content}
            onChange={(value) => handleInputChange('content', value)}
            options={editorOptions}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {recordId ? 'Update Record' : 'Create Record'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
