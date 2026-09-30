import React, { useState } from 'react';
import {
  FileCheck,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  UserCheck
} from 'lucide-react';
import { Player, EligibilityDocument, Role } from '../types.js';
import { sportsApi } from '../services/api.js';

interface DocumentsViewProps {
  players: Player[];
  onRefresh: () => void;
  userRole: Role;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  players,
  onRefresh,
  userRole
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verification prompt modal state
  const [selectedDocAction, setSelectedDocAction] = useState<{
    player: Player;
    doc: EligibilityDocument;
    action: 'VERIFIED' | 'REJECTED';
  } | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // Upload Form
  const [uploadPlayerId, setUploadPlayerId] = useState(players[0]?.id || '');
  const [uploadDocType, setUploadDocType] = useState('COLLEGE_ID');
  const [uploadFileName, setUploadFileName] = useState('');

  // Flatten all documents with their player info
  const allDocuments = players.flatMap(player =>
    player.documents.map(doc => ({
      ...doc,
      player
    }))
  );

  const filteredDocs = allDocuments.filter(item => {
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchSearch =
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.player.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleVerifySubmit = async () => {
    if (!selectedDocAction) return;
    setIsProcessing(true);
    try {
      await sportsApi.verifyDocument(
        selectedDocAction.player.id,
        selectedDocAction.doc.id,
        selectedDocAction.action,
        actionNotes || undefined
      );
      setSelectedDocAction(null);
      setActionNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPlayerId || !uploadFileName.trim()) return;
    setIsProcessing(true);
    try {
      await sportsApi.uploadDocument(uploadPlayerId, {
        documentType: uploadDocType,
        fileName: uploadFileName.trim(),
        fileSize: '1.4 MB'
      });
      setShowUploadModal(false);
      setUploadFileName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <FileCheck className="h-6 w-6 text-cyan-400" />
            <span>Eligibility Document Verification Desk</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enforce academic and medical certification rules. Only eligible athletes are cleared for competition.
          </p>
        </div>

        <button
          onClick={() => {
            if (players.length > 0 && !uploadPlayerId) setUploadPlayerId(players[0].id);
            setShowUploadModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Upload className="h-4 w-4" />
          <span>Submit Athlete Document</span>
        </button>
      </div>

      {/* Rules Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-cyan-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white font-mono uppercase tracking-wider">
              BIT-57 Official Clearance Gate
            </span>
            <p className="text-slate-400 mt-0.5">
              Every athlete requires verified <strong>College ID</strong> and <strong>Medical Fitness Clearance</strong>. Expired or rejected documentation automatically locks player from fixture participation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {allDocuments.filter(d => d.status === 'PENDING').length} Pending Review
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {allDocuments.filter(d => d.status === 'VERIFIED').length} Verified
          </span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search file, athlete or team..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterStatus === st ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <strong className="text-white">{filteredDocs.length}</strong> documents
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">Document File</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Athlete / Player</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-center">Clearance Status</th>
                <th className="py-3 px-4">Verification Audit</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No documents matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-medium text-white">
                        <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{doc.fileName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{doc.fileSize}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
                        {doc.documentType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{doc.player.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{doc.player.playerId}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">{doc.player.teamName}</td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{doc.uploadDate}</td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          doc.status === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : doc.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {doc.status === 'VERIFIED' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : doc.status === 'REJECTED' ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <span>{doc.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[11px]">
                      {doc.verifiedBy ? (
                        <div>
                          <span className="text-slate-300 font-medium">{doc.verifiedBy}</span>
                          <div className="text-[10px] text-slate-500 font-mono">{doc.verifiedDate}</div>
                          {doc.notes && <div className="text-[10px] text-amber-400 mt-0.5">Note: {doc.notes}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Pending review</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {userRole === 'ADMIN' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.status !== 'VERIFIED' && (
                            <button
                              onClick={() =>
                                setSelectedDocAction({
                                  player: doc.player,
                                  doc,
                                  action: 'VERIFIED'
                                })
                              }
                              className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium text-[11px] transition-colors"
                              title="Approve Document"
                            >
                              Verify
                            </button>
                          )}
                          {doc.status !== 'REJECTED' && (
                            <button
                              onClick={() =>
                                setSelectedDocAction({
                                  player: doc.player,
                                  doc,
                                  action: 'REJECTED'
                                })
                              }
                              className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-medium text-[11px] transition-colors"
                              title="Reject Document"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Admin Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Confirm Modal */}
      {selectedDocAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                {selectedDocAction.action === 'VERIFIED' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-400" />
                )}
                <span>Confirm Document {selectedDocAction.action}</span>
              </h3>
              <button
                onClick={() => setSelectedDocAction(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Athlete:</span>{' '}
                <strong className="text-white">{selectedDocAction.player.name}</strong> ({selectedDocAction.player.teamName})
              </div>
              <div>
                <span className="text-slate-400">File:</span>{' '}
                <span className="text-cyan-400 font-mono">{selectedDocAction.doc.fileName}</span>
              </div>
              <div>
                <span className="text-slate-400">Type:</span>{' '}
                <span className="text-slate-200">{selectedDocAction.doc.documentType}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-300 font-medium">
                {selectedDocAction.action === 'REJECTED'
                  ? 'Rejection Reason / Notes (Required) *'
                  : 'Verification Notes (Optional)'}
              </label>
              <textarea
                rows={2}
                placeholder={
                  selectedDocAction.action === 'REJECTED'
                    ? 'e.g., Medical clearance expired, requires fresh cardiac screening.'
                    : 'Validated against university student registrar.'
                }
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDocAction(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifySubmit}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-lg transition-all ${
                  selectedDocAction.action === 'VERIFIED'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {isProcessing
                  ? 'Processing...'
                  : `Commit ${selectedDocAction.action}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                <Upload className="h-5 w-5 text-cyan-400" />
                <span>Upload Athlete Clearance Document</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Athlete *</label>
                <select
                  value={uploadPlayerId}
                  onChange={e => setUploadPlayerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.jerseyNumber}) - {p.teamName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Document Category *</label>
                <select
                  value={uploadDocType}
                  onChange={e => setUploadDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="COLLEGE_ID">University / College Student ID Card</option>
                  <option value="MEDICAL_CERTIFICATE">Sports Medicine & Cardiac Clearance</option>
                  <option value="ID_PROOF">Government National Identification / Passport</option>
                  <option value="REGISTRATION_DOC">Official Athletic League Registration</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">File Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., student_id_card_2026.pdf"
                  value={uploadFileName}
                  onChange={e => setUploadFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Upload Dropzone UI */}
              <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 text-center space-y-1">
                <Upload className="h-6 w-6 text-slate-500 mx-auto" />
                <p className="text-slate-300 font-medium text-xs">PDF, JPEG, or PNG supported (Max 10MB)</p>
                <p className="text-[10px] text-slate-500">Document will be stamped with timestamp and SHA-256 hash</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all"
                >
                  {isProcessing ? 'Uploading...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
