/** Prints the resolved pool limit so the free-tier sizing can be checked. */
import "dotenv/config";

import { loadConfig } from "../conf/config";

const { url, pool_limit } = loadConfig().database.postgres;
const applied = url.match(/connection_limit=\d+/)?.[0] ?? "none";

console.log("configured pool_limit:", pool_limit);
console.log("applied to url:", applied);
console.log("heap cap:", process.env.NODE_OPTIONS ?? "(unset locally; set on Render)");
