"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shield, User, FileText, Database } from "lucide-react";
import { ReasoningBlock } from "./ReasoningBlock";
import { ChatMessage as ChatMessageType } from "@/lib/store/chatStore";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.role === "assistant";

  return (
    <div className={cn(
      "flex w-full mb-6",
      isAI ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%]",
        isAI ? "flex-row" : "flex-row-reverse"
      )}>
        
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1",
          isAI ? "bg-primary text-primary-foreground mr-3" : "bg-secondary text-secondary-foreground ml-3"
        )}>
          {isAI ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col">
          {/* Main content bubble */}
          {message.content && (
            <div className={cn(
              "px-4 py-3 rounded-2xl",
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
            <div className="mt-2">
              <ReasoningBlock 
                isThinking={message.isThinking} 
                data={message.reasoningBlock} 
              />
            </div>
          )}

          {/* Inline Data Table (Basic rendering) */}
          {message.tableData && message.tableData.length > 0 && (
            <div className="mt-2 overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    {Object.keys(message.tableData[0]).map(key => (
                      <th key={key} className="px-4 py-2">{key.replace(/_/g, ' ')}</th>
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
        </div>
      </div>
    </div>
  );
}
