"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus, MessageSquare, Trash2, Sidebar as SidebarIcon, PanelRight, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/store/chatStore";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useLanguage } from "@/lib/LanguageContext";
import { PrintHeader } from "@/components/reports/PrintHeader";
import { PrintFooter } from "@/components/reports/PrintFooter";
import { FileDown } from "lucide-react";

export default function ChatPage() {
  const { 
    sessions, 
    activeSessionId, 
    contextEntities,
    createNewSession, 
    setActiveSession, 
    addMessage, 
    updateLastMessage,
    deleteSession
  } = useChatStore();

  const { t } = useLanguage();

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Initialize a session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    } else if (!activeSessionId) {
      setActiveSession(sessions[0].id);
    }
  }, [sessions.length, activeSessionId, createNewSession, setActiveSession]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    // Add user message
    addMessage({
      role: 'user',
      content
    });

    setIsProcessing(true);

    // Add empty AI message with thinking state
    addMessage({
      role: 'assistant',
      content: '',
      isThinking: true
    });

    try {
      // Simulate network request to our mock API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      });

      const data = await response.json();

      // The API should take ~4 seconds to return to simulate thinking
      updateLastMessage({
        isThinking: false,
        content: data.text_summary || "I couldn't process that query.",
        tableData: data.data_table,
        reasoningBlock: data.reasoning_block,
        ragContext: data.rag_context,
        citations: data.citations
      });
    } catch (error) {
      console.error(error);
      updateLastMessage({
        isThinking: false,
        content: "Sorry, I encountered an error connecting to the intelligence engine."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      
      {/* LEFT SIDEBAR (History) */}
      <div className={cn(
        "flex-shrink-0 flex flex-col border-r border-border bg-card transition-all duration-300",
        leftOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{t('chat.investigations')}</h2>
          <button 
            onClick={createNewSession}
            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(session => (
            <div 
              key={session.id}
              className={cn(
                "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                activeSessionId === session.id ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-muted-foreground"
              )}
              onClick={() => setActiveSession(session.id)}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate">{session.title}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER (Chat Area) */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background relative">
        {/* Chat Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0 shadow-sm z-10 no-print">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLeftOpen(!leftOpen)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <SidebarIcon className="h-5 w-5" />
            </button>
            <h1 className="font-semibold text-foreground truncate">
              {activeSession?.title || t('chat.newInvestigation')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-md transition-colors"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
            <button 
              onClick={() => setRightOpen(!rightOpen)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <PanelRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 scroll-smooth bg-background print:overflow-visible print:h-auto">
          <PrintHeader title={`Conversation Transcript: ${activeSession?.title || 'Investigation'}`} />
          <div className="max-w-4xl mx-auto print:max-w-full">
            {!activeSession?.messages.length ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t('chat.assistantTitle')}</h2>
                  <p className="text-muted-foreground max-w-md mt-2">
                    {t('chat.assistantDesc')}
                  </p>
                </div>
              </div>
            ) : (
              activeSession.messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))
            )}
            {activeSession?.messages.length ? (
              <div className="mt-8">
                <PrintFooter />
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gradient-to-t from-background via-background to-transparent pt-10 no-print">
          <ChatInput onSend={handleSendMessage} disabled={isProcessing} />
        </div>
      </div>

      {/* RIGHT SIDEBAR (Context) */}
      <div className={cn(
        "flex-shrink-0 flex flex-col border-l border-border bg-card transition-all duration-300",
        rightOpen ? "w-72" : "w-0 overflow-hidden border-l-0"
      )}>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{t('chat.activeContext')}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">{t('chat.entitiesInContext')}</h3>
              {contextEntities.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">{t('chat.noEntities')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {contextEntities.map((ent, i) => (
                    <span key={i} className="inline-flex items-center text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md border border-border">
                      {ent.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">{t('chat.appliedFilters')}</h3>
              <p className="text-sm text-muted-foreground italic">{t('chat.noFilters')}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
