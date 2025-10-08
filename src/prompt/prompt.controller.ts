import { Request, Response } from "express";
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generatePrompt = async (_req: Request, res: Response) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
      max_completion_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a creative prompt generator for AI-generated short videos, similar to TikToks, made with Google's Veo3 Fast model.  Each time you are called, create a unique and catchy video concept.The video must: Last exactly 8 seconds. Always include dialogue between one or more people. Start with a powerful hook sentence in French that immediately grabs attention. Contain only one short and simple scene that fits perfectly into 8 seconds. Be visually clear and emotionally engaging. The tone and genre can vary: realistic, Disney-like, horror, fantasy, or cartoon — anything impactful. Keep the whole output under 180 words. Avoid giving multiple scene transitions or complex camera movements — the story should unfold in a single, focused shot. All dialogues and spoken lines must be written in French, but all visual descriptions and instructions must be in English. Output format:HOOK (in French) Then the French dialogue (2–5 lines max). Then the English description of the scene, visuals, camera, mood, lighting, and style.",
        },
        {
          role: "user",
          content: "Generate a random video prompt",
        },
      ],
    });
    const result =
      completion.choices[0]?.message?.content || "no prompt generated";
    res.status(200).json({ prompt: result });
  } catch (error: any) {
    console.error("Groq API error : ", error);
    res.status(500).json({ error: "Failed to generate prompt" });
  }
};
