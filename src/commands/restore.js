import { Option } from "commander";

export const restoreCommand = (program) => {
    const cmd = program.command("restore").description("restore aemdev environment");

    cmd.addOption(new Option("-n, --name <string>", "name of the backup").makeOptionMandatory(true));

    cmd.action((str, options) => {
        console.log(str); // TODO refer to ./actions/init.js
    });
};
