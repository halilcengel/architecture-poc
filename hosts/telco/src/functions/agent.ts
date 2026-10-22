import type { Agent } from "@poc/nuc";

function compact(text: string) {
  return text.replace(/(\d)[\s\-()]+(?=\d)/g, "$1");
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function createAgent(agent: Agent): Agent {
  return {
    ...agent,
    selectParameters: (text, action) => agent.selectParameters(compact(text), action),
    hallucination: (text, parameters) => {
      const values = Object.values(parameters);

      if (!values.length) return 0;

      const grounded = values.filter(
        (value) => value && digits(value) && digits(text).includes(digits(value)),
      );

      return 1 - grounded.length / values.length;
    },
  };
}
