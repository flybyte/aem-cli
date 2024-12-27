import { Argument } from "commander";

export const stopCommand = (program) => {
    const cmd = program.command("stop").description("stop aemdev environment");

    cmd.addArgument(
        new Argument("service", "comma-seperated list of services from the compose file").default("").argOptional()
    );

    cmd.action((str, options) => {
        console.log(str); // TODO refer to ./actions/init.js
    });
};
