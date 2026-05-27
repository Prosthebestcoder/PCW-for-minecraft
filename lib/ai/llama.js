const lower = (value) => value.toLowerCase();

export async function llama({ generatedCode, checklist }) {
  const body = lower(generatedCode);
  const missing = checklist.filter((item) => !body.includes(item.toLowerCase()));
  const risks = [];

  if (!body.includes('registerevents')) risks.push('No event registration detected.');
  if (!body.includes('setexecutor')) risks.push('Command executor wiring absent.');

  const flags = {
    beginnerLike: body.includes('hello world') || body.includes('basic'),
    thinGameplay: !body.includes('manager') || !body.includes('listener'),
    weakDifferentiation: body.includes('simple') || body.includes('starter'),
  };

  const fixes = missing.map((item) => `Inject required module: ${item}`);

  return {
    provider: 'llama',
    output: generatedCode,
    review: {
      missing,
      risks,
      flags,
      fixes,
      passed: missing.length === 0 && risks.length === 0,
    },
  };
}
