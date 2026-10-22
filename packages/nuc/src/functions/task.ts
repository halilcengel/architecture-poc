import { event } from "@canmingir/link-express/event/client";
import { NotFoundError } from "@canmingir/link-express/error";
import Step from "../models/Step";
import Task from "../models/Task";
import action from "./action";
import agent from "./agent";

const THRESHOLD = 0.5;

async function start(text: string) {
  const task = await Task.create({ text, status: "RUNNING" });
  await event.publish("TASK_STARTED", { taskId: task.id });
  return task.toJSON();
}

async function get(taskId: string) {
  const task = await Task.findByPk(taskId);

  if (!task) throw new NotFoundError();

  const steps = await Step.findAll({ where: { taskId }, order: [["createdAt", "ASC"]] });
  return { ...task.toJSON(), steps: steps.map((step) => step.toJSON()) };
}

async function plan(taskId: string) {
  const task = await Task.findByPk(taskId, { rejectOnEmpty: true });
  const selected = agent.selectAction(task.text, action.list());

  if (!selected) return complete(task, "FAILED", "no action matches the request");

  const parameters = agent.selectParameters(task.text, selected);
  const step = await Step.create({ taskId, action: selected.name, parameters });

  await event.publish("STEP_ADDED", { taskId, stepId: step.id });
}

async function execute(taskId: string, stepId: string) {
  const task = await Task.findByPk(taskId, { rejectOnEmpty: true });
  const step = await Step.findByPk(stepId, { rejectOnEmpty: true });
  const score = agent.hallucination(task.text, step.parameters);

  if (score > THRESHOLD) {
    await step.update({ hallucination: score });
    return complete(task, "FAILED", `hallucination ${score} is above ${THRESHOLD}`);
  }

  const result = await action.get(step.action).run(step.parameters);

  await step.update({ hallucination: score, result });
  await complete(task, "COMPLETED", result);
}

async function complete(task: Task, status: "COMPLETED" | "FAILED", result: string) {
  await task.update({ status, result });
  await event.publish("TASK_COMPLETED", { taskId: task.id, status, result });
}

export default { start, get, plan, execute };
