import React, { useState, useRef } from "react";

interface ChatPageProps {
  config: {
    apiKey: string;
    model: string;
  };
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  files?: string[];
}

function isMultimodal(modelId: string) {
  return true;
}

export default function ChatPage({ config }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "欢迎使用英伟达NIM对话助手！" },
  ]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && files.length === 0) return;
    if (!config.apiKey) return;
    setLoading(true);
    const userMsg: Message = { role: "user", content: input, files: files.map(f => f.name) };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    try {
      const formData = new FormData();
      formData.append("prompt", input);
      formData.append("model", config.model);
      formData.append("apiKey", config.apiKey);
      files.forEach(f => formData.append("files", f));
      const res = await fetch("/nim_api", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: "assistant", content: data.result }]);
    } catch (e) {
      setMessages((msgs) => [...msgs, { role: "assistant", content: "请求失败，请检查API密钥和网络。" }]);
    }
    setFiles([]);
    setLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : msg.role === 'system'
                  ? 'bg-muted/50 text-muted-foreground italic mx-auto text-center'
                  : 'bg-secondary/80 text-foreground border border-border'
              }`}
            >
              {msg.content}
              {msg.files && msg.files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.files.map((fname, idx) => (
                    <span key={idx} className="inline-flex items-center rounded bg-background/50 px-2 py-1 text-xs text-muted-foreground border border-border">
                      📎 {fname}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-3 backdrop-blur-sm">
        <textarea
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={isMultimodal(config.model) ? "请输入内容，可上传图片/视频..." : "请输入内容..."}
          disabled={loading}
          className="w-full resize-none bg-transparent p-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        
        <div className="flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-secondary/50">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground hover:text-foreground">📎 附件</span>
            </label>
            {files.length > 0 && (
              <span className="text-xs text-muted-foreground">{files.length} 个文件</span>
            )}
          </div>
          
          <button 
            onClick={sendMessage} 
            disabled={loading || (!input.trim() && files.length === 0) || !config.apiKey}
            className="liquid-glass rounded-full px-6 py-2 text-sm font-medium text-foreground transition-all hover:scale-[1.03] disabled:opacity-50"
          >
            {loading ? "发送中..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
