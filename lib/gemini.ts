import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
}

const client = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = "gemini-flash-latest";

function parseJson<T>(text: string, context: string, truncated: boolean): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    if (truncated) {
      throw new Error(
        `Gemini response for ${context} was cut off before completing (hit the output token limit). Try a shorter topic/requirements or a lower difficulty, then retry.`
      );
    }
    throw new Error(`Failed to parse ${context} as JSON: ${text}`);
  }
}

export async function generateQuestion(input: {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  language: string;
  additionalRequirements?: string;
}): Promise<{
  title: string;
  description: string;
  starter_code: string;
  difficulty: "easy" | "medium" | "hard";
}> {
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const prompt = `Generate a coding interview question for the following:
- Topic/Position: ${input.topic}
- Difficulty: ${input.difficulty}
- Programming Language: ${input.language}
${input.additionalRequirements ? `- Additional Requirements: ${input.additionalRequirements}` : ""}

Return a JSON object with exactly these fields:
- title: A clear, concise question title (string)
- description: A detailed markdown-formatted problem description including examples and constraints (string)
- starter_code: Starter code template in ${input.language} for the candidate to fill in (string)
- difficulty: The difficulty level (easy/medium/hard) (string)

Ensure the description includes:
1. Problem statement
2. Example input/output
3. Constraints
4. Time/Space complexity expectations`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const truncated = result.response.candidates?.[0]?.finishReason === "MAX_TOKENS";

  const parsed = parseJson<{
    title?: string;
    description?: string;
    starter_code?: string;
    difficulty?: "easy" | "medium" | "hard";
  }>(text, "generated question", truncated);

  if (!parsed.title || !parsed.description || !parsed.starter_code) {
    throw new Error("Generated question missing required fields");
  }

  return {
    title: parsed.title,
    description: parsed.description,
    starter_code: parsed.starter_code,
    difficulty: parsed.difficulty ?? input.difficulty,
  };
}

export async function chat(input: {
  systemPrompt: string;
  questionDescription: string;
  candidateCode: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
}): Promise<string> {
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: `${input.systemPrompt}\n\nQuestion:\n${input.questionDescription}\n\nCandidate's current code:\n\`\`\`\n${input.candidateCode}\n\`\`\``,
  });

  const chatSession = model.startChat({
    history: input.conversationHistory.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
  });

  const result = await chatSession.sendMessage(input.userMessage);
  return result.response.text();
}

export async function scoreFullInterview(
  questions: Array<{
    title: string;
    description: string;
    candidateCode: string;
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  }>
): Promise<{
  score: number;
  summary: string;
}> {
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const questionsText = questions
    .map((q, i) => {
      const conversationText = q.conversationHistory
        .map((msg) => `${msg.role === "user" ? "Candidate" : "AI"}: ${msg.content}`)
        .join("\n");
      return `--- Question ${i + 1}: ${q.title} ---
Description:
${q.description}

Candidate's Final Code:
\`\`\`
${q.candidateCode}
\`\`\`

Conversation with AI Assistant:
${conversationText || "(no AI conversation)"}`;
    })
    .join("\n\n");

  const prompt = `You are a technical interview evaluator. Analyze the following coding interview, which may contain multiple questions:

${questionsText}

Provide a JSON response with:
- score: A single overall number from 0 to 100 representing the candidate's performance across all questions
- summary: A brief summary (2-4 sentences) of strengths and areas for improvement, referencing specific questions where relevant

Consider across all questions:
1. Code correctness and completeness
2. Code quality and style
3. Problem-solving approach
4. Communication during the interview
5. Handling of hints or feedback from the AI`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const truncated = result.response.candidates?.[0]?.finishReason === "MAX_TOKENS";

  const parsed = parseJson<{ score?: number; summary?: string }>(text, "score response", truncated);

  return {
    score: Math.min(100, Math.max(0, parsed.score ?? 0)),
    summary: parsed.summary ?? "No summary available",
  };
}
