# architecture-poc

A minimal layered architecture. Each layer sits on the one below it, defines its own extension points and contributes to the points of the layers beneath. The kernel lives in `@canmingir/link-express/link`.

```
telco        hosts/telco          check_line action, sms channel, /lines, seeds
greycollar   packages/greycollar  channels point, Message, /inbound, /channels
nuc          packages/nuc         actions point, Task/Step, agent, task saga, /tasks
link         link-express/link    routes/models/seeds/events points, DB, HTTP, event bus
```

## Dependencies

Dependencies only point down. An upper layer may import a lower one; a lower layer never imports an upper one.

```
telco ──► greycollar ──► nuc ──► link-express
```

```json
{
  "name": "@poc/greycollar",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@canmingir/link-express": "link:@canmingir/link-express",
    "@poc/nuc": "workspace:*"
  }
}
```

- Workspace packages use `workspace:*`, link-express is linked with `bun link`.
- `src/index.ts` is the only entry point. No deep imports like `@poc/nuc/src/functions/task`.
- A lower layer reaches up only through **extension points** and **events**.

## Layers

A layer is a `LayerDefinition` plus an `init` that stacks it on the layer below.

```ts
const layer: LayerDefinition = {
  name: "greycollar",
  setup(ctx) {
    const handle = ctx.define(points.channels, { ... });

    ctx.contribute(link.points.models, Message);
    ctx.contribute(link.points.routes, { path: "/inbound", router: inbound, public: true });

    ctx.on("start", () => channel.bind(handle));
    ctx.on("stop", () => channel.unbind());
  },
};

export async function init(config: GreycollarConfig = {}) {
  const app = await nuc.init(config);
  return app.use(layer);
}
```

Start the top layer and the whole chain comes up:

```ts
await run(await telco.init({ ...config, server: { port: 4000 } }));
```

Every package has its own `server.ts`, so `bun run nuc` or `bun run greycollar` runs a layer without the ones above it.

## Extension points

### Define

The layer that defines a point owns it. Export the ref so upper layers can reach it.

```ts
const points = {
  actions: link.point<Action>("nuc.actions"),
};

const actions = ctx.define(points.actions, {
  cardinality: "keyed",
  key: (item) => item.name,
  schema,
  builtins: [echo],
});

export { points };
```

| Cardinality | Use for | Example |
|---|---|---|
| `list` | ordered items | `link.routes`, `link.events`, `link.seeds` |
| `keyed` | one item per key | `nuc.actions`, `greycollar.channels` |
| `single` | exactly one value, optional `default` | `link.eventBus` |

Every contribution is validated against the Joi `schema`. The owner adds its own items through `builtins`.

### Contribute

```ts
ctx.contribute(nuc.points.actions, checkLine);
ctx.contribute(greycollar.points.channels, sms);
ctx.contribute(link.points.routes, { path: "/lines", router: createLines({ agent }) });
```

A contribution is a plain object of the point's type:

```ts
const checkLine: Action = {
  name: "check_line",
  keywords: ["hat", "line"],
  parameters: { lineNumber: /(05\d{9})/ },
  run: ({ lineNumber }) => { ... },
};
```

### Read

A point can only be read after every layer has run `setup` and the points are sealed. The owner hands the handle to its `functions/` module in `start`, so the rest of the layer reads it through plain functions.

```ts
let actions: PointHandle<Action> | null = null;

function bind(handle: PointHandle<Action>) {
  actions = handle;
}

function unbind() {
  actions = null;
}

function list() {
  if (!actions) throw new Error("nuc is not started");
  return actions.items();
}

export default { bind, unbind, list, get };
```

```
setup:nuc        define(nuc.actions)         [echo]
setup:telco      contribute(check_line)      [echo, check_line]
                 points sealed
start:nuc        action.bind(handle)
request          action.list()               [echo, check_line]
stop:nuc         action.unbind()
```

### Rules

| Rule | Error |
|---|---|
| A layer only defines points under its own name (`nuc.*`) | `POINT_NAMESPACE` |
| You can only contribute to a point defined below you | `POINT_UNKNOWN` |
| The owner cannot contribute to its own point | `SELF_CONTRIBUTION` |
| One contribution per key on a `keyed` point | `KEY_CONFLICT` |
| `define` / `contribute` only inside `setup` | `LAYER_INACTIVE` |
| Points cannot be read before sealing | `NOT_SEALED` |
| No contributions after sealing | `SEALED` |

## Functions

### Inside a layer

Business logic lives in `src/functions/<name>.ts` and is exported as one default object:

```ts
async function start(text: string) { ... }
async function get(taskId: string) { ... }

export default { start, get, plan, execute };
```

Routes stay thin: validate, call `functions/`, respond.

```ts
router.post("/", async (req, res) => {
  const { text } = Joi.attempt(req.body, Joi.object({ text: Joi.string().required() }));
  res.status(201).json(await task.start(text));
});
```

### Exporting to upper layers

A function is public only if `index.ts` exports it. Everything else stays inside the layer.

```ts
export { agent, points, task };
export type Agent = typeof agent;
export type { Action, Parameters } from "./action";
```

| nuc export | Used by | For |
|---|---|---|
| `points` | greycollar, telco | contributing actions |
| `task` | greycollar | starting a task from a message |
| `agent`, `Agent` | telco | wrapping the agent |
| `Action`, `Parameters` | telco | writing actions |

### Calling a lower layer

```ts
import * as nuc from "@poc/nuc";

const task = await nuc.task.start(text);
```

### Extending a lower layer

Wrap the exported object locally. Only the upper layer's own calls change; the lower layer's flow stays the same.

```ts
export function createAgent(agent: Agent): Agent {
  return {
    ...agent,
    selectParameters: (text, action) => agent.selectParameters(compact(text), action),
    hallucination: (text, parameters) => { ... },
  };
}
```

```ts
const agent = createAgent(nuc.agent);

ctx.contribute(link.points.routes, { path: "/lines", router: createLines({ agent }) });
```

`/lines/check` uses telco's agent; the task saga still uses nuc's.

## Events

The task flow is a saga: each step publishes an event and the next step subscribes to it.

```
POST /inbound/sms   greycollar   nuc.task.start   ──► TASK_STARTED
TASK_STARTED        nuc          task.plan        ──► STEP_ADDED
STEP_ADDED          nuc          task.execute     ──► TASK_COMPLETED
TASK_COMPLETED      greycollar   message.reply    ──► channel.send
```

Subscriptions are contributed to `link.points.events`:

```ts
const subscriptions: Subscription[] = [
  {
    type: "TASK_COMPLETED",
    handler: ({ taskId, result }) => message.reply(taskId, result),
  },
];
```

nuc publishes `TASK_COMPLETED` without knowing who listens, so it never imports greycollar.

## Lifecycle

Hooks run bottom-up (`link → nuc → greycollar → telco`) on start and top-down on stop.

| Hook | What happens |
|---|---|
| `setup` | `define` / `contribute`, then points are sealed |
| `migrate` | link creates the DB and registers models |
| `seed` | link writes seeds |
| `start` | link wires the event bus, subscriptions, routes; layers `bind` |
| `ready` | HTTP server listens |
| `drain`, `stop` | server closes, layers `unbind`, DB and bus disconnect |

If a hook fails during start, the layers already touched are unwound in reverse.

## Recipes

| Add | Where | How |
|---|---|---|
| Action | `src/actions/` | `ctx.contribute(nuc.points.actions, action)` |
| Channel | `src/channels/` | `ctx.contribute(greycollar.points.channels, channel)` |
| Route | `src/routes/` | `ctx.contribute(link.points.routes, { path, router, public? })` |
| Model | `src/models/` | `ctx.contribute(link.points.models, Model)` |
| Seed | `src/seeds/<Model>.json` | `ctx.contribute(link.points.seeds, { model, sequence, seed })` |
| Event handler | `src/subscriptions.ts` | `{ type: "UPPER_SNAKE", handler }` |
| Extension point | `src/index.ts` | `link.point<T>("<layer>.<name>")`, `ctx.define(...)`, export `points` |
| Public function | `src/index.ts` | `export { fn }` |

## Pitfalls

link-express is bun-linked, so some libraries exist twice.

- Each layer imports `express-async-errors` in its own `index.ts`; otherwise async route errors hang the request.
- Root `tsconfig.json` `paths` pins `express`, `sequelize` and `joi` types to this project's copy.
- Model decorators come from `@canmingir/link-express/sequelize`, not `sequelize-typescript`.
