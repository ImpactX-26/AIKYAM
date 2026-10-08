import React, { useState, useEffect } from 'react';
import { useProfileStore } from '../../stores/useProfileStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { api } from '../../api/client';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  Edit2,
  X,
  FileCheck,
} from 'lucide-react';

export const DocumentsHub: React.FC = () => {
  const { profile, setFullProfile } = useProfileStore();
  const { conversationId } = useJourneyStore();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const documents = profile?.documents || [];
  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await api.documents.upload(file, conversationId || undefined);
      const prof = await api.profile.get();
      setFullProfile(prof);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmExtraction = async (extractionId: string) => {
    await api.documents.updateExtraction(extractionId, 'CONFIRMED');
    const prof = await api.profile.get();
    setFullProfile(prof);
  };

  const handleConfirmAllHighConfidence = async () => {
    if (!selectedDoc?.extractions) return;
    for (const ext of selectedDoc.extractions) {
      if (ext.confidence >= 0.9 && ext.status === 'PENDING_REVIEW') {
        await api.documents.updateExtraction(ext.id, 'CONFIRMED');
      }
    }
    const prof = await api.profile.get();
    setFullProfile(prof);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>Document Intelligence Hub</span>
          </h1>
          <p className="text-xs text-slate-400">
            Upload certificates, degree transcripts, and language credentials. Extracted facts carry confidence scores and source regions.
          </p>
        </div>

        {/* Upload Trigger */}
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all">
          <Upload className="w-4 h-4" />
          <span>Upload Document (PDF/JPG)</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Documents List & File Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Document Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all shrink-0 ${
                    (selectedDocId || documents[0]?.id) === doc.id
                      ? 'bg-slate-800 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>{doc.fileName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono">
                    {doc.type}
                  </span>
                </button>
              ))}
            </div>

            {/* Document Preview Frame */}
            {selectedDoc && (
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">{selectedDoc.fileName}</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Status: {selectedDoc.processingStatus}
                  </span>
                </div>

                <div className="w-full h-96 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-400 relative overflow-hidden">
                  <iframe
                    src={`/api/v1/storage/${selectedDoc.storageKey}`}
                    className="w-full h-full rounded-lg"
                    title="Document Preview"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Extracted Fields & Confidence (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedDoc && (
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">Extracted Metadata</h3>
                    <p className="text-[11px] text-slate-400">
                      Classified confidence: {Math.round((selectedDoc.classifiedConfidence || 0.95) * 100)}%
                    </p>
                  </div>

                  <button
                    onClick={handleConfirmAllHighConfidence}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm All &gt;90%</span>
                  </button>
                </div>

                {/* Extractions List */}
                <div className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
                  {selectedDoc.extractions && selectedDoc.extractions.length > 0 ? (
                    selectedDoc.extractions.map((ext: any) => (
                      <div
                        key={ext.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-amber-400 font-semibold">
                            {ext.fieldPath}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {Math.round(ext.confidence * 100)}% confidence
                          </span>
                        </div>

                        <div className="p-2 rounded bg-slate-900 text-slate-200 font-medium">
                          {typeof ext.value === 'object'
                            ? JSON.stringify(ext.value)
                            : String(ext.value)}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                          <span className="text-[10px] text-slate-500 font-mono">
                            Page {ext.pageNumber || 1}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {ext.status === 'CONFIRMED' ? (
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Confirmed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleConfirmExtraction(ext.id)}
                                className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-[10px] font-medium"
                              >
                                Confirm
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 italic text-xs">
                      No atomic extractions recorded yet for this document.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No documents uploaded yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload your Degree Certificate, Marksheet, or Language Test (IELTS/Goethe) to trigger automatic classification and extraction.
          </p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all">
            <Upload className="w-4 h-4" />
            <span>Select Document to Upload</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      )}
    </div>
  );
};
