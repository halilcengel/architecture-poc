import type { Subscription } from "@canmingir/link-express/link";
import message from "./functions/message";

const subscriptions: Subscription[] = [
  {
    type: "TASK_COMPLETED",
    handler: ({ taskId, result }: { taskId: string; result: string }) =>
      message.reply(taskId, result),
  },
];

export default subscriptions;
