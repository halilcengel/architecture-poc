import "express-async-errors";

import * as link from "@canmingir/link-express/link";
import type { LayerDefinition, LinkConfig } from "@canmingir/link-express/link";
import { type Action, echo, schema } from "./action";
import action from "./functions/action";
import agent from "./functions/agent";
import task from "./functions/task";
import Step from "./models/Step";
import Task from "./models/Task";
import tasks from "./routes/tasks";
import subscriptions from "./subscriptions";

export type NucConfig = LinkConfig;

const points = {
  actions: link.point<Action>("nuc.actions"),
};

const layer: LayerDefinition = {
  name: "nuc",
  setup(ctx) {
    const actions = ctx.define(points.actions, {
      cardinality: "keyed",
      description: "Actions the agent can select for a task",
      key: (item) => item.name,
      schema,
      builtins: [echo],
    });

    ctx.contribute(link.points.models, Task);
    ctx.contribute(link.points.models, Step);
    ctx.contribute(link.points.routes, { path: "/tasks", router: tasks });

    for (const subscription of subscriptions) {
      ctx.contribute(link.points.events, subscription);
    }

    ctx.on("start", () => {
      action.bind(actions);
      ctx.log(
        `${actions.items().length} actions: ${actions
          .items()
          .map((item) => item.name)
          .join(", ")}`,
      );
    });

    ctx.on("stop", () => action.unbind());
  },
};

export async function init(config: NucConfig = {}) {
  const app = await link.init(config);
  return app.use(layer);
}

export { agent, points, task };
export type Agent = typeof agent;
export type { Action, Parameters } from "./action";
