import { run } from "@canmingir/link-express/link";
import config from "../../config";
import * as greycollar from "./src";

await run(
  await greycollar.init({
    ...config,
    server: { port: Number(process.env.PORT ?? 4000) },
  }),
);
