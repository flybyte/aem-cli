#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { createCommand } from "./commands/create.js";
import { destroyCommand } from "./commands/destroy.js";
import { startCommand } from "./commands/start.js";
import { stopCommand } from "./commands/stop.js";
import { restartCommand } from "./commands/restart.js";
import { resetCommand } from "./commands/reset.js";
import { backupCommand } from "./commands/backup.js";
import { restoreCommand } from "./commands/restore.js";
import { statusCommand } from "./commands/status.js";

const program = new Command().name("aemdev").description("CLI to manage a local AEM dev environment").version("0.1.0");

initCommand(program);
createCommand(program);
destroyCommand(program);
startCommand(program);
stopCommand(program);
restartCommand(program);
resetCommand(program);
backupCommand(program);
restoreCommand(program);
statusCommand(program);

program.parse();
