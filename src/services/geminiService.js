const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const modelNames = {
  'UT Pro': 'gemini-4-argon',
  'UT Flash': 'gemini-3.8-flash',
};

const systemInstruction = `You are Unbeltedtech, a precise and practical AI thinking partner.
Answer the user's actual question directly. Use clear structure when it helps, admit uncertainty,
and never invent facts. Keep responses concise unless the user asks for depth.`;

export async function generateGeminiResponse({ apiKey, model, messages, prompt }) {
  const contents = [
    ...messages.slice(-12).map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  const response = await fetch(
    `${GEMINI_API_BASE}/${modelNames[model] ?? modelNames['UT Flash']}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: 2048,
        },
      }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = data.error?.message;
    throw new Error(apiMessage || 'Gemini could not complete this request. Please try again.');
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) {
    const reason = data.candidates?.[0]?.finishReason;
    throw new Error(
      reason
        ? `Gemini returned no answer (${reason}). Try rephrasing the question.`
        : 'Gemini returned an empty answer. Please try again.',
    );
  }

  return text;
}
