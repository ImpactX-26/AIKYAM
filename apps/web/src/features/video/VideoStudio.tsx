import React, { useState, useRef } from 'react';
import { useProfileStore } from '../../stores/useProfileStore';
import { api } from '../../api/client';
import {
  Video,
  Play,
  Square,
  RefreshCw,
  Upload,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const VideoStudio: React.FC = () => {
  const { profile, setFullProfile } = useProfileStore();
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  const latestMedia = profile?.media?.[0];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
      setCountdown(60);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      alert(`Camera/Microphone permission required: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const uploadAndProcess = async () => {
    if (!videoBlob) return;
    try {
      setIsProcessing(true);
      await api.media.uploadVideo(videoBlob);
      const prof = await api.profile.get();
      setFullProfile(prof);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Video className="w-6 h-6 text-amber-400" />
          <span>Interactive Video Studio</span>
        </h1>
        <p className="text-xs text-slate-400">
          Record a 60-second self-introduction in English or German. Our AI agent transcribes the speech and extracts motivation insights directly for partner German institutions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Recording Studio & Teleprompter (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Teleprompter Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-amber-500/20 text-xs space-y-1">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Suggested Teleprompter Questions:
            </span>
            <p className="text-slate-300">
              1. Who are you and what is your academic/work background in India?
              <br />
              2. Why are you choosing Germany over other countries?
              <br />
              3. What are your long-term career goals in your chosen field?
            </p>
          </div>

          {/* Video Viewport */}
          <div className="w-full h-80 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden shadow-2xl">
            {videoUrl && !recording ? (
              <video src={videoUrl} controls className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                muted
                className="w-full h-full object-cover mirror-mode"
              />
            )}

            {/* Countdown Overlay */}
            {recording && (
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-rose-600/90 text-white font-mono text-xs font-bold flex items-center gap-2 animate-pulse shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>REC {countdown}s</span>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="flex items-center gap-3">
            {!recording ? (
              <button
                onClick={startRecording}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{videoUrl ? 'Retake Video' : 'Start Recording'}</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Recording</span>
              </button>
            )}

            {videoBlob && !recording && (
              <button
                onClick={uploadAndProcess}
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Upload className="w-4 h-4" />
                <span>{isProcessing ? 'Analyzing...' : 'Submit Video'}</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Synchronized Transcript & Motivation Insights (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Extracted Video Insights</span>
            </h3>

            {latestMedia ? (
              <div className="space-y-3 text-xs">
                {/* Transcript */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Speech-to-Text Transcript:
                  </span>
                  <p className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 leading-relaxed font-sans italic">
                    "{latestMedia.transcript || 'Processing speech...'}"
                  </p>
                </div>

                {/* Timestamps */}
                {latestMedia.transcriptSegments && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Synchronized Segments:
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {latestMedia.transcriptSegments.map((seg, i) => (
                        <div
                          key={i}
                          className="p-1.5 rounded-lg bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2"
                        >
                          <span className="font-mono text-[10px] text-amber-400 shrink-0">
                            [{seg.start}s - {seg.end}s]
                          </span>
                          <span>{seg.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Motivation Chips */}
                {latestMedia.extractedInsights && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                    <span className="font-semibold text-amber-400 block text-[11px]">
                      Extracted Candidate Motivation:
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {latestMedia.extractedInsights.motivationForGermany ||
                        latestMedia.extractedInsights.backgroundSummary}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 italic text-xs">
                Record or upload an introduction video to generate an animated transcript and motivation profile.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
