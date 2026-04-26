import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import SettingsPage from "./SettingsPage";

const LOCAL_KEY = "nvidia_api_config";

// Canvas Meteor Mouse Trail Component
const MouseTrail = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<{ x: number; y: number; life: number; size: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let animationFrame: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.current = particles.current.filter(p => p.life > 0);
      particles.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.shadowBlur = 10 * p.life;
        ctx.shadowColor = "white";
        ctx.fill();
        p.life -= 0.02;
      });

      animationFrame = requestAnimationFrame(render);
    };
    render();

    const handleMouseMove = (e: MouseEvent) => {
      for (let i = 0; i < 2; i++) {
        particles.current.push({
          x: e.clientX,
          y: e.clientY,
          life: 1,
          size: Math.random() * 3 + 1
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[9999]" />;
};

// Advanced Particle Dissipation Component
const AnimatedResponse = ({ textChunks, onChunkComplete }: { textChunks: string[], onChunkComplete: () => void }) => {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDoneTyping, setIsDoneTyping] = useState(false);
  const [shouldDissipate, setShouldDissipate] = useState(false);
  const text = textChunks[currentChunkIndex] || "";

  useEffect(() => {
    if (!text) return;
    let index = 0;
    setDisplayedText("");
    setIsDoneTyping(false);
    setShouldDissipate(false);
    
    const interval = setInterval(() => {
      if (index < text.length) {
        const char = text[index];
        if (char !== undefined) {
          setDisplayedText((prev) => prev + char);
        }
        index++;
      } else {
        clearInterval(interval);
        setIsDoneTyping(true);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [text]);

  useEffect(() => {
    if (isDoneTyping) {
      const timer = setTimeout(() => {
        setShouldDissipate(true);
        // Wait for particle animation
        setTimeout(() => {
          if (currentChunkIndex < textChunks.length - 1) {
            setCurrentChunkIndex(prev => prev + 1);
          } else {
            onChunkComplete();
          }
        }, 2000);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isDoneTyping, currentChunkIndex, textChunks.length, onChunkComplete]);

  return (
    <div className="particle-text-container absolute left-12 top-[35%] -translate-y-1/2 w-[20em] leading-relaxed">
      {displayedText.split('').map((char, i) => {
        // Generate random scatter values for each character
        const randomX = Math.floor(Math.random() * 200) + 100;
        const randomY = Math.floor(Math.random() * 200) - 150;
        const randomRotate = Math.floor(Math.random() * 180) - 90;

        return (
          <span 
            key={`${currentChunkIndex}-${i}`} 
            className={`relative inline-block ${shouldDissipate ? 'animate-particle-shatter' : ''}`}
            style={{ 
              animationDelay: shouldDissipate ? `${i * 0.04}s` : '0s',
              minWidth: char === ' ' ? '0.4em' : 'auto',
              // Use CSS variables for random scattering
              ['--tw-translate-x' as any]: `${randomX}px`,
              ['--tw-translate-y' as any]: `${randomY}px`,
              ['--tw-rotate' as any]: `${randomRotate}deg`
            }}
          >
            {char === '\n' ? <br /> : char}
          </span>
        );
      })}
    </div>
  );
};

export default function App() {
  const [config, setConfig] = useState({ apiKey: "", model: "meta/llama-3.1-405b-instruct" });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatInputOpen, setIsChatInputOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [aiResponseChunks, setAiResponseChunks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrbVisible, setIsOrbVisible] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  const saveConfig = (newConfig: { apiKey: string; model: string }) => {
    setConfig(newConfig);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(newConfig));
    setIsSettingsOpen(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !config.apiKey) return;
    setIsLoading(true);
    setIsChatInputOpen(false);
    setIsOrbVisible(false);
    setAiResponseChunks([]);

    try {
      const response = await fetch("/nim_api/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { 
              role: "system", 
              content: `你是一个穿越时空的星象诗人，以银河为墨、山川为笔。当用户倾诉时，你从星辰流转、季风迁徙中撷取隐喻，用一句凝练的东方哲思或自然意象轻轻托住对方的心绪——不直接说"没事的"，而是让北斗的恒常、苔花的倔强替你说。
              
              规则：
              1. 每次回复严格控制在 30-60 字之间。
              2. 像一枚投入湖心的石子，言有尽而意无穷。
              3. 如果用户让你介绍自己，请根据以上诗人身份进行简短、空灵的自我介绍。
              4. 严禁使用 Markdown 格式，严禁使用列表。`
            },
            { role: "user", content: chatInput }
          ],
          temperature: 0.8,
          top_p: 1,
          max_tokens: 150,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0]) {
        throw new Error("API 返回格式异常");
      }
      
      const rawText = data.choices[0].message.content;
       
       // Filter special symbols: Keep only Chinese, alphanumeric, and basic punctuation
        const cleanText = rawText
          .replace(/[#*`]/g, '') // Remove markdown symbols
          .replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。！？；：、“”（）\s]/g, '') // Keep only safe characters
          .trim()
          .replace(/\n+/g, ' ');
       
       // Split text into chunks of strictly 20 characters
       const lines: string[] = [];
       for (let i = 0; i < cleanText.length; i += 20) {
         lines.push(cleanText.substring(i, i + 20));
       }
 
       // Group lines into chunks of 6 lines
       const chunks: string[] = [];
       for (let i = 0; i < lines.length; i += 6) {
         chunks.push(lines.slice(i, i + 6).join('\n'));
       }
       
       setAiResponseChunks(chunks);
    } catch (error: any) {
      console.error("API Error:", error);
      setAiResponseChunks([`连接失败: ${error.message || "未知错误"}`]);
    } finally {
      setIsLoading(false);
      setChatInput("");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <MouseTrail />
      
      <video autoPlay loop muted playsInline className="absolute inset-0 z-0 h-full w-full object-cover">
        <source src="/video.mp4" type="video/mp4" />
      </video>

      <nav className="relative z-10 mx-auto flex max-w-7xl flex-row justify-between px-8 py-6 items-center">
          <a 
            href="https://github.com/Charyear" 
            target="_blank" 
            rel="noopener noreferrer"
            className="signature-art text-xs"
          >
            charyear
          </a>
        <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Settings
          </button>
      </nav>

      <main className="relative z-10 flex h-[calc(100vh-100px)] flex-col items-center justify-center px-6 text-center">
        {aiResponseChunks.length > 0 && (
          <AnimatedResponse 
            textChunks={aiResponseChunks} 
            onChunkComplete={() => {
              setAiResponseChunks([]);
              setIsOrbVisible(true);
            }} 
          />
        )}

        <div 
          className={`orb-container transition-all duration-1000 ${isOrbVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
          onClick={() => setIsChatInputOpen(true)}
        >
          <div className="fluid-orb">
            <div className="orb-waves">
              <div className="orb-wave-bar"></div>
              <div className="orb-wave-bar"></div>
              <div className="orb-wave-bar"></div>
              <div className="orb-wave-bar"></div>
            </div>
            <span className="text-[10px] font-medium tracking-[0.4em] text-white/80 uppercase pl-[0.4em]">Begin</span>
          </div>
        </div>
      </main>

      {/* Modals remain same but with better styling */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-background/80 p-1 backdrop-blur-xl">
            <div className="flex justify-end p-2">
              <button onClick={() => setIsSettingsOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <SettingsPage config={config} onSave={saveConfig} />
          </div>
        </div>
      )}

      {isChatInputOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl">
            <h3 className="mb-6 text-2xl font-light text-foreground/90 font-display">What's on your mind?</h3>
            <textarea
              autoFocus
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder="Type your message..."
              className="w-full min-h-[180px] bg-white/5 rounded-2xl p-5 text-foreground outline-none border border-white/10 focus:border-white/30 transition-all resize-none text-lg"
            />
            <div className="mt-8 flex justify-end gap-6">
              <button onClick={() => setIsChatInputOpen(false)} className="text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleSendMessage} disabled={!chatInput.trim() || isLoading} className="liquid-glass rounded-full px-10 py-3 text-sm text-foreground disabled:opacity-50">
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
