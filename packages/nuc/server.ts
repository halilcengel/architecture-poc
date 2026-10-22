import { run } from "@canmingir/link-express/link";
import config from "../../config";
import * as nuc from "./src";

await run(await nuc.init({ ...config, server: { port: Number(process.env.PORT ?? 4000) } }));
