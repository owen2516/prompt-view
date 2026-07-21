"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChatPanel({
  token,
  sessionId,
  questionId,
  currentCode,
}: {
  token: string;
  sessionId: string;
  questionId: string;
  currentCode: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing messages on mount or when questionId changes
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [questionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue;
    setInputValue("");
    setError(null);

    // Add user message to UI immediately
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    setLoading(true);

    try {
      const res = await fetch(`/api/interview/${token}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId,
          currentCode,
          message: userMessage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setError("AI 服務暫時不可用，請稍候再試。");
        } else {
          setError(data.message || "回覆失敗，請重試");
        }
        // Remove user message if failed
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
        return;
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId || `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setError("網路錯誤，請重試");
      setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col border-t border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 text-xs font-medium text-gray-500">AI 助手</div>

      <div className="flex-1 overflow-y-auto rounded-lg bg-white p-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-xs text-gray-400">
              有任何問題嗎？<br />
              和 AI 助手討論題目吧！
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-xs ${
                  msg.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] overflow-x-auto rounded-lg px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-xs prose-p:my-1 prose-pre:my-1 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:text-[11px]">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-gray-200 px-3 py-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-600"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-600" style={{ animationDelay: "0.1s" }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-600" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        {error && (
          <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        placeholder={loading ? "AI 回覆中..." : "輸入問題..."}
        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  );
}
