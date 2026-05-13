// OmniAI Backend Server (Groq Free API)
// Run this with: node server.js

const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

// ==============================
// PASTE YOUR GROQ API KEY HERE
// ==============================
const GROQ_API_KEY = process.env.GROQ_API_KEY || "PASTE-YOUR-GROQ-KEY-HERE";
// Get your FREE API key at: https://console.groq.com
// ==============================

const PORT = 3000;

async function callGroq(messages) {
  const body = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content:
          "You are OmniAI, a powerful AI assistant combining the best of DeepSeek, ChatGPT, and Claude. You are an expert at coding, writing, math, science, and any topic. Be helpful, clear, and friendly. Use markdown code blocks for code.",
      },
      ...messages,
    ],
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve index.html
  if (req.method === "GET" && req.url === "/") {
    fs.readFile(path.join(__dirname, "index.html"), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("index.html not found — make sure both files are in the same folder!");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
    return;
  }

  // Chat API endpoint
  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { messages } = JSON.parse(body);
        const result = await callGroq(messages);

        if (result.error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: result.error.message }));
          return;
        }

        const reply = result.choices[0].message.content;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server error: " + err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("\n✦ OmniAI is running! (Powered by Groq - FREE)");
  console.log(`➜  Open this in your browser: http://localhost:${PORT}`);
  console.log("\nPress Ctrl+C to stop.\n");
});
