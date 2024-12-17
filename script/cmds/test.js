module.exports = {
  config: {
    name: "test",
    cooldown: 5 
  },
  execute(api, message) {
    api.sendMessage(`Hello, ${message.senderID}!`, message.threadID);
  }
};
