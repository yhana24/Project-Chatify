module.exports = {
    config: {
        name: "help",
        aliases: ["commands", "menu"],
        description: "Shows list of available commands",
        usage: "[command name]",
        cooldown: 5
    },
    run: async function({ api, event, args }) {
        const { threadID, messageID } = event;
        const commands = global.client.commands;
        const prefix = global.config.Prefix;


        if (args[0]) {
            const command = commands.get(args[0].toLowerCase()) || 
                          commands.find(cmd => cmd.config.aliases && cmd.config.aliases.includes(args[0].toLowerCase()));

            if (!command) {
                return api.sendMessage(`❌ Command "${args[0]}" not found.`, threadID, messageID);
            }

            let reply = `📌 Command Details:\n\n`;
            reply += `Name: ${command.config.name}\n`;
            reply += `Description: ${command.config.description || "No description provided"}\n`;
            reply += `Usage: ${prefix}${command.config.name} ${command.config.usage || ""}\n`;
            reply += `Cooldown: ${command.config.cooldown || 0} seconds\n`;
            
            if (command.config.aliases) {
                reply += `Aliases: ${command.config.aliases.join(", ")}\n`;
            }

            return api.sendMessage(reply, threadID, messageID);
        }

        let helpMessage = "📜 Available Commands:\n\n";
        
        const categories = new Map();

        commands.forEach(cmd => {
            const category = cmd.config.category || "Uncategorized";
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category).push(cmd.config.name);
        });

        for (const [category, cmds] of categories) {
            helpMessage += `『 ${category} 』\n`;
            helpMessage += `➤ ${cmds.join(", ")}\n\n`;
        }

        helpMessage += `\n💡 Type "${prefix}help <command>" for detailed information about a specific command.`;
        
        return api.sendMessage(helpMessage, threadID, messageID);
    }
};
