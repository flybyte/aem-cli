import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";

const { white, red } = chalk;

// hide deprecation warnings from sudo-prompt
export const hideDeprecationWarnings = () => {
    process.emitWarning = (warning, ...args) => {
        if (warning.includes("The `util.isObject` API is deprecated.")) return;
        if (warning.includes("The `util.isFunction` API is deprecated.")) return;
        console.warn(warning);
    };
};

export const checkIfFilesExist = (files) => {
    const existing = [];
    const missing = [];
    for (const file of files) {
        fs.existsSync(file) ? existing.push(file) : missing.push(file);
    }
    return { existing, missing };
};

export const checkIfValidAemdevDir = () => {
    const currentDir = process.cwd();
    const filesToCheck = [path.join(currentDir, ".env"), path.join(currentDir, "compose.yml")];

    const { missing } = checkIfFilesExist(filesToCheck);
    if (missing.length > 0) {
        const message = `Cannot find the following required resources. Did you run ${white("aemdev init")}?\n${white(missing.join("\n"))}`;
        printErrorAndExit(message, 2);
    }
};

export const checkIfContainerEngineAvailable = () => {
    if (!executeCommand("podman --version") && !executeCommand("docker --version")) {
        printErrorAndExit(
            `Cannot find a container engine. Please make sure that either ${white("podman")} or ${white("docker")} is installed.`,
            1
        );
    }
};

export const executeCommand = (cmd) => {
    try {
        execSync(cmd, { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
};

export const checkIfLoggedInContainerRegistry = (engine = "podman", image) => {
    const paths = {
        podman: path.join(process.env.HOME || process.env.USERPROFILE, ".config", "containers", "auth.json"),
        docker: path.join(process.env.HOME || process.env.USERPROFILE, ".docker", "config.json"),
    };
    const configPath = paths[engine];

    if (!fs.existsSync(configPath)) {
        printErrorAndExit(
            `Cannot find configuration at ${white(configPath)}. Did you run ${white(engine + " login")}?`,
            3
        );
    }

    const configContent = fs.readFileSync(configPath, "utf-8");
    try {
        const config = JSON.parse(configContent);
        const auths = config.auths || {};
        const registry = image.split("/")[0];

        if (!auths[registry] || !auths[registry].auth) {
            printErrorAndExit(
                `No login for ${white(registry)} detected. Did you run ${white(engine + " login " + registry)}?`,
                4
            );
        }
    } catch (error) {
        printErrorAndExit(`Error parsing ${white(configPath)} config file: ${white(error.message)}`, 50);
    }
};

export const printErrorAndExit = (msg, code = 999) => {
    console.log(red(msg));
    process.exit(code);
};

export const parseEnvFile = () => {
    const envFilePath = path.join(process.cwd(), ".env");
    const fileContent = fs.readFileSync(envFilePath, "utf8");

    const result = {};

    fileContent.split(/\r?\n/).forEach((line) => {
        if (line.trim() === "" || line.trim().startsWith("#")) {
            return;
        }

        const [key, value] = line.split("=");
        if (key && value) {
            result[key.trim()] = value.trim();
        }
    });

    return result;
};
