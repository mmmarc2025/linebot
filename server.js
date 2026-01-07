const express = require('express');
const line = require('@line/bot-sdk');
const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'bot_config.json');
let botConfig = {
  botName: "AI 助理",
  persona: "親切的客服",
  keyPoints: []
};

// 載入機器人設定
try {
  if (fs.existsSync(CONFIG_PATH)) {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    if (data.trim()) {
      botConfig = JSON.parse(data);
      console.log(`✅ 成功載入機器人設定: ${botConfig.botName}`);
    }
  }
} catch (err) {
  console.error('❌ 設定檔載入失敗:', err.message);
}

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const app = express();

// 健康檢查與狀態顯示
app.get('/', (req, res) => {
  const envStatus = {
    LINE_TOKEN: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    LINE_SECRET: !!process.env.LINE_CHANNEL_SECRET,
    GEMINI_KEY: !!process.env.GEMINI_API_KEY
  };

  res.send(`
    <div style="font-family: sans-serif; padding: 40px; line-height: 1.6;">
      <h1 style="color: #00b900;">LINE AI Bot 狀態頁面</h1>
      <p>機器人名稱: <b>${botConfig.botName}</b></p>
      <hr>
      <h3>環境變數檢查:</h3>
      <ul>
        <li>LINE Token: ${envStatus.LINE_TOKEN ? '✅ 已設定' : '❌ 未設定'}</li>
        <li>LINE Secret: ${envStatus.LINE_SECRET ? '✅ 已設定' : '❌ 未設定'}</li>
        <li>Gemini Key: ${envStatus.GEMINI_KEY ? '✅ 已設定' : '❌ 未設定'}</li>
      </ul>
      <p>Webhook URL 請設定為: <code>https://${req.get('host')}/webhook</code></p>
    </div>
  `);
});

// LINE Webhook 端點
app.post('/webhook', line.middleware(lineConfig), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Webhook Error:', err);
      res.status(500).end();
    });
});

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const userText = event.message.text;
  const activeKeyPoints = botConfig.keyPoints
    .filter(kp => kp.active)
    .map(kp => `- ${kp.title}: ${kp.content}`)
    .join('\n');

  const systemInstruction = `你是 ${botConfig.botName}。人設: ${botConfig.persona}。知識庫內容：\n${activeKeyPoints}\n請用繁體中文回覆，語氣要像在 LINE 上聊天一樣親切且精簡。`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userText,
      config: { systemInstruction, temperature: 0.7 },
    });
    
    const replyText = response.text || "抱歉，我暫時無法回答。";
    const client = new line.MessagingApiClient(lineConfig);
    
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: replyText }],
    });
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return null;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 伺服器啟動於 Port ${PORT}`);
});