import * as nuc from "@poc/nuc";
import Message from "../models/Message";
import channel from "./channel";

async function receive(channelName: string, from: string, text: string) {
  const { name } = channel.get(channelName);
  const task = await nuc.task.start(text);

  await Message.create({
    channel: name,
    direction: "IN",
    address: from,
    text,
    taskId: task.id,
  });

  return { taskId: task.id };
}

async function reply(taskId: string, result: string) {
  const inbound = await Message.findOne({ where: { taskId, direction: "IN" } });

  if (!inbound) return;

  await channel.get(inbound.channel).send(inbound.address, result);
  await Message.create({
    channel: inbound.channel,
    direction: "OUT",
    address: inbound.address,
    text: result,
    taskId,
  });
}

async function list(channelName: string) {
  const { name } = channel.get(channelName);
  return Message.findAll({
    where: { channel: name },
    order: [["createdAt", "ASC"]],
  });
}

export default { receive, reply, list };
