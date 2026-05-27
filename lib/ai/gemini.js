export async function gemini({ role, input, constraints = [] }) {
  return {
    provider: 'gemini',
    role,
    output: `[${role}] ${input}`,
    constraintsApplied: constraints,
  };
}
