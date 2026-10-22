import type { Subscription } from "@canmingir/link-express/link";
import task from "./functions/task";

const subscriptions: Subscription[] = [
  {
    type: "TASK_STARTED",
    handler: ({ taskId }: { taskId: string }) => task.plan(taskId),
  },
  {
    type: "STEP_ADDED",
    handler: ({ taskId, stepId }: { taskId: string; stepId: string }) =>
      task.execute(taskId, stepId),
  },
];

export default subscriptions;
