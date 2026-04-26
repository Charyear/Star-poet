import React, { useState } from "react";
import { MODELS } from "./modelList";

interface SettingsPageProps {
  config: {
    apiKey: string;
    model: string;
  };
  onSave: (config: { apiKey: string; model: string }) => void;
}

export default function SettingsPage({ config, onSave }: SettingsPageProps) {
  const [apiKey, setApiKey] = useState(config.apiKey || "");
  const [model, setModel] = useState(config.model || MODELS[0].id);

  const handleSave = () => {
    if (!apiKey.startsWith("nvapi-")) {
      alert("请输入有效的NVIDIA API密钥（以nvapi-开头）");
      return;
    }
    onSave({ apiKey, model });
    alert("保存成功！");
  };

  return (
    <div className="flex h-full flex-col p-8 text-foreground">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
        配置中心
      </h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">API 密钥</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="请输入 NVIDIA API 密钥 (nvapi-...)"
            className="w-full rounded-xl border border-border bg-background/50 p-3 text-sm outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">选择模型</label>
          <select 
            value={model} 
            onChange={e => setModel(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/50 p-3 text-sm outline-none transition-all focus:border-primary/50"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id} className="bg-background">{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button 
          className="liquid-glass w-full rounded-xl py-4 text-sm font-medium text-foreground transition-all hover:scale-[1.01]" 
          onClick={handleSave}
        >
          保存配置
        </button>
      </div>
    </div>
  );
}
