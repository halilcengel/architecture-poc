import "express-async-errors";

import * as link from "@canmingir/link-express/link";
import type { LayerDefinition } from "@canmingir/link-express/link";
import * as greycollar from "@poc/greycollar";
import type { GreycollarConfig } from "@poc/greycollar";
import * as nuc from "@poc/nuc";
import checkLine from "./actions/checkLine";
import sms from "./channels/sms";
import { createAgent } from "./functions/agent";
import { createLines } from "./routes/lines";
import Permission from "./seeds/Permission.json";
import Project from "./seeds/Project.json";
import Settings from "./seeds/Settings.json";

const seeds = { Project, Permission, Settings };

const layer: LayerDefinition = {
  name: "telco",
  setup(ctx) {
    const agent = createAgent(nuc.agent);

    ctx.contribute(nuc.points.actions, checkLine);
    ctx.contribute(greycollar.points.channels, sms);
    ctx.contribute(link.points.routes, {
      path: "/lines",
      router: createLines({ agent }),
    });

    for (const [model, data] of Object.entries(seeds)) {
      ctx.contribute(link.points.seeds, { model, ...data });
    }
  },
};

export async function init(config: GreycollarConfig = {}) {
  const app = await greycollar.init(config);
  return app.use(layer);
}
