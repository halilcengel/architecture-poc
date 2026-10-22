import Joi from "joi";

export type Parameters = Record<string, string | null>;

export interface Action {
  name: string;
  keywords: string[];
  parameters: Record<string, RegExp>;
  run(parameters: Parameters): string | Promise<string>;
}

export const schema = Joi.object({
  name: Joi.string()
    .pattern(/^[a-z][a-z0-9_]*$/)
    .required(),
  keywords: Joi.array().items(Joi.string()).min(1).required(),
  parameters: Joi.object()
    .pattern(Joi.string(), Joi.object().instance(RegExp))
    .required(),
  run: Joi.func().required(),
});

export const echo: Action = {
  name: "echo",
  keywords: ["echo"],
  parameters: { text: /echo\s+(.+)/i },
  run: ({ text }) => text ?? "",
};
