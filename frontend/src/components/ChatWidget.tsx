import React, { useMemo, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Placeholder assistant response (echo). Replace with API call later.
    const reply: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: `You said: ${text}`,
    };
    setTimeout(() => setMessages((prev) => [...prev, reply]), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="shadow-lg rounded-full bg-grafana-orange text-white w-12 h-12 flex items-center justify-center hover:opacity-90 transition"
          title="Open Chatbot"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 3C7.03 3 3 6.58 3 11c0 2.01.9 3.85 2.39 5.25-.17.86-.62 2.1-1.77 3.25 0 0 2.09-.08 3.53-.9.96.3 1.98.46 3.03.46 4.97 0 9-3.58 9-8s-4.03-8-9-8z"/>
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="w-[320px] md:w-[380px] h-[440px] bg-grafana-panel border border-grafana-border rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-grafana-bg border-b border-grafana-border flex items-center justify-between">
            <div className="text-sm font-semibold text-grafana-text">AI Assistant</div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-grafana-text-secondary hover:text-grafana-text hover:bg-grafana-hover rounded"
              title="Close"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M18.3 5.71 12 12.01 5.7 5.7 4.29 7.11 10.59 13.4 4.3 19.7 5.71 21.1 12 14.81 18.29 21.1 19.7 19.69 13.41 13.4 19.7 7.11z"/>
              </svg>
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <div className="text-xs text-grafana-text-secondary">Ask me about the dashboard data or metrics.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`max-w-[85%] text-sm px-3 py-2 rounded ${m.role === 'user' ? 'ml-auto bg-grafana-blue/20 text-grafana-text' : 'bg-grafana-bg border border-grafana-border text-grafana-text'}`}>
                  {m.text}
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-grafana-border bg-grafana-bg">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-grafana-panel border border-grafana-border rounded text-sm text-grafana-text"
              />
              <button
                onClick={sendMessage}
                disabled={!canSend}
                className={`px-3 py-2 text-sm rounded ${canSend ? 'bg-grafana-orange text-white hover:opacity-90' : 'bg-grafana-border text-grafana-text-secondary cursor-not-allowed'}`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


