import Joi from "joi";

export interface Channel {
  name: string;
  send(to: string, text: string): void | Promise<void>;
}

export const schema = Joi.object({
  name: Joi.string()
    .pattern(/^[a-z][a-z0-9_]*$/)
    .required(),
  send: Joi.func().required(),
});

export const chat: Channel = {
  name: "chat",
  send: (to, text) => console.log(`[chat] → ${to}: ${text}`),
};
