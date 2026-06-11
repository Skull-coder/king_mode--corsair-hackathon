import "dotenv/config"
import OpenAI from "openai";

export const jinaClient = new OpenAI({
  baseURL: 'https://api.jina.ai/v1',
  apiKey: process.env.JINA_API_KEY, 
});

export const deepseekClient = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});
