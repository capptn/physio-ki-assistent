"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeInfo } from "./practice-info";
import { cn } from "@/lib/utils";
import Image from "next/image";
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  showContactInfo?: boolean;
}

export function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const assistantMessageId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Fehler bei der Anfrage");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                if (json.textDelta) {
                  fullContent += json.textDelta;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: fullContent }
                        : m,
                    ),
                  );

                  const shouldShowContact =
                    /kontakt|telefon|anruf|termin|adresse|email|öffnungszeiten|praxis|rufen sie uns|melden sie sich/.test(
                      fullContent.toLowerCase(),
                    );

                  if (shouldShowContact) {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, showContactInfo: true }
                          : m,
                      ),
                    );
                  }
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content:
                    "Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const suggestions = [
    "Was hilft bei Rueckenschmerzen?",
    "Welche Uebungen fuer die Schulter?",
    "Wie vereinbare ich einen Termin?",
  ];

  return (
    <div className=" flex flex-col h-full bg-gradient-to-b from-black via-black to-[#0a0a0a]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="relative mb-8">
                <Image
                  src="/icons/icon-256x256.png"
                  alt="App Icon"
                  width={200}
                  height={200}
                  className="w-24 h-24  rounded-xl sm:rounded-2xl shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#57ff55] flex items-center justify-center">
                  <span className="text-black text-lg font-bold">?</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Wie kann ich helfen?
              </h2>
              <p className="text-white/50 max-w-md text-lg leading-relaxed">
                Fragen Sie mich alles rund um Physiotherapie, Uebungen und
                Behandlungen.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="group px-5 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-[#57ff55]/10 hover:border-[#57ff55]/30 hover:text-[#57ff55] transition-all duration-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {message.role === "assistant" && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4826ae] to-[#57ff55] flex items-center justify-center shrink-0 shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-3xl px-5 py-4",
                  message.role === "user"
                    ? "bg-gradient-to-r from-[#57ff55] to-[#4ae048] text-black rounded-tr-lg"
                    : "bg-white/5 border border-white/10 text-white rounded-tl-lg",
                )}
              >
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {message.content || (
                    <span className="flex items-center gap-2 text-white/50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Schreibt...
                    </span>
                  )}
                </div>
                {message.role === "assistant" &&
                  message.showContactInfo &&
                  message.content && (
                    <div className="mt-5 pt-5 border-t border-white/10">
                      <PracticeInfo />
                    </div>
                  )}
              </div>
              {message.role === "user" && (
                <div className="w-10 h-10 rounded-2xl bg-[#57ff55] flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-black" />
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-black/80 backdrop-blur-xl p-4 sm:p-6">
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 items-end max-w-3xl mx-auto"
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Schreiben Sie Ihre Frage..."
              rows={1}
              disabled={isLoading}
              className={cn(
                "w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4",
                "text-[16px] text-white placeholder:text-white/30 leading-relaxed",
                "focus:outline-none focus:ring-2 focus:ring-[#57ff55]/50 focus:border-[#57ff55]/30",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[56px] max-h-[120px]",
                "transition-all duration-200",
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-14 w-14 rounded-2xl bg-gradient-to-r from-[#57ff55] to-[#4ae048] hover:from-[#4ae048] hover:to-[#57ff55] text-black shadow-lg shadow-[#57ff55]/20 disabled:opacity-30 disabled:shadow-none transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="sr-only">Nachricht senden</span>
          </Button>
        </form>
        <p className="text-xs text-white/30 text-center mt-4">
          Dieser Chatbot ersetzt keine aerztliche Beratung.
        </p>
      </div>
    </div>
  );
}
