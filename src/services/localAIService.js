const modelIds = {
  'UT Pro': 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
  'UT Flash': 'Qwen3-0.6B-q4f16_1-MLC',
};

const systemPrompt = `You are Unbeltedtech, a precise and practical AI thinking partner.
Answer the user's actual question directly. Use clear structure when it helps, admit uncertainty,
and never invent facts. Keep responses concise unless the user asks for depth.`;

let engine;
let engineModel;
let enginePromise;

export function isWebGPUSupported() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

async function getEngine(model, onProgress) {
  const modelId = modelIds[model] ?? modelIds['UT Flash'];

  if (engine && engineModel === modelId) return engine;

  if (!enginePromise || engineModel !== modelId) {
    engineModel = modelId;
    enginePromise = import('@mlc-ai/web-llm')
      .then(async ({ CreateMLCEngine }) => {
        if (engine?.unload) await engine.unload();
        engine = await CreateMLCEngine(modelId, {
          initProgressCallback: (report) => {
            onProgress?.({
              progress: Math.max(0, Math.min(1, report.progress ?? 0)),
              text: report.text ?? 'Loading local intelligence...',
            });
          },
        });
        return engine;
      })
      .catch((error) => {
        enginePromise = undefined;
        engineModel = undefined;
        throw error;
      });
  }

  return enginePromise;
}

export async function generateLocalResponse({ model, messages, prompt, onProgress }) {
  if (!isWebGPUSupported()) {
    throw new Error(
      'Local AI requires WebGPU. Open Unbeltedtech in a recent version of Chrome or Edge on a compatible device.',
    );
  }

  const localEngine = await getEngine(model, onProgress);
  const response = await localEngine.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.6,
  });

  const text = response.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('The local model returned an empty answer. Please try rephrasing the question.');
  }

  return text.replace(/^<think>[\s\S]*?<\/think>\s*/i, '').trim();
}
