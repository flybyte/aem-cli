import path from "path";
import { chmod, rm } from "fs/promises";
import { Option } from "commander";
import chalk from "chalk";
import { Constants } from "../constants.js";
import * as helper from "../helper.js";

const { white, gray } = chalk;
const curDir = process.cwd();

// prettier-ignore
export const initCommand = (program) => {
    const cmd = program.command("init").description("Initialize local AEM dev environment");

    cmd.addOption(new Option("-a, --author       <string>", "the ports used for the author container").default("4502,14502,24502"));
    cmd.addOption(new Option("-d, --domain       <string>", "local domain without subdomain").default("aem.local"));
    cmd.addOption(new Option("-e, --engine       <string>", "which container engine to use").default("podman").choices(["podman", "docker"]));
    cmd.addOption(new Option("-f, --force", "required to overwrite existing files").default(false));
    cmd.addOption(new Option("-i, --image        <string>", "the name of the registry and namespace for the container (example: 'ghcr.io/flybyte')").makeOptionMandatory(true));
    cmd.addOption(new Option("-l, --mail         <string>", "the ports used for the mail container").default("4090,4025"));
    cmd.addOption(new Option("-m, --maven        <string>", "the path to the Maven project").makeOptionMandatory(true));
    cmd.addOption(new Option("-n, --name         <string>", "name of the project in podman/docker compose").default("aemdev"));
    cmd.addOption(new Option("-o, --hosts", "when present will add/update entries to local hosts file").default(false));
    cmd.addOption(new Option("-p, --publish      <string>", "the ports used for the publish container").default("4503,14503,24503"));
    cmd.addOption(new Option("-r, --dispatcher   <string>", "the port used for the dispatcher container").default("4080"));
    cmd.addOption(new Option("-s, --ssl", "to setup local SSL").default(false));
    cmd.addOption(new Option("-t, --tag          <string>", "the tag of the container images").default("latest"));
    cmd.addOption(new Option("-x, --proxy        <string>", "the ports to the proxy container").default("80,443"));
    cmd.addOption(new Option("-z, --timezone     <string>", "the timezone of the container images").default("Europe/Zurich"));

    cmd.action((options) => {
        hideDeprecationWarnings();
        helper.checkIfContainerEngineAvailable();
        checkIfProceed(options);
        createFolders();
        createLocalFiles(options);
        downloadFiles(options);
        if (options.ssl) {
            createSSLCert(options);
        }
        // TODO hosts file
        // TODO print message how to proceed
    });
};

const hideDeprecationWarnings = () => {
    // hide deprecation warnings from sudo-prompt
    process.emitWarning = (warning, ...args) => {
        if (warning.includes("The `util.isObject` API is deprecated.")) return;
        if (warning.includes("The `util.isFunction` API is deprecated.")) return;
        console.warn(warning);
    };
};

const checkIfProceed = (options) => {
    const envPath = path.join(curDir, ".env");
    const composePath = path.join(curDir, "compose.yml");
    const volumePath = path.join(curDir, "volumes");
    const authorPath = path.join(volumePath, "author");
    const publishPath = path.join(volumePath, "publish");
    const dispatcherPath = path.join(volumePath, "dispatcher");
    const proxyPath = path.join(volumePath, "proxy");
    const backupPath = path.join(curDir, "backups");
    const pathsToCheck = [
        envPath,
        composePath,
        volumePath,
        authorPath,
        publishPath,
        dispatcherPath,
        proxyPath,
        backupPath,
    ];
    const { existing } = helper.checkIfFilesExist(pathsToCheck);

    if (existing.length > 0 && !options.force) {
        helper.printErrorAndExit(
            `Required resources already exits. Use ${white("--force")} to proceed and forcefully overwrite existing resources.`,
            5
        );
    }

    if (options.author.split(",").length !== 3) {
        helper.printErrorAndExit(
            `${white("--author")} option has wrong format, requires ${white("3 port numbers")} seperated by comma (e.g. 4502,14502,24502): ${options.author}`,
            6
        );
    }

    if (options.publish.split(",").length !== 3) {
        helper.printErrorAndExit(
            `${white("--publish")} option has wrong format, requires ${white("3 port numbers")} seperated by comma (e.g. 4503,14503,24503): ${options.publish}`,
            6
        );
    }

    if (options.proxy.split(",").length !== 2) {
        helper.printErrorAndExit(
            `${white("--proxy")} option has wrong format, requires ${white("2 port numbers")} seperated by comma (e.g. 80,443): ${options.proxy}`,
            6
        );
    }

    if (options.mail.split(",").length !== 2) {
        helper.printErrorAndExit(
            `${white("--mail")} option has wrong format, requires ${white("2 port numbers")} seperated by comma (e.g. 4025,4090): ${options.mail}`,
            6
        );
    }
};

const createFolders = () => {
    console.log("Creating folder structure...");

    helper.createFolder(path.join(curDir, Constants.folder.backups));
    helper.createFolder(path.join(curDir, Constants.folder.volumes, "author", "install"));
    helper.createFolder(path.join(curDir, Constants.folder.volumes, "author", "logs"));
    helper.createFolder(path.join(curDir, Constants.folder.volumes, "publish", "install"));
    helper.createFolder(path.join(curDir, Constants.folder.volumes, "publish", "logs"));
    helper.createFolder(path.join(curDir, Constants.folder.volumes, "dispatcher", "cache"));
    helper.createFolder(path.join(curDir, Constants.folder.volumes, "dispatcher", "logs"));
    helper.createFolder(path.join(curDir, Constants.folder.volumes, "proxy", "conf.d"));
    helper.createFolder(path.join(curDir, Constants.folder.volumes, "proxy", "html"));
    helper.createFolder(path.join(curDir, Constants.folder.volumes, "proxy", "ssl"));
};

// prettier-ignore
const createLocalFiles = async (options) => {
    console.log("Creating local files...");

    const data = options2data(options);
    const authorDir = path.join(curDir, Constants.folder.volumes, "author", "install");
    const publishDir = path.join(curDir, Constants.folder.volumes, "publish", "install");
    const proxyConfDir = path.join(curDir, Constants.folder.volumes, "proxy", "conf.d");

    await helper.processTemplateAndSave(Constants.templates.env, data, path.join(curDir, ".env"));
    await helper.processTemplateAndSave(Constants.templates.compose, data, path.join(curDir, "compose.yml"));
    await helper.processTemplateAndSave(Constants.templates.readme, data, path.join(curDir, "README.md"));

    await helper.processTemplateAndSave(Constants.templates.mail, { ...data, AEM_TYPE: "author" },
        path.join(authorDir, "DefaultMailService.config"));
    await helper.processTemplateAndSave(Constants.templates.mail, { ...data, AEM_TYPE: "publish" },
        path.join(publishDir, "DefaultMailService.config"));

    await helper.processTemplateAndSave(Constants.templates.author, data, path.join(proxyConfDir, "author.conf"));
    await helper.processTemplateAndSave(Constants.templates.publish, data, path.join(proxyConfDir, "publish.conf"));
    await helper.processTemplateAndSave(Constants.templates.dispatcher, data, path.join(proxyConfDir, "dispatcher.conf"));
    await helper.processTemplateAndSave(Constants.templates.proxy, data, path.join(proxyConfDir, "root.conf"));
    await helper.processTemplateAndSave(Constants.templates.smtp, data, path.join(proxyConfDir, "smtp.conf"));

    await helper.processTemplateAndSave(Constants.templates.html, data, path.join(curDir, Constants.folder.volumes, "proxy", "html", "index.html"));
};

// prettier-ignore
const downloadFiles = async (options) => {
    console.log("Download static files...");

    await helper.fetchResourceAsBinary(Constants.files.nginx, path.join(curDir, Constants.folder.volumes, "proxy", "nginx.conf"));
    await helper.fetchResourceAsBinary(Constants.files.crypto, path.join(curDir, Constants.folder.volumes, "author", "install", "crypto_support.zip"));
    await helper.fetchResourceAsBinary(Constants.files.crypto, path.join(curDir, Constants.folder.volumes, "publish", "install", "crypto_support.zip"));
    await helper.fetchResourceAsBinary(Constants.files.replicationFlush,
        path.join(curDir, Constants.folder.volumes, "author", "install", "replication_agent_publish.zip"));
    await helper.fetchResourceAsBinary(Constants.files.replicationPublish,
        path.join(curDir, Constants.folder.volumes, "publish", "install", "replication_agent_flush.zip"));
};

const createSSLCert = async (options) => {
    const binaryPath = path.join(curDir, "mkcert");

    console.log("Downloading mkcert binary...");
    const url = `https://dl.filippo.io/mkcert/v1.4.4?for=${helper.getPlatformID()}`;
    await helper.fetchResourceAsBinary(url, binaryPath);
    chmod(binaryPath, 0o755);

    console.log("Creating SSL certificate...");
    console.log(gray("Hint: You may be asked for your password in order to setup and execute mkcert."))
    const entries = ["localhost", "127.0.0.1", "::1", options.domain, `www.${options.domain}`, `*.${options.domain}`];
    const sslDir = path.join(curDir, Constants.folder.volumes, "proxy", "ssl");
    const args = `-cert-file ${sslDir}/default.crt -key-file ${sslDir}/default.key ${entries.map((s) => `"${s}"`).join(" ")}`;
    helper.executeCommand(`${binaryPath} --install && ${binaryPath} ${args}`);

    console.log("Deleting mkcert binary...");
    rm(binaryPath);
};

const options2data = (options) => {
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
    data.MAIL_HTTP = mail[0];
    data.MAIL_SMTP = mail[1];
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
