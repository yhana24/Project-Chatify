module.exports = {
  name: 'ping',  
  cooldown: 5,   
  execute: (api, message, args) => {
    api.sendMessage('Pong!', message.threadID);
  },
};
