
import React, { useState, useEffect, useRef } from 'react';
import { KeyPoint, ChatbotConfig, Message } from './types';
import { KeyPointItem } from './components/KeyPointItem';
import { GeminiService } from './services/geminiService';

const INITIAL_CONFIG: ChatbotConfig = {
  botName: "AI 品牌助理",
  persona: "專業、有溫度的生活風格品牌客服，語氣親切，會適度使用表情符號。",
  language: "繁體中文",
  keyPoints: [
    { id: '1', title: '店鋪位置', content: '我們在台北市信義區有一間旗艦店，地址是忠孝東路五段1號。營業時間為 11:00 - 22:00。', active: true },
    { id: '2', title: '加入會員', content: '點擊下方選單的「會員中心」即可免費註冊，首購可享 9 折優惠！', active: true }
  ]
};

const App: React.FC = () => {
  const [config, setConfig] = useState<ChatbotConfig>(INITIAL_CONFIG);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'deploy'>('settings');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const geminiRef = useRef<GeminiService | null>(null);

  useEffect(() => {
    geminiRef.current = new GeminiService();
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleAddKeyPoint = () => {
    const newItem: KeyPoint = {
      id: Date.now().toString(),
      title: '',
      content: '',
      active: true
    };
    setConfig(prev => ({ ...prev, keyPoints: [...prev.keyPoints, newItem] }));
  };

  const handleUpdateKeyPoint = (id: string, field: 'title' | 'content', value: string) => {
    setConfig(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.map(kp => kp.id === id ? { ...kp, [field]: value } : kp)
    }));
  };

  const handleDeleteKeyPoint = (id: string) => {
    setConfig(prev => ({ ...prev, keyPoints: prev.keyPoints.filter(kp => kp.id !== id) }));
  };

  const handleToggleKeyPoint = (id: string) => {
    setConfig(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.map(kp => kp.id === id ? { ...kp, active: !kp.active } : kp)
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !geminiRef.current) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const botResponse = await geminiRef.current.generateResponse(config, inputText, messages);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      text: botResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const exportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bot_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-5/12 lg:w-4/12 p-0 bg-white shadow-xl flex flex-col border-r border-gray-100">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'settings' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fa-solid fa-gear mr-2"></i>機器人設定
          </button>
          <button 
            onClick={() => setActiveTab('deploy')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'deploy' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fa-solid fa-cloud-arrow-up mr-2"></i>部署至 Render
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'settings' ? (
            <section className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">基本資訊</label>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={config.botName}
                    onChange={(e) => setConfig(prev => ({ ...prev, botName: e.target.value }))}
                    placeholder="機器人名稱"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 transition-all outline-none text-sm"
                  />
                  <textarea
                    value={config.persona}
                    onChange={(e) => setConfig(prev => ({ ...prev, persona: e.target.value }))}
                    rows={3}
                    placeholder="性格描述..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 transition-all outline-none resize-none text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">回覆重點庫</label>
                  <button onClick={handleAddKeyPoint} className="bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1 rounded-full font-bold text-xs">
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
                <div className="space-y-3">
                  {config.keyPoints.map(kp => (
                    <KeyPointItem key={kp.id} item={kp} onDelete={handleDeleteKeyPoint} onToggle={handleToggleKeyPoint} onUpdate={handleUpdateKeyPoint} />
                  ))}
                </div>
              </div>

              <button 
                onClick={exportConfig}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-file-export"></i> 匯出設定檔 (.json)
              </button>
            </section>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <h3 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i> 修正路徑錯誤
                </h3>
                <p className="text-xs text-red-700">
                  請將 <b>package.json</b>, <b>server.js</b>, <b>bot_config.json</b> 直接放在 GitHub 的<b>根目錄</b>，不要放在任何資料夾內。
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-rocket"></i> Render 部署步驟
                </h3>
                <div className="text-xs text-blue-700 space-y-3">
                  <p>1. 確保 <b>package.json</b> 在根目錄。</p>
                  <p>2. 在 Render 建立 Web Service 並連結該 Repo。</p>
                  <p>3. 設定環境變數：<b>GEMINI_API_KEY</b>, <b>LINE_CHANNEL_ACCESS_TOKEN</b>, <b>LINE_CHANNEL_SECRET</b>。</p>
                  <p>4. 部署後將 Webhook URL 設為：<code className="bg-blue-200 px-1">https://your-url.onrender.com/webhook</code>。</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulator */}
      <div className="flex-1 bg-slate-200 p-4 md:p-12 flex flex-col relative h-full items-center">
        <div className="max-w-md w-full flex flex-col flex-1 bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[8px] border-gray-800 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20"></div>
          <div className="bg-[#1e1e1e] pt-8 pb-4 px-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-chevron-left text-lg"></i>
              <div className="font-bold text-lg">{config.botName}</div>
            </div>
            <i className="fa-solid fa-bars"></i>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#8babd3]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-white/50 text-center px-8 space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl">
                  <i className="fa-solid fa-comment-dots animate-pulse"></i>
                </div>
                <p className="text-sm font-medium">測試模擬器已就緒！</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className="flex flex-col max-w-[75%]">
                  <div className={`p-3 rounded-2xl shadow-sm text-sm ${
                    msg.role === 'user' ? 'bg-[#89fb89] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`text-[9px] mt-1 text-gray-500 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/80 backdrop-blur px-3 py-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white flex items-center gap-3 border-t">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="測試訊息..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
            />
            {inputText.trim() && (
              <button type="submit" disabled={isTyping} className="text-blue-500 font-bold text-sm">傳送</button>
            )}
          </form>
          <div className="h-4 bg-white"></div>
        </div>
      </div>
    </div>
  );
};

export default App;
