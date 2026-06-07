import React, { useState, useRef, useEffect } from "react";
import API_BASE_URL from "../../config";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Headphones,
  User,
  Minimize2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import axios from "axios";

// ─── Bot knowledge base ───────────────────────────────────────────────────────

const BOT_KB = [
  {
    keywords: ["hello", "hi", "hey", "howdy", "greet"],
    answer:
      "Hi there! 👋 I'm TestPilot's AI assistant. I can help you with questions about our platform, pricing, testing features, and more. What would you like to know?",
  },
  {
    keywords: ["price", "pricing", "cost", "plan", "subscription", "free", "trial"],
    answer:
      "TestPilot offers a **free tier** so you can get started right away — no credit card needed. For larger teams and advanced features (CI/CD integration, parallel runs, priority support), check out our Pricing page for full plan details.",
  },
  {
    keywords: ["test", "testing", "automat", "run", "check", "scan", "regression"],
    answer:
      "TestPilot automates your QA workflow end-to-end:\n• **Speed analysis** — Lighthouse-based performance scoring\n• **Security scanning** — common vulnerability detection\n• **Visual regression** — screenshot diffing across builds\n\nJust upload a .zip of your source code and we handle the rest.",
  },
  {
    keywords: ["upload", "zip", "source", "file", "code"],
    answer:
      "To run a test, go to your Dashboard → click **\"Start Testing\"** → upload a `.zip` of your source code. The system extracts it, spins up the pipeline, and streams live progress back to you.",
  },
  {
    keywords: ["ci", "cd", "github", "jenkins", "pipeline", "integrate", "integration"],
    answer:
      "TestPilot integrates with GitHub Actions, Jenkins, and any CI/CD tool that supports HTTP hooks. You can trigger test runs via our REST API using your API key — find it in Dashboard → Security.",
  },
  {
    keywords: ["api", "key", "token", "auth", "secret"],
    answer:
      "Your API key is in **Dashboard → Security**. Use it in the `Authorization: Bearer <token>` header when calling our REST API. Never expose it publicly — rotate it immediately if compromised.",
  },
  {
    keywords: ["report", "result", "output", "download"],
    answer:
      "After a test completes, the full report path is shown on the Test Progress page. Reports include per-metric scores, failure reasons, and visual diffs for regression tests.",
  },
  {
    keywords: ["register", "signup", "sign up", "account", "create"],
    answer:
      "Creating an account is free and instant — just click **\"Start free\"** in the top navigation. You can also sign in with Google for a one-click setup.",
  },
  {
    keywords: ["login", "sign in", "password", "forgot", "reset"],
    answer:
      "Head to the **Sign in** page from the navigation. If you've forgotten your password, use the reset flow or sign in with Google if you originally used that method.",
  },
  {
    keywords: ["support", "help", "contact", "agent", "human", "person", "staff", "team"],
    answer:
      "I can escalate this to our support team right away. Click the button below to start a live chat with one of our customer care specialists.",
    escalate: true,
  },
  {
    keywords: ["zalo", "phone", "hotline", "số điện thoại", "liên hệ trực tiếp", "gọi", "call"],
    answer:
      "Bạn có thể liên hệ trực tiếp với supporter của chúng tôi qua **Zalo: 0999939979** 📱\n\nChúng tôi sẽ phản hồi trong thời gian sớm nhất!",
    escalate: false,
  },
];

const FALLBACK =
  "I'm not sure I have a good answer for that. I can connect you with our support team who will be happy to help — just click below.";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBotAnswer(input) {
  const lower = input.toLowerCase();
  for (const entry of BOT_KB) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return { text: entry.answer, escalate: !!entry.escalate };
    }
  }
  return { text: FALLBACK, escalate: true };
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      {/* Avatar */}
      <div
        className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
          isUser ? "bg-orange-500" : msg.role === "agent" ? "bg-emerald-600" : "bg-slate-700"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : msg.role === "agent" ? (
          <Headphones className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-orange-500 text-white rounded-br-sm"
            : msg.role === "agent"
            ? "bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-bl-sm"
            : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm"
        }`}
        dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
      />
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ role }) {
  return (
    <div className="flex gap-2 items-end">
      <div
        className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs ${
          role === "agent" ? "bg-emerald-600" : "bg-slate-700"
        }`}
      >
        {role === "agent" ? (
          <Headphones className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "bot",
    content:
      "Hi! 👋 I'm TestPilot's AI assistant. Ask me anything about our platform — features, pricing, integrations, or how to get started.",
  },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // mode: 'bot' | 'connecting' | 'human'
  const [mode, setMode] = useState("bot");
  const [unread, setUnread] = useState(0);
  const [showEscalate, setShowEscalate] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const pushMessage = (msg) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), ...msg }]);
  };

  // ── Send user message ──
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setInput("");
    setShowEscalate(false);
    pushMessage({ role: "user", content: text });

    if (mode === "human") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        pushMessage({
          role: "agent",
          content:
            "Cảm ơn bạn đã nhắn tin! Để được hỗ trợ nhanh nhất, hãy liên hệ trực tiếp qua **Zalo: 0999939979** 📱. Supporter sẽ phản hồi bạn trong thời gian sớm nhất.",
        });
      }, 1500);
      return;
    }

    // Bot mode: try backend first, fall back to local KB
    setIsTyping(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/chat`,
        { message: text },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setIsTyping(false);
      const answer = res.data.reply || res.data.message || "";
      pushMessage({ role: "bot", content: answer });
      if (res.data.escalate) setShowEscalate(true);
    } catch {
      // Fallback to local knowledge base
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
      setIsTyping(false);
      const { text: answer, escalate } = getBotAnswer(text);
      pushMessage({ role: "bot", content: answer });
      if (escalate) setShowEscalate(true);
    }

    if (!isOpen) setUnread((n) => n + 1);
  };

  // ── Escalate to human ──
  const handleEscalate = () => {
    setShowEscalate(false);
    setMode("connecting");
    pushMessage({
      role: "system",
      content: "Connecting you to a live agent…",
    });
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMode("human");
      pushMessage({
        role: "system",
        content: "Supporter đã tham gia cuộc trò chuyện",
      });
      pushMessage({
        role: "agent",
        content:
          "Xin chào! Tôi là supporter của TestPilot. Tôi đã xem qua cuộc trò chuyện của bạn.\n\nBạn có thể liên hệ trực tiếp với tôi qua **Zalo: 0999939979** 📱 để được hỗ trợ nhanh hơn. Tôi có thể giúp gì cho bạn?",
      });
    }, 2500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusLabel =
    mode === "bot"
      ? "AI Assistant"
      : mode === "connecting"
      ? "Đang kết nối…"
      : "Supporter — Zalo: 0999939979";

  const statusDot =
    mode === "bot"
      ? "bg-emerald-400"
      : mode === "connecting"
      ? "bg-amber-400 animate-pulse"
      : "bg-emerald-400";

  return (
    <>
      {/* ── Chat panel ── */}
      {isOpen && (
        <div className="fixed top-1/2 right-24 z-50 w-[360px] max-h-[560px] -translate-y-1/2 flex flex-col rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                {mode === "human" ? (
                  <Headphones className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">TestPilot Support</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
                  <span className="text-xs text-slate-300">{statusLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Minimize"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 min-h-0 max-h-[380px]">
            {messages.map((msg) => (
              <Bubble key={msg.id} msg={msg} />
            ))}

            {isTyping && <TypingIndicator role={mode === "human" ? "agent" : "bot"} />}

            {/* Escalate prompt */}
            {showEscalate && mode === "bot" && (
              <div className="flex justify-center">
                <button
                  onClick={handleEscalate}
                  className="flex items-center gap-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-full transition-colors shadow-sm"
                >
                  <Headphones className="h-3.5 w-3.5" />
                  Talk to a live agent
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions (only in bot mode with no messages from user yet) */}
          {mode === "bot" && messages.length === 1 && (
            <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5 border-t border-slate-100 bg-white">
              {["How does it work?", "What's the pricing?", "Liên hệ Zalo"].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => handleSend(), 50);
                  }}
                  className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-3 py-1.5 rounded-full transition-colors border border-slate-200"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 px-3 py-3 border-t border-slate-100 bg-white">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "human"
                  ? "Nhắn tin cho supporter…"
                  : "Hỏi bất cứ điều gì…"
              }
              rows={1}
              className="flex-1 resize-none text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder:text-slate-400 max-h-24 overflow-y-auto"
              style={{ minHeight: "40px" }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="h-10 w-10 flex-shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors"
              aria-label="Send"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-1.5 bg-white border-t border-slate-50 text-center">
            <span className="text-[10px] text-slate-400">
              Powered by TestPilot AI · {mode === "bot" ? "Ask anything or " : ""}
              {mode === "bot" && (
                <button
                  onClick={handleEscalate}
                  className="underline hover:text-slate-600 transition-colors"
                >
                  talk to a person
                </button>
              )}
              {mode !== "bot" && "Live support active"}
            </span>
          </div>
        </div>
      )}

      {/* ── Floating button ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed top-1/2 right-6 z-50 h-14 w-14 -translate-y-[68px] rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        aria-label="Open chat"
      >
        <div className={`transition-all duration-200 ${isOpen ? "rotate-90 scale-90" : "rotate-0 scale-100"}`}>
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6 fill-white/20" />
          )}
        </div>

        {/* Unread badge */}
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}

        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-orange-500 opacity-30 animate-ping" />
        )}
      </button>
    </>
  );
}
