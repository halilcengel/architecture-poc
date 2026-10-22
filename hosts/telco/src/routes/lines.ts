import express from "express";
import Joi from "joi";
import type { Agent } from "@poc/nuc";
import checkLine from "../actions/checkLine";

const THRESHOLD = 0.5;

export function createLines({ agent }: { agent: Agent }) {
  const router = express.Router();

  router.post("/check", async (req, res) => {
    const { text } = Joi.attempt(req.body, Joi.object({ text: Joi.string().required() }));
    const parameters = agent.selectParameters(text, checkLine);
    const hallucination = agent.hallucination(text, parameters);

    if (hallucination > THRESHOLD) {
      res.status(422).json({ parameters, hallucination });
      return;
    }

    res.status(200).json({ parameters, hallucination, result: await checkLine.run(parameters) });
  });

  return router;
}
