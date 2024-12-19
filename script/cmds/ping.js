module.exports = {
    config: {
        name: "ping",
        description: "Check bot response time",
        usage: "ping",
        cooldown: 5,
        permissions: ["user"],
        category: "system"
    },
    run: async function({ api, event }) {
        const start = Date.now();
        await api.sendMessage("Pinging...", event.threadID);
        return api.sendMessage(`Ping:${Date.now() - start}ms`, event.threadID);
    }
};
