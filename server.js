
const express = require('express');
const line = require('@line/bot-sdk');
const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

// 載入從管理面板匯出的設定檔
const CONFIG_PATH = path.join(__dirname, 'bot_config.json');
let botConfig = {
  botName: "AI 助理",
  persona: "親切的客服",
  keyPoints: []
};

try {
  if (fs.existsSync(CONFIG_PATH)) {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    botConfig = JSON.parse(data);
    console.log('成功載入機器人設定：', botConfig.botName);
  } else {
    console.log('未發現 bot_config.json，將使用程式內預設設定');
  }
} catch (err) {
  console.error('讀取設定檔時發生錯誤:', err);
}

// LINE 串接設定
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// 初始化 Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();

// LINE Webhook 路由
app.post('/webhook', line.middleware(lineConfig), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userText = event.message.text;
  
  // 準備 AI Prompt
  const activeKeyPoints = botConfig.keyPoints
    .filter(kp => kp.active)
    .map(kp => `- ${kp.title}: ${kp.content}`)
    .join('\n');

  const systemInstruction = `
    你是 ${botConfig.botName}。
    性格描述: ${botConfig.persona}
    
    已知的重要資訊:
    ${activeKeyPoints}
    
    請以此身分回覆使用者，語氣要親切且簡短，適當使用表情符號。
  `;

  try {
    // 呼叫 Gemini
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userText,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "抱歉，我現在無法思考，請稍後再試。";

    // 回傳訊息給 LINE 使用者
    const client = new line.MessagingApiClient(lineConfig);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: replyText }],
    });
  } catch (error) {
    console.error("AI 處理失敗:", error);
    return Promise.resolve(null);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器正在啟動，監聽通訊埠 ${PORT}`);
});
