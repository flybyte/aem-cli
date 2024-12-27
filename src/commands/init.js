import path from "path";
import { Option } from "commander";
import chalk from "chalk";
import * as Sqrl from 'squirrelly';
import { Constants } from "../constants.js";
import {
    checkIfContainerEngineAvailable,
    checkIfFilesExist,
    hideDeprecationWarnings,
    printErrorAndExit,
    fetchResourceAsText,
    options2data,
} from "../util/swissarmyknife.js";

const { white } = chalk;

export const initCommand = (program) => {
    const cmd = program.command("init").description("Initialize local AEM dev environment");

    cmd.addOption(new Option("-a, --author       <string>", "the ports used for the author container").default("4502,14502,24502"));
    cmd.addOption(new Option("-b, --backup       <string>", "path to the backups folder").default("./backups"));
    cmd.addOption(new Option("-d, --domain       <string>", "local domain without subdomain").default("aem.local"));
    cmd.addOption(new Option("-e, --engine       <string>", "which container engine to use").default("podman").choices(["podman", "docker"]));
    cmd.addOption(new Option("-f, --force", "required to overwrite existing files").default(false));
    cmd.addOption(new Option("-i, --image        <string>", "the name of the registry and namespace for the container (example: 'ghcr.io/flybyte')").makeOptionMandatory(true));
    cmd.addOption(new Option("-l, --mail         <string>", "the ports used for the mail container").default("4025,4090"));
    cmd.addOption(new Option("-m, --maven        <string>", "the path to the Maven project").makeOptionMandatory(true));
    cmd.addOption(new Option("-n, --name         <string>", "name of the project in podman/docker compose").default("aemdev"));
    cmd.addOption(new Option("-o, --hosts", "when present will add/update entries to local hosts file").default(false));
    cmd.addOption(new Option("-p, --publish      <string>", "the ports used for the publish container").default("4503,14503,24503"));
    cmd.addOption(new Option("-r, --dispatcher   <string>", "the port used for the dispatcher container").default("8080"));
    cmd.addOption(new Option("-s, --ssl", "when present it will run aemdev with SSL support").default(false));
    cmd.addOption(new Option("-t, --tag          <string>", "the tag of the container images").default("latest"));
    cmd.addOption(new Option("-v, --volume       <string>", "path to the container volumes folder").default("./volumes"));
    cmd.addOption(new Option("-x, --proxy        <string>", "the ports to the proxy container").default("80,443"));
    cmd.addOption(new Option("-z, --timezone     <string>", "the timezone of the container images").default("Europe/Zurich"));

    cmd.action((options) => {
        hideDeprecationWarnings();
        checkIfContainerEngineAvailable();
        checkIfProceed(options);
        // create local folders
        createLocalFiles(options);

        // TODO create files/folders
        // TODO print message how to proceed
        console.log(options);
    });
};

const checkIfProceed = (options) => {
    const curDir = process.cwd();
    const envPath = path.join(curDir, ".env");
    const composePath = path.join(curDir, "compose.yml");
    const volumePath = path.join(curDir, options.volume);
    const authorPath = path.join(volumePath, "author");
    const publishPath = path.join(volumePath, "publish");
    const dispatcherPath = path.join(volumePath, "dispatcher");
    const proxyPath = path.join(volumePath, "proxy");
    const backupPath = path.join(curDir, options.backup);
    const pathsToCheck = [envPath, composePath, volumePath, authorPath, publishPath, dispatcherPath, proxyPath, backupPath];
    const { existing } = checkIfFilesExist(pathsToCheck);

    if (existing.length > 0 && !options.force) {
        printErrorAndExit(`Required resources already exits. Use ${white("--force")} to proceed and forcefully overwrite existing resources.`, 5);
    }

    if (options.author.split(",").length !== 3) {
        printErrorAndExit(`${white("--author")} option has wrong format, requires ${white("3 port numbers")} seperated by comma (e.g. 4502,14502,24502): ${options.author}`, 6);
    }

    if (options.publish.split(",").length !== 3) {
        printErrorAndExit(`${white("--publish")} option has wrong format, requires ${white("3 port numbers")} seperated by comma (e.g. 4503,14503,24503): ${options.publish}`, 6);
    }

    if (options.proxy.split(",").length !== 2) {
        printErrorAndExit(`${white("--proxy")} option has wrong format, requires ${white("2 port numbers")} seperated by comma (e.g. 80,443): ${options.proxy}`, 6);
    }

    if (options.mail.split(",").length !== 2) {
        printErrorAndExit(`${white("--mail")} option has wrong format, requires ${white("2 port numbers")} seperated by comma (e.g. 4025,4090): ${options.mail}`, 6);
    }
};

const createLocalFiles = async (options) => {
    const envTpl = await fetchResourceAsText(Constants.templates.env);
    const composeTpl = await fetchResourceAsText(Constants.templates.compose);

    const envTpl2 = "AUTHOR_HTTP: {{it.AUTHOR_HTTP}} \nAUTHOR_DEBUG: {{it.AUTHOR_DEBUG}} \n# test";

    const envData = options2data(options);
    const env = Sqrl.render(envTpl2, envData);

    console.log(env);
    // write env
    // write compos
};

