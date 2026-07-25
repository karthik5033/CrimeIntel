"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, ChevronUp, MicOff, AlertCircle } from "lucide-react";
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

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setInput((prev) => prev + (prev ? " " : "") + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setVoiceError("Error: " + event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setVoiceError(t('chat.voiceNotSupported'));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceError("");
      try {
        recognitionRef.current.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
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
          placeholder={isListening ? t('chat.listening') : t('chat.placeholder')}
          disabled={disabled}
          className={`flex-1 max-h-[120px] bg-transparent border-0 focus:ring-0 resize-none py-2 px-1 text-sm text-foreground placeholder:text-muted-foreground min-h-[40px] ${isListening ? 'text-primary' : ''}`}
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
            className={`p-2 rounded-lg transition-colors relative ${
              isListening 
                ? 'text-destructive bg-destructive/10 hover:bg-destructive/20' 
                : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
            title={isListening ? t('chat.stopListening') : t('chat.voiceInput')}
          >
            {isListening && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-ping"></span>
            )}
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
      
      <div className="text-center mt-2 text-xs text-muted-foreground">
        {t('chat.disclaimer')}
      </div>
    </div>
  );
}
