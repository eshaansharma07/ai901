type WorkerUpdate =
  | { status: 'loading'; progress: number }
  | { status: 'generating' }
  | { status: 'done'; text?: string }
  | { status: 'error' };

export function generateDevicePlan(brief: string, onProgress: (message: string) => void, signal: AbortSignal) {
  return new Promise<string>((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    const worker = new Worker('/eventiq-planner-worker.mjs', { type: 'module' });
    const timeout = window.setTimeout(() => finish(new Error('The device model took too long. Try the quick draft.')), 180000);
    function finish(error?: unknown, text?: string) {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      worker.terminate();
      if (error) reject(error);
      else resolve(text ?? '');
    }
    function abort() { finish(signal.reason); }
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => finish(new Error('The device model couldn’t load. Try the quick draft.'));
    worker.onmessage = ({ data }: MessageEvent<WorkerUpdate>) => {
      if (data.status === 'loading') onProgress('Downloading model · ' + data.progress + '%');
      if (data.status === 'generating') onProgress('Writing your plan on this device…');
      if (data.status === 'error') finish(new Error('The device model couldn’t run. Try the quick draft.'));
      if (data.status === 'done') {
        const result = data.text?.trim();
        if (result && result.length >= 40) finish(undefined, result);
        else finish(new Error('The device model returned an incomplete draft. Try again or use the quick draft.'));
      }
    };
    worker.postMessage(brief);
  });
}
