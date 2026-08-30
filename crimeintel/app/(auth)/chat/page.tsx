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

  const { t, language } = useLanguage();

  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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

  // Auto scroll scoped strictly to the messages container to avoid window/layout scrolling
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [activeSession?.messages, activeSession?.messages?.[activeSession?.messages.length - 1]?.content, activeSession?.messages?.[activeSession?.messages.length - 1]?.isThinking]);

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
      // Build conversation history from the current session (excluding thinking placeholders)
      const history = (activeSession?.messages ?? [])
        .filter(m => !m.isThinking && m.content.trim())
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      // Simulate network request to our mock API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, language, sessionId: activeSessionId, history })
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error || data?.details || 'Request failed — please try again.';
        console.error('Chat API error:', errMsg);
        updateLastMessage({
          isThinking: false,
          content: `⚠️ ${errMsg}`,
        });
        setIsProcessing(false);
        return;
      }

      const aiText = data.text_summary || data.response || data.text;
      if (!aiText) {
        updateLastMessage({ isThinking: false, content: '⚠️ No response received. Please try again.' });
        setIsProcessing(false);
        return;
      }

      updateLastMessage({
        isThinking: false,
        content: aiText,
        tableData: data.data_table,
        reasoningBlock: data.reasoning_block,
        ragContext: data.rag_context,
        citations: data.citations
      });
    } catch (error) {
      console.error(error);
      updateLastMessage({
        isThinking: false,
        content: '⚠️ Network error — check your connection and try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      
      {/* LEFT SIDEBAR (History Drawer Overlay) */}
      {leftOpen && (
        <>
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-xs z-20 transition-opacity"
            onClick={() => setLeftOpen(false)}
          />
          <div className="absolute top-0 bottom-0 left-0 z-30 w-64 flex flex-col border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{t('chat.investigations')}</h2>
              <button 
                onClick={createNewSession}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                title="New Investigation"
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
                  onClick={() => {
                    setActiveSession(session.id);
                    setLeftOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{session.title === 'New Investigation' ? t('chat.newInvestigation') : session.title}</span>
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
        </>
      )}

      {/* CENTER (Main Chat Area - Full Width, Zero Gap) */}
      <div className="w-full h-full flex flex-col bg-background overflow-hidden">
        {/* Chat Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0 shadow-sm z-10 no-print">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLeftOpen(!leftOpen)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                leftOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Toggle Investigation History"
            >
              <SidebarIcon className="h-5 w-5" />
            </button>
            <h1 className="font-semibold text-foreground truncate">
              {activeSession?.title === 'New Investigation' ? t('chat.newInvestigation') : (activeSession?.title || t('chat.newInvestigation'))}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-md transition-colors"
            >
              <FileDown className="h-4 w-4" />
              {t('chat.exportPdf')}
            </button>
            <button 
              onClick={() => setRightOpen(!rightOpen)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                rightOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Toggle Context Panel"
            >
              <PanelRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 scroll-smooth bg-background print:overflow-visible print:h-auto"
        >
          <PrintHeader title={`${t('chat.transcript')} ${activeSession?.title || 'Investigation'}`} />
          <div className="max-w-5xl print:max-w-full pb-4">
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

        {/* Input Area (Strictly pinned at bottom) */}
        <div className="shrink-0 border-t border-border/40 bg-background p-4 no-print z-10">
          <ChatInput onSend={handleSendMessage} disabled={isProcessing} />
        </div>
      </div>

      {/* RIGHT SIDEBAR (Context Drawer Overlay) */}
      {rightOpen && (
        <>
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-xs z-20 transition-opacity"
            onClick={() => setRightOpen(false)}
          />
          <div className="absolute top-0 bottom-0 right-0 z-30 w-72 flex flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{t('chat.activeContext')}</h2>
              <button 
                onClick={() => setRightOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md text-sm"
              >
                ✕
              </button>
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
        </>
      )}

    </div>
  );
}
