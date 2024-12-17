const login = require("chatbox-fca-remake");
const fs = require("fs");
const path = require("path");
const { font } = require("./utils/font.js");

global.font = font;

let config;
try {
  config = JSON.parse(fs.readFileSync("config.json", "utf8"));
  global.config = config;
} catch (err) {
  console.error("Failed to load config.json:", err.message);
  process.exit(0);
}

const bot = {
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map(),
};

const cmdsPath = path.join(__dirname, "script", "cmds");
if (fs.existsSync(cmdsPath)) {
  const cmdsFiles = fs.readdirSync(cmdsPath).filter((file) => file.endsWith(".js"));
  for (const file of cmdsFiles) {
    try {
      const command = require(path.join(cmdsPath, file));

      if (command.name) {
        const config = { name: command.name, cooldown: command.cooldown || 5 };
        bot.commands.set(command.name, { ...command, config });
      } else {
        console.warn(`Command file ${file} does not have a valid name.`);
      }
    } catch (error) {
      console.error(`Error loading command ${file}:`, error.message);
    }
  }
} else {
  console.error("Commands path does not exist!");
}

const eventsPath = path.join(__dirname, "script", "events");
if (fs.existsSync(eventsPath)) {
  const eventsFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));
  for (const file of eventsFiles) {
    try {
      const event = require(path.join(eventsPath, file));
      if (event.name) bot.events.set(event.config.name, event);
    } catch (error) {
      console.error(`Error loading event ${file}:`, error.message);
    }
  }
} else {
  console.error("Events path does not exist!");
}

const fbstatePath = "c3c.json";
let fbstate;

if (fs.existsSync(fbstatePath)) {
  try {
    fbstate = JSON.parse(fs.readFileSync(fbstatePath, "utf8"));
  } catch (error) {
    console.error("Failed to parse fbstate.json:", error.message);
    process.exit(1);
  }
} else {
  console.error("No fbstate found! Please provide fbstate.");
  process.exit(1);
}

login({ appState: fbstate }, (err, api) => {
  if (err) {
    console.error("Login failed:", err);
    return;
  }

  console.log("Successfully logged in!");

  const getfbstate = api.getAppState();
  fs.writeFileSync(fbstatePath, JSON.stringify(getfbstate, null, 2));
  console.log("fbstate updated successfully!");

  api.setOptions(global.config.apiOptions);

  api.listenMqtt((err, message) => {
    if (err) {
      console.error("Error on listenMqtt:", err);
      return;
    }

if (!message || !message.body) return;
    
    const args = message.body.split(" ");
    const commandName = args.shift()?.toLowerCase();

    if (bot.commands.has(commandName)) {
      const command = bot.commands.get(commandName);

      if (!bot.cooldowns.has(commandName)) {
        bot.cooldowns.set(commandName, new Map());
      }

      const now = Date.now();
      const timestamps = bot.cooldowns.get(commandName);
      const cooldown_amount = (command.config.cooldown || 5) * 1000;

      if (timestamps.has(message.senderID)) {
        const expiration = timestamps.get(message.senderID) + cooldown_amount;

        if (now < expiration) {
          const timeLeft = (expiration - now) / 1000;
          return api.sendMessage(
            global.font(`Please wait ${timeLeft.toFixed(1)} more second(s) before using this command again.`),
            message.threadID
          );
        }
      }

      timestamps.set(message.senderID, now);
      setTimeout(() => timestamps.delete(message.senderID), cooldown_amount);

      try {
        command.execute(api, message, args);
      } catch (error) {
        console.error(`Error executing command ${commandName}:`, error.message);
        api.sendMessage(
          global.font(`Error executing command ${commandName}: ${error.message}`),
          message.threadID
        );
      }
    }
  });
});
// if something went wrong this will catch error globally ; >
process.on("unhandledRejection", reason => console.log(reason));