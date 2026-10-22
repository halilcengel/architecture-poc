import type { Action, Parameters } from "../action";

function selectAction(text: string, actions: Action[]): Action | undefined {
  const lower = text.toLocaleLowerCase("tr");

  return actions.find((action) =>
    action.keywords.some((keyword) => lower.includes(keyword)),
  );
}

function selectParameters(text: string, action: Action): Parameters {
  return Object.fromEntries(
    Object.entries(action.parameters).map(([name, pattern]) => [
      name,
      text.match(pattern)?.[1] ?? null,
    ]),
  );
}

function hallucination(text: string, parameters: Parameters): number {
  const values = Object.values(parameters);

  if (!values.length) return 0;

  const ungrounded = values.filter(
    (value) => value === null || !text.includes(value),
  );

  return ungrounded.length / values.length;
}

export default { selectAction, selectParameters, hallucination };
