import "express-async-errors";

import * as link from "@canmingir/link-express/link";
import type { LayerDefinition } from "@canmingir/link-express/link";
import * as nuc from "@poc/nuc";
import type { NucConfig } from "@poc/nuc";
import { type Channel, chat, schema } from "./channel";
import channel from "./functions/channel";
import Message from "./models/Message";
import channels from "./routes/channels";
import inbound from "./routes/inbound";
import subscriptions from "./subscriptions";

export type GreycollarConfig = NucConfig;

const points = {
  channels: link.point<Channel>("greycollar.channels"),
};

const layer: LayerDefinition = {
  name: "greycollar",
  setup(ctx) {
    const handle = ctx.define(points.channels, {
      cardinality: "keyed",
      description: "Channels a task can arrive from and reply through",
      key: (channel) => channel.name,
      schema,
      builtins: [chat],
    });

    ctx.contribute(link.points.models, Message);
    ctx.contribute(link.points.routes, {
      path: "/inbound",
      router: inbound,
      public: true,
    });
    ctx.contribute(link.points.routes, { path: "/channels", router: channels });

    for (const subscription of subscriptions) {
      ctx.contribute(link.points.events, subscription);
    }

    ctx.on("start", () => {
      channel.bind(handle);
      ctx.log(
        `${handle.items().length} channels: ${handle
          .items()
          .map((channel) => channel.name)
          .join(", ")}`,
      );
    });

    ctx.on("stop", () => channel.unbind());
  },
};

export async function init(config: GreycollarConfig = {}) {
  const app = await nuc.init(config);
  return app.use(layer);
}

export { points };
export type { Channel } from "./channel";
