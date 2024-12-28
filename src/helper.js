import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { Constants } from "./constants.js";

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
    const filePath = path.join(process.cwd(), ".env");
    const fileContent = fs.readFileSync(filePath, "utf8");

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

export const createFolder = (folderPath) => {
    try {
        fs.mkdirSync(folderPath, { recursive: true });
    } catch (error) {
        printErrorAndExit(`Cannot create folders for ${white(folderPath)}: ${error.message}`, 106);
    }
};

export const fetchResource = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response;
    } catch (error) {
        printErrorAndExit(`Cannot fetch resource for ${url}: ${error.message}`, 105);
    }
};

export const fetchResourceAsText = async (url) => {
    return (await fetchResource(url)).text();
}

export const fetchResourceAsBinary = async (url) => {
    return (await fetchResource(url)).body;
}

export const writeTextToFile = (filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, "utf8");
    } catch (error) {
        printErrorAndExit(`Cannot write text to ${filePath}: ${error.message}`, 107);
    }
};

export const options2data = (options) => {
    const data = {};

    const author = options.author.split(",");
    const publish = options.publish.split(",");
    const proxy = options.proxy.split(",");
    const mail = options.mail.split(",");

    data.AUTHOR_HTTP = author[0];
    data.AUTHOR_DEBUG = author[1];
    data.AUTHOR_JMX = author[2];
    data.BACKUP_DIR = path.join(process.cwd(), Constants.folder.backups);
    data.DISPATCHER_HTTP = options.dispatcher;
    data.DOMAIN = options.domain;
    data.ENGINE = options.engine;
    data.HOSTS = options.hosts;
    data.IMAGE = options.image;
    data.MAIL_HTTP = mail[0]
    data.MAIL_SMTP = mail[1]
    data.NAME = options.name;
    data.PROJECT_DIR = path.resolve(options.maven);
    data.PROXY_HTTP = proxy[0];
    data.PROXY_HTTPS = proxy[1];
    data.SSL = options.ssl;
    data.PUBLISH_HTTP = publish[0];
    data.PUBLISH_DEBUG = publish[1];
    data.PUBLISH_JMX = publish[2];
    data.TAG = options.tag;
    data.TZ = options.timezone;
    data.VOLUME_DIR = path.join(process.cwd(), Constants.folder.volumes);

    return data;
};

