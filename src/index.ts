import { initDb } from "./db/index.js";
import { startBot } from "./bot/index.js";

async function main() {
  await initDb();
  await startBot();
}

main().catch((err) => {
  console.error("[Fatal] Startup failed:", err);
  process.exit(1);
});
