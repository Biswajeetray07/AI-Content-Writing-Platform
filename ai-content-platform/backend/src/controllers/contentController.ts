import { Response } from "express";
import { supabase } from "../services/supabase";
import { AuthRequest } from "../middlewares/authMiddleware";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/content/generate
 * Generates AI content and saves to database.
 * Requires authentication — uses req.user.id.
 */
export const generateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { prompt, title } = req.body;
    const userId = req.user!.id;

    if (!prompt || !title) {
      res.status(400).json({ success: false, error: "Missing required fields: prompt, title" });
      return;
    }

    if (prompt.length > 5000) {
      res.status(400).json({ success: false, error: "Prompt exceeds maximum length of 5000 characters" });
      return;
    }

    // Call Python AI Engine (FastAPI + LangGraph)
    const engineUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";

    let engineResponse: globalThis.Response;
    try {
      engineResponse = await fetch(`${engineUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(60000), // 60s timeout for AI generation
      });
    } catch (fetchError: any) {
      console.error("AI Engine connection error:", fetchError.message);
      res.status(503).json({ success: false, error: "AI Engine is unavailable. Please try again later." });
      return;
    }

    if (!engineResponse.ok) {
      const errorBody = await engineResponse.text();
      console.error("AI Engine error:", engineResponse.status, errorBody);
      res.status(502).json({ success: false, error: "AI Engine returned an error" });
      return;
    }

    const { content: generatedText } = (await engineResponse.json()) as { content: string };
    const now = new Date().toISOString();

    // Save to DB via Supabase
    const { data: document, error: insertError } = await supabase
      .from("Document")
      .insert({
        id: uuidv4(),
        title,
        content: generatedText,
        prompt,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      res.status(500).json({ success: false, error: "Failed to save document" });
      return;
    }

    res.status(201).json({ success: true, document });
  } catch (error) {
    console.error("Generation Error:", error);
    res.status(500).json({ success: false, error: "Failed to generate content" });
  }
};

/**
 * GET /api/content
 * Returns all documents for the authenticated user.
 */
export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data: documents, error } = await supabase
      .from("Document")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch documents" });
      return;
    }

    res.status(200).json({ success: true, documents });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch documents" });
  }
};
