import { Argument } from "commander";
import {
    checkIfValidAemdevDir,
    checkIfContainerEngineAvailable,
    parseEnvFile,
    checkIfLoggedInContainerRegistry,
} from "../util/swissarmyknife.js";

export const createCommand = (program) => {
    const cmd = program.command("create").description("create aemdev environment");

    cmd.addArgument(
        new Argument("service", "comma-seperated list of services from the compose file").default("").argOptional()
    );

    cmd.action((str, options) => {
        checkIfValidAemdevDir();
        checkIfContainerEngineAvailable();
        const env = parseEnvFile();
        checkIfLoggedInContainerRegistry(env.engine, env.image);

        // TODO run podman up <svc> -d
    });
};
