"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shield, User, FileText, Database, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { ReasoningBlock } from "./ReasoningBlock";
import { SemanticSearchWidget } from "./SemanticSearchWidget";
import { ExplainabilityBadge } from "../ui/explainability-badge";
import { ChatMessage as ChatMessageType } from "@/lib/store/chatStore";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.role === "assistant";
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop playing if unmounted
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleSpeech = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (!message.content || isSynthesizing) return;
    
    setIsSynthesizing(true);
    try {
      // Auto-detect Kannada characters to pass correct language code
      const isKannada = /[\u0C80-\u0CFF]/.test(message.content);
      const targetLang = isKannada ? 'kn-IN' : (language === 'hi' ? 'hi-IN' : 'en-IN');

      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.content,
          language_code: targetLang
        })
      });

      if (!response.ok) throw new Error('TTS failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("Audio playback error:", e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className={cn(
      "flex w-full mb-6",
      isAI ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex min-w-0",
        isAI ? "w-full flex-row" : "max-w-[85%] md:max-w-[75%] flex-row-reverse"
      )}>
        
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1",
          isAI ? "bg-primary text-primary-foreground mr-3" : "bg-secondary text-secondary-foreground ml-3"
        )}>
          {isAI ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>

        {/* Message Bubble */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Main content bubble */}
          {message.content && (
            <div className={cn(
              "px-4 py-3 rounded-2xl w-fit max-w-full break-words",
              isAI 
                ? "bg-secondary/40 text-foreground border border-border rounded-tl-sm" 
                : "bg-primary text-primary-foreground rounded-tr-sm"
            )}>
              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Reasoning Block */}
          {(message.isThinking || message.reasoningBlock) && (
            <div className="mt-2 w-full max-w-full min-w-0">
              <ReasoningBlock 
                isThinking={message.isThinking} 
                data={message.reasoningBlock} 
              />
            </div>
          )}

          {/* RAG Context */}
          {message.ragContext && message.ragContext.length > 0 && (
            <div className="mt-2 w-full max-w-full min-w-0">
              <SemanticSearchWidget context={message.ragContext} />
            </div>
          )}

          {/* Inline Data Table */}
          {message.tableData && message.tableData.length > 0 && (
            <div className="mt-2 w-full max-w-full min-w-0 overflow-x-auto border border-border rounded-lg bg-card shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    {Object.keys(message.tableData[0]).map(key => (
                      <th key={key} className="px-4 py-2 whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {message.tableData.map((row, i) => (
                    <tr key={i} className="hover:bg-secondary/20">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-4 py-2 whitespace-nowrap">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.citations.map((cite, i) => (
                <span 
                  key={i} 
                  className="inline-flex items-center gap-1 text-xs bg-card border border-border text-muted-foreground px-2 py-1 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors"
                >
                  {cite.type === 'FIR' ? <FileText className="h-3 w-3" /> : <Database className="h-3 w-3" />}
                  {cite.label}
                </span>
              ))}
            </div>
          )}

          {/* AI Actions */}
          {isAI && message.content && !message.isThinking && (
            <div className="mt-1 flex items-center gap-2">
              <button 
                onClick={toggleSpeech}
                disabled={isSynthesizing}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors p-1 disabled:opacity-50"
                title={isPlaying ? t('chat.stopListening') : t('chat.listenAI')}
              >
                {isSynthesizing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isPlaying ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                <span className="sr-only">{isPlaying ? t('chat.stopListening') : t('chat.listenAI')}</span>
              </button>
              
              {message.explainability && (
                <ExplainabilityBadge 
                  data={message.explainability}
                  contextId={`chat-${message.id}`}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
