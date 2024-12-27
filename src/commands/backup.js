import { Option } from "commander";

export const backupCommand = (program) => {
    const cmd = program.command("backup").description("backup aemdev environment");

    cmd.addOption(new Option("-n, --name <string>", "name of the backup").makeOptionMandatory(true));
    cmd.addOption(new Option("-d, --description <string>", "description of the backup").makeOptionMandatory(false));

    cmd.action((str, options) => {
        console.log(str); // TODO refer to ./actions/init.js
    });
};
