import { run } from "@canmingir/link-express/link";
import config from "../../config";
import * as telco from "./src";

await run(
  await telco.init({
    ...config,
    server: { port: Number(process.env.PORT ?? 4000) },
  }),
);
