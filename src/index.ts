import Database from "./Database";
import { TaskGroup, TaskManager } from "./TaskManager";
import { ArgvHelper } from "./Utils/ArgvHelper";
import { Logger } from "./Utils/Logger";
import { MomentHelper } from "./Utils/MomentHelper";

MomentHelper.setupMoment();

const logger = Logger.setupLogger();

async function main() {
  const argv = ArgvHelper.argv;

  const database = new Database();
  try {
    await database.open();

    // Execute tasks if any.
    if (argv.group) {
      await TaskManager.execute(argv.group as TaskGroup, argv, database);
    }
  } catch (error) {
    logger.error(error);
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});
