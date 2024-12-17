module.exports = {
  config: {
    name: "test",
    description: "Command description", 
    cooldown: 5,
  },
  execute: (api, message, args) => {
    const response = `You used the command "${args.join(" ")}"`;
    api.sendMessage(response, message.threadID);
  },
};
