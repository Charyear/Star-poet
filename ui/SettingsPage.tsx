import React, { useState } from "react";
import { MODELS } from "./modelList";

interface SettingsPageProps {
  config: {
    apiKey: string;
    model: string;
    voiceURI?: string;
  };
  voices: SpeechSynthesisVoice[];
  onSave: (config: { apiKey: string; model: string; voiceURI: string }) => void;
}

export default function SettingsPage({ config, voices, onSave }: SettingsPageProps) {
  const [apiKey, setApiKey] = useState(config.apiKey || "");
  const [model, setModel] = useState(config.model || MODELS[0].id);
  const [voiceURI, setVoiceURI] = useState(config.voiceURI || "");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handlePreview = () => {
    if (voiceURI === "none") return;
    window.speechSynthesis.cancel();
    setIsPreviewing(true);

    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
    
    const voiceDisplayName = selectedVoice 
      ? selectedVoice.name.replace(/Microsoft|Online|Natural|Chinese|Simplified|PRC|[\(\)]/g, '').trim()
      : "系统音色";

    const utterance = new SpeechSynthesisUtterance(`你好，我是${voiceDisplayName}`);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsPreviewing(false);
    utterance.onend = () => setIsPreviewing(false);
    utterance.onerror = () => setIsPreviewing(false);

    // Timeout fallback if voice fails to start (common for online voices)
    setTimeout(() => setIsPreviewing(false), 5000);

    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    if (!apiKey.startsWith("nvapi-")) {
      alert("请输入有效的NVIDIA API密钥（以nvapi-开头）");
      return;
    }
    onSave({ apiKey, model, voiceURI });
    alert("保存成功！");
  };

  return (
    <div className="flex h-full flex-col p-8 pt-12 text-white">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
        配置中心
      </h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">API 密钥</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="请输入 NVIDIA API 密钥 (nvapi-...)"
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all focus:border-white/20 focus:ring-1 focus:ring-white/10"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">选择模型</label>
          <select 
            value={model} 
            onChange={e => setModel(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all focus:border-white/20"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id} className="bg-zinc-900">{m.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">语音音色</label>
          <select 
            value={voiceURI} 
            onChange={e => setVoiceURI(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all focus:border-white/20"
          >
            <option value="none" className="bg-zinc-900">无 (静音)</option>
            {voices.length === 0 ? (
              <option value="" className="bg-zinc-900">默认系统音色</option>
            ) : (
              voices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI} className="bg-zinc-900">
                  {v.name} {v.localService ? '(本地)' : ''}
                </option>
              ))
            )}
          </select>
          <div className="flex justify-center">
            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              className={`group flex flex-col items-center gap-1 transition-all ${isPreviewing ? 'text-white/60 scale-95' : 'text-white/20 hover:text-white'}`}
              title="试听当前音色"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className={`transition-all ${isPreviewing ? 'animate-pulse scale-110' : 'group-hover:translate-y-0.5'}`}
              >
                <path d="M12 21l-12-18h24z" />
              </svg>
              <span className="text-[9px] uppercase tracking-[0.2em] opacity-60">
                {isPreviewing ? 'Loading...' : 'Listen'}
              </span>
            </button>
          </div>
          <p className="text-center text-[10px] text-white/30 leading-relaxed">
            * <span className="text-white/50">Online</span> 音色需联网加载，可能有延迟<br/>
            * 推荐带有 <span className="text-white/50">Natural</span> 字样的音色效果最真实
          </p>
        </div>
      </div>

      <div className="mt-auto pb-4">
        <button 
          className="liquid-glass w-full rounded-xl py-4 text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98]" 
          onClick={handleSave}
        >
          保存配置
        </button>
      </div>
    </div>
  );
}
