import { NotFoundError } from "@canmingir/link-express/error";
import type { PointHandle } from "@canmingir/link-express/link";
import type { Channel } from "../channel";

let channels: PointHandle<Channel> | null = null;

function bind(handle: PointHandle<Channel>) {
  channels = handle;
}

function unbind() {
  channels = null;
}

function list() {
  if (!channels) throw new Error("greycollar is not started");
  return channels.items();
}

function get(name: string) {
  const channel = list().find((item) => item.name === name);

  if (!channel) throw new NotFoundError();

  return channel;
}

export default { bind, unbind, list, get };
