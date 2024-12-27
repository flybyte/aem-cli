import { Argument } from "commander";

export const restartCommand = (program) => {
    const cmd = program.command("restart").description("restart aemdev environment");

    cmd.addArgument(
        new Argument("service", "comma-seperated list of services from the compose file").default("").argOptional()
    );

    cmd.action((str, options) => {
        console.log(str); // TODO refer to ./actions/init.js
    });
};
