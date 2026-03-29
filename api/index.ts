import express from "express";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "API is running",
    apiKeySet: !!process.env.GEMINI_API_KEY 
  });
});

export default app;
