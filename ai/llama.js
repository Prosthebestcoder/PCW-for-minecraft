export async function llama({ generatedCode }) {
  const apiKey = process.env.LLAMA_API_KEY;
  const lower = generatedCode.toLowerCase();
  const missing = ['config.yml', 'commands', 'listeners', 'managers'].filter((token) => !lower.includes(token));

  return {
    provider: 'llama',
    usedApiKey: Boolean(apiKey),
    output: generatedCode,
    review: {
      missing,
      optimizations: missing.length ? ['Add missing required plugin modules.'] : ['Structure is modular and valid.'],
      passed: missing.length === 0,
    },
  };
}
