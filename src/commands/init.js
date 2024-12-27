import fs from "fs";
import path from "path";
import { Option } from "commander";
import chalk from "chalk";
import {
    checkIfContainerEngineAvailable, checkIfFilesExist, hideDeprecationWarnings, printErrorAndExit,
} from "../util/swissarmyknife.js";

const { white } = chalk;

export const initCommand = (program) => {
    const cmd = program.command("init").description("Initialize local AEM dev environment");

    cmd.addOption(new Option("-a, --author       <string>", "the ports used for the author container").default("4502,14502,24502"));
    cmd.addOption(new Option("-b, --backup       <string>", "path to the backups folder").default("~/.aemdev/backups"));
    cmd.addOption(new Option("-d, --domain       <string>", "local domain without subdomain").default("aem.local"));
    cmd.addOption(new Option("-e, --engine       <string>", "which container engine to use").default("podman").choices(["podman", "docker"]));
    cmd.addOption(new Option("-f, --force", "required to overwrite existing files").default(false));
    cmd.addOption(new Option("-i, --image        <string>", "the name of the registry and namespace for the container").default("ghcr.io/flybyte"));
    cmd.addOption(new Option("-n, --name         <string>", "name of the project in podman/docker compose").default("aemdev"));
    cmd.addOption(new Option("-o, --hosts", "when present will add/update entries to local hosts file").default(false));
    cmd.addOption(new Option("-p, --project      <string>", "the path to the Maven project").default("../aem-website"));
    cmd.addOption(new Option("-r, --dispatcher   <string>", "the port used for the dispatcher container").default("8080"));
    cmd.addOption(new Option("-s, --ssl", "when present it will run aemdev with SSL support").default(false));
    cmd.addOption(new Option("-t, --tag          <string>", "the tag of the container images").default("latest"));
    cmd.addOption(new Option("-u, --publish      <string>", "the ports used for the publish container").default("4503,14503,24503"));
    cmd.addOption(new Option("-v, --volume       <string>", "path to the container volumes folder").default("~/.aemdev/volumes"));
    cmd.addOption(new Option("-x, --proxy        <string>", "the ports to the proxy container").default("80,443"));
    cmd.addOption(new Option("-z, --timezone     <string>", "the timezone of the container images").default("Europe/Zurich"));

    cmd.action((options) => {
        hideDeprecationWarnings();
        checkIfContainerEngineAvailable();
        checkIfProceed(options);

        // create .env file
        // create compose.yml

        // write options to .config file
        // TODO create files/folders
        // TODO print message how to proceed
        console.log(options);
    });
};

const checkIfProceed = async (options) => {
    const envPath = path.join(process.cwd(), ".env");
    const composePath = path.join(process.cwd(), "compose.yml");
    const volumePath = path.resolve(options.volume);
    const authorPath = path.join(volumePath, "author");
    const publishPath = path.join(volumePath, "publish");
    const dispatcherPath = path.join(volumePath, "dispatcher");
    const proxyPath = path.join(volumePath, "proxy");
    const pathsToCheck = [envPath, composePath, volumePath, authorPath, publishPath, dispatcherPath, proxyPath];
    const { existing } = checkIfFilesExist(pathsToCheck);

    if (existing.length > 0 && !options.force) {
        printErrorAndExit(`Required resources already exits. Use ${white("--force")} to proceed and forcefully overwrite existing resources.`, 5);
    }
};

const createComposeFiles = async (options) => {

};

