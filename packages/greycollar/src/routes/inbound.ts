import express from "express";
import Joi from "joi";
import message from "../functions/message";

const router = express.Router();

router.post("/:channel", async (req, res) => {
  const { from, text } = Joi.attempt(
    req.body,
    Joi.object({ from: Joi.string().required(), text: Joi.string().required() }),
  );

  res.status(202).json(await message.receive(req.params.channel, from, text));
});

export default router;
