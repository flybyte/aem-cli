import { Argument } from "commander";

export const destroyCommand = (program) => {
    const cmd = program.command("destroy").description("destroy aemdev environment");

    cmd.addArgument(
        new Argument("service", "comma-seperated list of services from the compose file").default("").argOptional()
    );

    cmd.action((str, options) => {
        console.log(str); // TODO refer to ./actions/init.js
    });
};
