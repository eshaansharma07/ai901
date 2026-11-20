import { env, pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

self.onmessage = async ({ data: brief }) => {
  try {
    const generate = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA', {
      device: 'wasm',
      dtype: 'q8',
      progress_callback(progress) {
        if (progress.status === 'progress' && progress.file?.endsWith('.onnx')) {
          self.postMessage({ status: 'loading', progress: Math.floor(progress.progress) });
        }
      },
    });
    self.postMessage({ status: 'generating' });
    const [result] = await generate([
      { role: 'system', content: 'You write short event plans. Give an event title, two sentences for guests, and three specific agenda steps. Keep it short. Do not invent bookings or prices.' },
      { role: 'user', content: brief },
    ], { return_full_text: false, max_new_tokens: 125, do_sample: false, repetition_penalty: 1.15 });
    const output = result.generated_text;
    self.postMessage({ status: 'done', text: typeof output === 'string' ? output : output.at(-1)?.content });
  } catch {
    self.postMessage({ status: 'error' });
  }
};
