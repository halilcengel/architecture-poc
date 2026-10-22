import express from "express";
import Joi from "joi";
import task from "../functions/task";

const router = express.Router();

router.post("/", async (req, res) => {
  const { text } = Joi.attempt(req.body, Joi.object({ text: Joi.string().required() }));
  res.status(201).json(await task.start(text));
});

router.get("/:id", async (req, res) => {
  res.status(200).json(await task.get(req.params.id));
});

export default router;
