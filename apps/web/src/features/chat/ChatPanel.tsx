import React, { useState, useEffect, useRef } from 'react';
import { useAgentStore } from '../../stores/useAgentStore';
import { useJourneyStore } from '../../stores/useJourneyStore';
import { api } from '../../api/client';
import { AgentAvatar } from '../../components/ui/AgentAvatar';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
  Upload,
  Calendar,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export const ChatPanel: React.FC = () => {
  const { messages, agentState, currentThought, addMessage, setIsStreaming } = useAgentStore();
  const { conversationId } = useJourneyStore();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThought]);

  // Load message history on mount
  useEffect(() => {
    if (conversationId) {
      api.conversations.getMessages(conversationId).then((history) => {
        if (history && history.length > 0) {
          useAgentStore.getState().setMessages(history);
        }
      });
    }
  }, [conversationId]);

  // Speech-to-Text via Web Speech API
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInputText(transcript);
        handleSend(transcript);
      };

      recognition.start();
    }
  };

  // Text-to-Speech
  const speakText = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (contentToSend?: string, uiResponse?: any) => {
    const text = contentToSend !== undefined ? contentToSend : inputText;
    if (!text.trim() && !uiResponse) return;
    if (!conversationId) return;

    // Optimistically push user message
    addMessage({
      id: `${Date.now()}`,
      role: 'USER',
      content: text || (uiResponse?.value ? String(uiResponse.value) : 'Selected option'),
      uiHints: uiResponse,
      createdAt: new Date().toISOString(),
    });

    setInputText('');
    setIsStreaming(true);

    try {
      await api.conversations.sendMessage(conversationId, text, uiResponse);
    } catch (err) {
      console.error(err);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Header with TTS & Mood Indicator */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AgentAvatar state={agentState} size="sm" />
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Educaro AI Guide</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </h3>
            <p className="text-[10px] text-slate-400 capitalize">
              Status: {agentState === 'thinking' ? 'Reasoning over profile gaps…' : agentState}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              ttsEnabled ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Text-to-Speech audio readout"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isAgent = msg.role === 'AGENT';
          const hasDirective = Boolean(msg.uiHints?.uiDirective);
          const hasQuickReplies = msg.uiHints?.quickReplies && msg.uiHints.quickReplies.length > 0;
          const explanation = msg.uiHints?.explanation;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} space-y-2`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isAgent
                    ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-sm'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-sm shadow-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* "Why am I being asked this?" Tooltip Accordion */}
                {explanation && isAgent && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60">
                    <button
                      onClick={() =>
                        setExpandedExplanationId(
                          expandedExplanationId === msg.id ? null : msg.id,
                        )
                      }
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Why am I being asked this?</span>
                    </button>
                    {expandedExplanationId === msg.id && (
                      <p className="mt-1 text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-700">
                        {explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Reply Chips */}
              {hasQuickReplies && isAgent && (
                <div className="flex flex-wrap gap-1.5 max-w-[90%] pt-1">
                  {msg.uiHints?.quickReplies?.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(chip)}
                      className="text-xs px-3 py-1 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-amber-400 transition-all shadow-sm font-medium"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Rich Inline UI Directive Components */}
              {hasDirective && isAgent && (
                <div className="w-full max-w-sm mt-1 p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2.5">
                  {/* CEFR Level Selector Directive */}
                  {msg.uiHints?.uiDirective?.type === 'CEFR_SELECTOR' && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-amber-400 block">
                        Select German CEFR Proficiency:
                      </span>
                      <div className="grid grid-cols-5 gap-1 text-center font-mono text-xs">
                        {['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() =>
                              handleSend(lvl, {
                                targetField: msg.uiHints?.uiDirective?.targetField || 'languages.cefrLevel',
                                value: lvl,
                              })
                            }
                            className="py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 font-bold transition-all"
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        • B1 is required for Ausbildung • B2/C1 for University degree study
                      </p>
                    </div>
                  )}

                  {/* File Upload Dropzone Directive */}
                  {msg.uiHints?.uiDirective?.type === 'FILE_DROPZONE' && (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-amber-500/40 rounded-xl hover:border-amber-400 bg-amber-500/5 cursor-pointer transition-colors group">
                      <Upload className="w-6 h-6 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-slate-200">
                        Click or Drop PDF to Upload
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Degree Certificate / Transcript (Max 10 MB)
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && conversationId) {
                            await api.documents.upload(file, conversationId);
                            handleSend(`Uploaded: ${file.name}`);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Live Thinking Indicator */}
        {currentThought && (
          <div className="flex items-center gap-2 text-xs text-amber-400/90 italic bg-amber-500/5 px-3 py-2 rounded-xl border border-amber-500/20 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentThought}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2">
        <button
          onClick={toggleVoiceInput}
          className={`p-2 rounded-xl transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse'
              : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
          }`}
          title="Voice input (Web Speech API)"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask a question or type your response…"
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
