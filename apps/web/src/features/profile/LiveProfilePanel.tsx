import React, { useState } from 'react';
import { useProfileStore } from '../../stores/useProfileStore';
import { ProvenanceBadge } from '../../components/provenance/ProvenanceBadge';
import { api } from '../../api/client';
import {
  User,
  GraduationCap,
  Briefcase,
  Languages,
  FileCheck,
  Edit2,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

export const LiveProfilePanel: React.FC = () => {
  const { profile, facts, lastUpdatedField } = useProfileStore();
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const getFactForField = (fieldPath: string) => {
    return facts.find((f) => f.fieldPath === fieldPath);
  };

  const handleConfirm = async (factId: string) => {
    await api.profile.confirmFact(factId);
    const prof = await api.profile.get();
    useProfileStore.getState().setFullProfile(prof);
  };

  const handleEdit = async (factId: string) => {
    if (!editValue.trim()) return;
    await api.profile.editFact(factId, editValue);
    setEditingFactId(null);
    setEditValue('');
    const prof = await api.profile.get();
    useProfileStore.getState().setFullProfile(prof);
  };

  const handleReject = async (factId: string) => {
    await api.profile.rejectFact(factId);
    const prof = await api.profile.get();
    useProfileStore.getState().setFullProfile(prof);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Personal Section */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>Personal Identity</span>
          </div>
          {getFactForField('personal.name') && (
            <ProvenanceBadge
              provenance={getFactForField('personal.name')!.provenance}
              confidence={getFactForField('personal.name')!.confidence}
              evidenceType={getFactForField('personal.name')!.evidenceType}
              evidenceRef={getFactForField('personal.name')!.evidenceRef}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-slate-300">
          <div>
            <span className="text-[10px] text-slate-500 block">Full Legal Name</span>
            <span
              className={`font-medium ${
                lastUpdatedField === 'personal.name' ? 'fact-highlight' : ''
              }`}
            >
              {profile?.personal?.name || '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">Date of Birth</span>
            <span>
              {profile?.personal?.dob
                ? new Date(profile.personal.dob).toLocaleDateString()
                : '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">Current Location</span>
            <span>{profile?.personal?.cityIndia || 'India'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">Target in Germany</span>
            <span className="text-amber-400">
              {profile?.personal?.targetCityGermany || 'Open / Nationwide'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Education Section */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            <span>Education & Academics</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {profile?.educations?.length || 0} entries
          </span>
        </div>

        {profile?.educations && profile.educations.length > 0 ? (
          <div className="space-y-2">
            {profile.educations.map((edu, i) => {
              const eduFact = getFactForField(`education[${i}].degree`);
              return (
                <div
                  key={edu.id || i}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{edu.degree}</span>
                    {eduFact && (
                      <ProvenanceBadge
                        provenance={eduFact.provenance}
                        confidence={eduFact.confidence}
                        evidenceType={eduFact.evidenceType}
                        evidenceRef={eduFact.evidenceRef}
                        onConfirm={() => handleConfirm(eduFact.id)}
                        onReject={() => handleReject(eduFact.id)}
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {edu.institution} • {edu.fieldOfStudy}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Grade: {edu.grade || 'N/A'}</span>
                    <span>
                      {new Date(edu.startDate).getFullYear()} -{' '}
                      {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">No education recorded yet.</p>
        )}
      </div>

      {/* 3. Language Proficiencies Section */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>Languages & CEFR Scores</span>
          </div>
        </div>

        {profile?.languages && profile.languages.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {profile.languages.map((l, i) => {
              const fact = getFactForField(`languages[${i}].cefrLevel`);
              return (
                <div
                  key={l.id || i}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{l.language}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold text-[10px]">
                      {l.cefrLevel}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {l.certificateName || 'Self-declared'}
                  </div>
                  {fact && (
                    <div className="pt-0.5">
                      <ProvenanceBadge
                        provenance={fact.provenance}
                        confidence={fact.confidence}
                        evidenceType={fact.evidenceType}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">No languages assessed yet.</p>
        )}
      </div>

      {/* 4. Experience Section */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Briefcase className="w-3.5 h-3.5 text-purple-400" />
            <span>Work Experience</span>
          </div>
        </div>

        {profile?.employments && profile.employments.length > 0 ? (
          <div className="space-y-2">
            {profile.employments.map((emp, i) => (
              <div
                key={emp.id || i}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{emp.role}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(emp.startDate).getFullYear()} -{' '}
                    {emp.endDate ? new Date(emp.endDate).getFullYear() : 'Current'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{emp.employer}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">No prior employment added.</p>
        )}
      </div>
    </div>
  );
};
