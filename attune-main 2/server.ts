import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint for analyzing lyrics and styling vocal harmony arrangements
app.post("/api/analyze-vocals", async (req, res) => {
  try {
    const { lyrics, genre, style, selectedKey } = req.body;

    const prompt = `Analyze the following lyrics/vocal context:
Lyrics: "${lyrics || "Ooh, standard vocal run, feeling the rhythm tonight."}"
Genre/Style: "${genre || "Pop"}" (Additional styling: "${style || "Standard Modern Harmonizer"}")
Selected Key/Scale Preference: "${selectedKey || "Detect Automatically"}"

Please perform a deep AI Vocal Harmonization analysis. Provide the output in JSON format matching the following schema.
Determine the optimal musical key and scale, suggest a tempo (BPM), and create a detailed multi-part vocal harmony arrangement.
Return:
1. detectedKey (e.g., "C Major", "A Minor")
2. bpm (tempo as integer, e.g., 120)
3. genreStyle (stylistic evaluation)
4. chords (array of objects, each containing lyricPhrase, chord, beatCount)
5. harmonyVoices: An array of 3-4 harmony voice configurations. Each voice must have:
   - name (e.g., "Soprano Voice", "Tenor Companion", "Ethereal Alto", "Deep Bass Support")
   - intervalSteps (semitone shift from lead, e.g., 4 for major third, 7 for perfect fifth, -5 for perfect fourth, -12 for octave down)
   - panning (number between -100 for hard left and 100 for hard right)
   - delayMs (timing offset in milliseconds for realistic performance humanization, e.g., 15 to 45 ms)
   - volume (0.0 to 1.0)
   - timbreModifier (character description: e.g., "Warm & Airy", "Crisp & Sibilant", "Deep & Resonant", "Bright & Nasal")
   - genderShift (formant shift description: e.g., "Higher Formant", "Neutral", "Lower Formant")
6. lyricsArrangement: An array of lyric sections showing how the harmonies should enter (e.g. which phrases get 2-part, 3-part, or full choir, with description).
7. coachingTips (3-4 bullet points of artistic direction for the singer).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["detectedKey", "bpm", "genreStyle", "chords", "harmonyVoices", "lyricsArrangement", "coachingTips"],
          properties: {
            detectedKey: { type: Type.STRING, description: "The optimal musical key and scale for the track." },
            bpm: { type: Type.INTEGER, description: "Recommended beats per minute." },
            genreStyle: { type: Type.STRING, description: "Evaluated stylistic description." },
            chords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["lyricPhrase", "chord", "beatCount"],
                properties: {
                  lyricPhrase: { type: Type.STRING },
                  chord: { type: Type.STRING },
                  beatCount: { type: Type.INTEGER }
                }
              }
            },
            harmonyVoices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "intervalSteps", "panning", "delayMs", "volume", "timbreModifier", "genderShift"],
                properties: {
                  name: { type: Type.STRING },
                  intervalSteps: { type: Type.INTEGER },
                  panning: { type: Type.INTEGER },
                  delayMs: { type: Type.INTEGER },
                  volume: { type: Type.NUMBER },
                  timbreModifier: { type: Type.STRING },
                  genderShift: { type: Type.STRING }
                }
              }
            },
            lyricsArrangement: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["phrase", "voicesActive", "instructions"],
                properties: {
                  phrase: { type: Type.STRING },
                  voicesActive: { type: Type.STRING },
                  instructions: { type: Type.STRING }
                }
              }
            },
            coachingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const result = response.text ? JSON.parse(response.text) : {};
    res.json(result);
  } catch (error: any) {
    console.error("Error analyzing vocals:", error);
    res.status(500).json({ error: error.message || "Failed to analyze vocals" });
  }
});

// Configure Vite or Static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
