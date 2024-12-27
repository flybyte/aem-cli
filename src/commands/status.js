import { Argument } from "commander";

export const statusCommand = (program) => {
    const cmd = program.command("status").description("status of aemdev environment");

    cmd.addArgument(
        new Argument("service", "comma-seperated list of services from the compose file").default("").argOptional()
    );

    cmd.action((str, options) => {
        console.log(str); // TODO refer to ./actions/init.js
    });
};
