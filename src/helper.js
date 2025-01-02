import { execSync } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import doT from "dot";
import { pipeline } from "stream/promises";

const { white, red } = chalk;
doT.templateSettings.strip = false;

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
        execSync(cmd);
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
};

export const fetchResourceAsBinary = async (url, target) => {
    const response = await fetchResource(url);
    try {
        const fileStream = fs.createWriteStream(path.resolve(target));
        await pipeline(response.body, fileStream);
    } catch (error) {
        printErrorAndExit(`Cannot fetch resource for ${url} and store at ${target}: ${error.message}`, 106);
    }
};

export const writeTextToFile = (filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, "utf8");
    } catch (error) {
        printErrorAndExit(`Cannot write text to ${filePath}: ${error.message}`, 107);
    }
};

export const processTemplate = async (url, data) => {
    try {
        const template = await fetchResourceAsText(url);
        //const template = "{{? it.SSL }}TRUE{{?}}";
        const render = doT.template(template);
        //console.log(render(data));
        //process.exit(0);

        return render(data);
    } catch (error) {
        printErrorAndExit(`Cannot render template from ${url}: ${error.message}`, 107);
    }
};

export const processTemplateAndSave = async (url, data, target) => {
    const content = await processTemplate(url, data);
    writeTextToFile(target, content);
};

export const getPlatformID = () => {
    const id = os.platform() + "/" + os.arch();

    if (id === "win32/x64") return "windows/amd64";
    if (id === "linux/x64") return "linux/amd64";
    if (id === "darwin/x64") return "darwin/amd64";
    if (id === "darwin/arm64") return "darwin/arm64";

    printErrorAndExit(`Unsupported platform ${id}`, 109);
};
