import React, { useState } from 'react';
import { useProfileStore } from '../../stores/useProfileStore';
import { api } from '../../api/client';
import { ProvenanceBadge } from '../../components/provenance/ProvenanceBadge';
import {
  Briefcase,
  Download,
  Sparkles,
  Languages,
  Check,
  Eye,
  FileText,
  FileCheck2,
} from 'lucide-react';

export const CvStudio: React.FC = () => {
  const { profile } = useProfileStore();
  const [templateId, setTemplateId] = useState('modern_german');
  const [language, setLanguage] = useState<'EN' | 'DE'>('EN');
  const [generatedCv, setGeneratedCv] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const cv = await api.cv.generate(templateId, language);
      setGeneratedCv(cv);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const cvContent = generatedCv?.contentJson || {
    header: {
      name: profile?.personal?.name || 'Applicant Name',
      email: profile?.personal?.email || 'applicant@example.com',
      phone: profile?.personal?.phone || '+91 98765 43210',
      location: profile?.personal?.cityIndia || 'Pune, India',
    },
    summary: {
      text:
        'Dedicated graduate seeking direct career integration and academic advancement in Germany. Focused on cutting-edge software engineering and applied intercultural collaboration.',
      provenance: 'AI_GENERATED',
    },
    education: profile?.educations || [],
    employment: profile?.employments || [],
    languages: profile?.languages || [],
    skills: profile?.skills || [],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-400" />
            <span>German CV & Lebenslauf Studio</span>
          </h1>
          <p className="text-xs text-slate-400">
            Compliant with German DIN 5008 standards. Built exclusively from verified & applicant-provided facts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-mono font-bold">
            <button
              onClick={() => setLanguage('EN')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                language === 'EN' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('DE')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                language === 'DE' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              DE (Lebenslauf)
            </button>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Generating...' : 'Generate DIN 5008 CV'}</span>
          </button>

          {generatedCv && (
            <a
              href={`/api/v1/cv/${generatedCv.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          )}
        </div>
      </div>

      {/* Template Switcher */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-400 font-semibold">Layout Format:</span>
        <button
          onClick={() => setTemplateId('modern_german')}
          className={`px-3 py-1.5 rounded-xl border transition-all ${
            templateId === 'modern_german'
              ? 'bg-slate-800 border-amber-500 text-white font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          DIN 5008 German Standard
        </button>
        <button
          onClick={() => setTemplateId('europass')}
          className={`px-3 py-1.5 rounded-xl border transition-all ${
            templateId === 'europass'
              ? 'bg-slate-800 border-amber-500 text-white font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          Europass Academic Format
        </button>
      </div>

      {/* Live CV Document Preview */}
      <div className="max-w-3xl mx-auto p-10 rounded-2xl bg-white text-slate-900 shadow-2xl space-y-6 min-h-[50rem] font-sans border border-slate-200">
        {/* Header */}
        <div className="border-b pb-4 border-slate-300 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {cvContent.header.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {cvContent.header.email} • {cvContent.header.phone} • {cvContent.header.location}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            {language === 'DE' ? 'LEBENSLAUF' : 'CURRICULUM VITAE'}
          </span>
        </div>

        {/* Summary */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800">
              Professional Profile
            </h3>
            <ProvenanceBadge provenance="AI_GENERATED" />
          </div>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            {cvContent.summary.text}
          </p>
        </div>

        {/* Education */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800">
            Education & Academic Qualifications
          </h3>
          <div className="space-y-2">
            {cvContent.education.map((edu: any, i: number) => (
              <div key={i} className="text-xs border-b border-slate-100 pb-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{edu.degree} - {edu.fieldOfStudy}</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {new Date(edu.startDate).getFullYear()} -{' '}
                    {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  {edu.institution} • Grade: {edu.grade || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employment */}
        {cvContent.employment.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800">
              Work & Practical Experience
            </h3>
            <div className="space-y-2">
              {cvContent.employment.map((emp: any, i: number) => (
                <div key={i} className="text-xs border-b border-slate-100 pb-2">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{emp.role}</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {new Date(emp.startDate).getFullYear()} -{' '}
                      {emp.endDate ? new Date(emp.endDate).getFullYear() : 'Present'}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] font-medium">{emp.employer}</div>
                  {emp.responsibilities && (
                    <p className="text-slate-600 text-[11px] mt-1">{emp.responsibilities}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {cvContent.languages.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800">
              Language Proficiencies (CEFR)
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {cvContent.languages.map((l: any, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium text-[11px]"
                >
                  {l.language}: <strong>{l.cefrLevel}</strong>
                  {l.certificateName ? ` (${l.certificateName})` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
