"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, ChevronUp, MicOff, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

// Global declaration for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const EXAMPLES = [
  "Show vehicle theft cases in Bengaluru, last 6 months",
  "What connects suspects Rajesh Kumar and Suresh Babu?",
  "Show me the money trail for the cyber fraud case",
  "Is there a link between the recent murder cases?",
  "Show me the district level socio-economic correlations"
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { t, language } = useLanguage();

  const EXAMPLES = [
    t('chat.example1'),
    t('chat.example2'),
    t('chat.example3'),
    t('chat.example4'),
    t('chat.example5')
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      setShowExamples(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Cleanup MediaRecorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessingAudio(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");

          const response = await fetch("/api/voice/stt", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.transcript) {
              setInput((prev) => prev + (prev ? " " : "") + data.transcript);
            }
          } else {
            setVoiceError(t('chat.errorProcess') || "Failed to process audio");
          }
        } catch (error) {
          console.error("STT Error:", error);
          setVoiceError(t('chat.errorConnect') || "Connection error");
        } finally {
          setIsProcessingAudio(false);
          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("Microphone error:", error);
      setVoiceError(t('chat.voiceNotSupported') || "Microphone access denied");
      setIsListening(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative w-full max-w-5xl">
      {/* Examples Popover */}
      {showExamples && (
        <div className="absolute bottom-full mb-2 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10 animate-in slide-in-from-bottom-2 fade-in">
          <div className="p-2 text-xs font-semibold text-muted-foreground bg-secondary/50 border-b border-border">
            {t('chat.examplesTitle')}
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {EXAMPLES.map((example, i) => (
              <li key={i}>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                  onClick={() => {
                    setInput(example);
                    setShowExamples(false);
                  }}
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Input Area */}
      <form 
        onSubmit={handleSubmit}
        className="flex items-end gap-2 bg-card border border-border rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all p-2 relative"
      >
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
          title="Show Examples"
        >
          <ChevronUp className="h-5 w-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isProcessingAudio ? "Processing audio..." : isListening ? t('chat.listening') : t('chat.placeholder')}
          disabled={disabled || isProcessingAudio}
          className={`flex-1 max-h-[120px] bg-transparent border-0 focus:ring-0 resize-none py-2 px-1 text-sm text-foreground placeholder:text-muted-foreground min-h-[40px] ${isListening || isProcessingAudio ? 'text-primary' : ''}`}
          rows={1}
        />

        <div className="flex items-center gap-1 flex-shrink-0">
          {voiceError && (
            <div className="text-destructive text-xs flex items-center mr-2 animate-pulse">
              <AlertCircle className="w-3 h-3 mr-1" /> {voiceError}
            </div>
          )}
          
          <button
            type="button"
            onClick={toggleListening}
            disabled={isProcessingAudio}
            className={`p-2.5 rounded-full transition-colors relative flex items-center justify-center ${
              isListening 
                ? 'text-destructive bg-destructive/10 hover:bg-destructive/20' 
                : isProcessingAudio
                  ? 'text-muted-foreground opacity-50 cursor-not-allowed bg-secondary/50'
                  : 'text-primary bg-primary/10 hover:bg-primary/20'
            }`}
            title={isListening ? t('chat.stopListening') : t('chat.voiceInput')}
          >
            {isListening && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-destructive animate-ping"></span>
            )}
            {isProcessingAudio ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
          
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="h-5 w-5 ml-0.5" />
          </button>
        </div>
      </form>
      
      <div className="text-center mt-2 text-xs text-muted-foreground">
        {t('chat.disclaimer')}
      </div>
    </div>
  );
}
