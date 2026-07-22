"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, ChevronUp } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();

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

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Examples Popover */}
      {showExamples && (
        <div className="absolute bottom-full mb-2 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10 animate-in slide-in-from-bottom-2 fade-in">
          <div className="p-2 text-xs font-semibold text-muted-foreground bg-secondary/50 border-b border-border">
            Suggested Queries (Trigger Mock Stories)
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
          placeholder="Ask CrimeIntel anything... (Shift+Enter for newline)"
          disabled={disabled}
          className="flex-1 max-h-[120px] bg-transparent border-0 focus:ring-0 resize-none py-2 px-1 text-sm text-foreground placeholder:text-muted-foreground min-h-[40px]"
          rows={1}
        />

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Voice Input (Coming Soon)"
          >
            <Mic className="h-5 w-5" />
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
        CrimeIntel AI can make mistakes. Verify important information using the citations.
      </div>
    </div>
  );
}
