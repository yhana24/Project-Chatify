const { spawn } = require("child_process");
const path = require('path');
const logger = require("./utils/logger");

const SCRIPT_FILE = "chatify.js";
const SCRIPT_PATH = path.join(__dirname, SCRIPT_FILE);
const MAX_MEMORY_USAGE = 1000 * 1024 * 1024;
const RESTART_DELAY = 1000;
const CHECK_INTERVAL = 5000;

function monitorProcess(proc) {
    const memoryCheckInterval = setInterval(() => {
        const memoryUsage = process.memoryUsage().heapUsed;
        const memoryUsageMB = Math.round(memoryUsage / 1024 / 1024);

        if (memoryUsage > MAX_MEMORY_USAGE) {
            logger.error(`Memory usage exceeded ${MAX_MEMORY_USAGE / 1024 / 1024}MB (Current: ${memoryUsageMB}MB)`);
            clearInterval(memoryCheckInterval);
            proc.kill('SIGKILL');
        }
    }, CHECK_INTERVAL);

    return memoryCheckInterval;
}

function start() {
    const main = spawn("node", [SCRIPT_PATH], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    const monitor = monitorProcess(main);

    main.on("error", (err) => {
        logger.error(`Process error: ${err.message}`);
        clearInterval(monitor);
    });

    main.on("close", (exitCode) => {
        clearInterval(monitor);

        const exitCodes = {
            0: "Clean exit",
            1: "Error exit",
            137: "Out of memory",
        };

        const message = exitCodes[exitCode] || "Unknown error";
        logger.system(`Process exited (${exitCode}): ${message}`);

        if (exitCode !== 0) {
            setTimeout(() => {
                logger.system("Restarting process...");
                start();
            }, RESTART_DELAY);
        }
    });

    process.on("SIGINT", () => {
        logger.system("Received SIGINT signal");
        clearInterval(monitor);
        main.kill("SIGINT");
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        logger.system("Received SIGTERM signal");
        clearInterval(monitor);
        main.kill("SIGTERM");
        process.exit(0);
    });
}

logger.system("Starting process monitor...");
start();
