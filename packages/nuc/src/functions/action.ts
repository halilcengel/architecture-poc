import type { PointHandle } from "@canmingir/link-express/link";
import type { Action } from "../action";

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

function get(name: string) {
  const action = list().find((item) => item.name === name);

  if (!action) throw new Error(`unknown action ${name}`);

  return action;
}

export default { bind, unbind, list, get };
