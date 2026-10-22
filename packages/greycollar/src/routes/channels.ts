import express from "express";
import channel from "../functions/channel";
import message from "../functions/message";

const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json(channel.list().map((item) => item.name));
});

router.get("/:channel/messages", async (req, res) => {
  res.status(200).json(await message.list(req.params.channel));
});

export default router;
