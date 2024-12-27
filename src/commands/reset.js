import { Argument, Option } from "commander";

export const resetCommand = (program) => {
    const cmd = program.command("reset").description("reset aemdev environment");

    cmd.addArgument(
        new Argument("service", "comma-seperated list of services from the compose file").default("").argOptional()
    );

    cmd.addOption(
        new Option(
            "-u, --update",
            "when present it will pull the latest container before creating environment"
        ).default(false)
    );

    cmd.action((str, options) => {
        console.log(str); // TODO refer to ./actions/init.js
    });
};
