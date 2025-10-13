import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import '../styles/dialogWide.css';
import '../styles/dialogWide.css'; // Ensure this is imported for the custom style
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, List, FileText } from 'lucide-react';
import MedicalRecordsList from './MedicalRecordsList';
import MedicalRecordViewer from './MedicalRecordViewer';
import MedicalRecordEditor from './MedicalRecordEditor';
import MedicalRecordHistoryDialog from './MedicalRecordHistoryDialog';
import useAuthStore from '../store/authStore';

/**
 * MedicalRecordsModal Component
 * Modal wrapper for medical records with role-based views
 * - Patients: View only (List + Viewer)
 * - Doctors: Full access (List + Viewer + Editor)
 */
export default function MedicalRecordsModal({ 
  isOpen, 
  onClose, 
  patientId,
  initialView = 'list' // 'list', 'view', 'edit'
}) {
  const { userRole } = useAuthStore();
  const isDoctor = userRole === 'doctor';
  
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('records');

  // Version history dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyRecordId, setHistoryRecordId] = useState(null);

  // Reset state when modal closes
  const handleClose = () => {
    setCurrentView('list');
    setSelectedRecord(null);
    setActiveTab('records');
    onClose();
  };

  // Handle record selection from list
  const handleRecordClick = (record) => {
    setSelectedRecord(record);
    setCurrentView('view');
  };

  // Handle create new record
  const handleCreateNew = () => {
    setSelectedRecord(null);
    setCurrentView('edit');
  };

  // Handle edit record
  const handleEdit = (record) => {
    setSelectedRecord(record);
    setCurrentView('edit');
  };

  // Handle save (create or update)
  const handleSave = (savedRecord) => {
    // Refresh list and go back to list view
    setCurrentView('list');
    setSelectedRecord(null);
    // Could trigger a refresh of the list here
  };

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedRecord(null);
  };

  // Handle view history
  const handleViewHistory = (record) => {
    setHistoryRecordId(record.recordId || record._id);
    setHistoryDialogOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogContent className="dialog-wide w-full max-w-[70vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Medical Records
          </DialogTitle>
        </DialogHeader>

  <div className="flex-1 overflow-y-auto w-full">
          {/* List View */}
          {currentView === 'list' && (
            <div className="space-y-4">
              {/* Actions for doctors */}
              {isDoctor && (
                <div className="flex justify-end">
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Record
                  </Button>
                </div>
              )}

              {/* Records List */}
              <MedicalRecordsList
                patientId={patientId}
                onRecordClick={handleRecordClick}
              />
            </div>
          )}

          {/* View Record */}
          {currentView === 'view' && selectedRecord && (
            <div className="space-y-4">
              <MedicalRecordViewer
                recordId={selectedRecord.recordId || selectedRecord._id}
                onBack={handleBackToList}
                onViewHistory={handleViewHistory}
              />

              {/* Edit button for doctors */}
              {isDoctor && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleEdit(selectedRecord)}>
                    Edit Record
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Edit/Create Record (Doctor only) */}
          {currentView === 'edit' && isDoctor && (
            <MedicalRecordEditor
              patientId={patientId}
              recordId={selectedRecord?.recordId || selectedRecord?._id}
              onSave={handleSave}
              onCancel={handleBackToList}
              onViewHistory={handleViewHistory}
            />
          )}

          {/* Access Denied for non-doctors trying to edit */}
          {currentView === 'edit' && !isDoctor && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You don't have permission to edit medical records.
              </p>
              <Button onClick={handleBackToList} className="mt-4">
                Back to Records
              </Button>
            </div>
          )}
        </div>

        {/* Version History Dialog */}
        <MedicalRecordHistoryDialog
          recordId={historyRecordId}
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Simplified version with tabs (alternative layout)
 */
export function MedicalRecordsModalTabs({ 
  isOpen, 
  onClose, 
  patientId 
}) {
  const { userRole } = useAuthStore();
  const isDoctor = userRole === 'doctor';
  
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleClose = () => {
    setSelectedRecord(null);
    setIsEditing(false);
    onClose();
  };

  const handleRecordClick = (record) => {
    setSelectedRecord(record);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setSelectedRecord(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    setSelectedRecord(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogContent className="dialog-wide w-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Medical Records
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="flex w-full gap-2">
            <TabsTrigger value="list" className="flex-1 min-w-0 justify-center text-base py-3">
              <List className="h-4 w-4 mr-2" />
              All Records
            </TabsTrigger>
            {isDoctor && (
              <TabsTrigger value="create" className="flex-1 min-w-0 justify-center text-base py-3">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {selectedRecord && !isEditing ? (
              <MedicalRecordViewer
                recordId={selectedRecord.recordId || selectedRecord._id}
                onBack={() => setSelectedRecord(null)}
              />
            ) : (
              <MedicalRecordsList
                patientId={patientId}
                onRecordClick={handleRecordClick}
              />
            )}
          </TabsContent>

          {isDoctor && (
            <TabsContent value="create">
              <MedicalRecordEditor
                patientId={patientId}
                recordId={selectedRecord?.recordId}
                onSave={handleSave}
                onCancel={() => setSelectedRecord(null)}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
