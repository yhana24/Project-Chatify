const login = require("chatbox-fca-remake");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");
const Database = require("./utils/database");
const logger = require("./utils/logger");

global.client = {
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    messageQueue: new Map(),
    utils: require("./utils/helper")
};

global.data = {
    threadInfo: new Database("threads.json"),
    userInfo: new Database("users.json"),
    settings: new Database("settings.json"),
    stats: new Database("stats.json"),
    temps: {},
    maintain: false
};

global.config = require("./config.json");

function loadCommands() {
    const commandFiles = fs.readdirSync(path.join(__dirname, "script", "cmds"))  
        .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        try {
            const command = require(path.join(__dirname, "script", "cmds", file)); 
            global.client.commands.set(command.config.name, command);
            
            if (command.config.aliases) {
                command.config.aliases.forEach(alias => {
                    global.client.commands.set(alias, command);
                });
            }
            
            logger.system(`Loaded command: ${command.config.name}`);
        } catch (error) {
            logger.error(`Failed to load command ${file}: ${error}`);
        }
    }
}

function loadEvents() {
    const eventFiles = fs.readdirSync(path.join(__dirname, "script", "events"))  
        .filter(file => file.endsWith(".js"));

    for (const file of eventFiles) {
        try {
            const event = require(path.join(__dirname, "script", "events", file)); 
            global.client.events.set(event.config.name, event);
            logger.system(`Loaded event: ${event.config.name}`);
        } catch (error) {
            logger.error(`Failed to load event ${file}: ${error}`);
        }
    }
}

async function handleMessage({ api, event, args, commandName }) {
    const command = global.client.commands.get(commandName);
    if (!command) return;

    if (command.config.permissions) {
        const hasPermission = command.config.permissions.some(permission => 
            permission === "user" || 
            (permission === "admin" && global.config.admin.includes(event.senderID))
        );
        
        if (!hasPermission) {
            return api.sendMessage("⚠️ Insufficient permissions", event.threadID);
        }
    }

    const cooldownKey = `${commandName}-${event.senderID}`;
    const cooldownTime = global.client.cooldowns.get(cooldownKey);
    const now = Date.now();

    if (cooldownTime && now < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - now) / 1000);
        return api.sendMessage(
            `⏳ Please wait ${timeLeft}s before using this command again.`,
            event.threadID
        );
    }

    try {
        await command.run({ api, event, args });
        
        if (command.config.cooldown) {
            global.client.cooldowns.set(
                cooldownKey,
                now + (command.config.cooldown * 1000)
            );
        }

        logger.cmd(`${event.senderID} used ${commandName}`);
        
        const stats = global.data.stats.get("commands") || {};
        stats[commandName] = (stats[commandName] || 0) + 1;
        global.data.stats.set("commands", stats);
    } catch (error) {
        logger.error(`Command ${commandName} error: ${error}`);
        api.sendMessage("❌ An error occurred", event.threadID);
    }
}

async function handleEvent({ api, event }) {
    const eventHandlers = Array.from(global.client.events.values())
        .filter(e => e.config.type === event.type);

    for (const handler of eventHandlers) {
        try {
            await handler.run({ api, event });
        } catch (error) {
            logger.error(`Event ${handler.config.name} error: ${error}`);
        }
    }
}

function setupAutoRestart() {
    if (!global.config.features.autoRestart.enabled) return;
    
    setInterval(() => {
        logger.system("Performing scheduled restart...");
        process.exit(1);
    }, global.config.features.autoRestart.interval * 3600000);
}

async function startBot() {
    try {
        logger.system("Starting Chatify Bot...");
        
        await Promise.all([
            global.data.threadInfo.init(),
            global.data.userInfo.init(),
            global.data.settings.init(),
            global.data.stats.init()
        ]);

        const appState = JSON.parse(fs.readFileSync("./c3c.json", "utf8"));
        
        login({ appState }, (err, api) => {
            if (err) {
                logger.error(`Login failed: ${err}`);
                return process.exit(1);
            }

            api.setOptions(global.config.options);
            global.api = api;

            loadCommands();
            loadEvents();
            setupAutoRestart();

            logger.success("Bot started successfully!");

            api.listenMqtt(async (err, event) => {
                if (err) return logger.error(`Listen error: ${err}`);
                if (!event || !event.body) return;
                
                if (global.data.maintain && !global.config.admin.includes(event.senderID)) {
                    return;
                }

                const prefix = global.config.prefix;
                if (event.body.startsWith(prefix)) {
                    const [commandName, ...args] = event.body.slice(prefix.length).trim().split(/\s+/);
                    await handleMessage({ api, event, args, commandName: commandName.toLowerCase() });
                }

                await handleEvent({ api, event });
            });
        });

    } catch (error) {
        logger.error(`Startup error: ${error}`);
        process.exit(1);
    }
}

process.on("uncaughtException", error => {
    logger.error(`Uncaught Exception: ${error}`);
});

process.on("unhandledRejection", error => {
    logger.error(`Unhandled Rejection: ${error}`);
});

startBot();
