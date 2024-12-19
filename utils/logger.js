const chalk = require('chalk');

module.exports = {
    error: (...args) => console.log(chalk.red('[ERROR]'), ...args),
    warn: (...args) => console.log(chalk.yellow('[WARN]'), ...args),
    info: (...args) => console.log(chalk.blue('[INFO]'), ...args),
    success: (...args) => console.log(chalk.green('[SUCCESS]'), ...args),
    system: (...args) => console.log(chalk.magenta('[SYSTEM]'), ...args),
    cmd: (...args) => console.log(chalk.cyan('[COMMAND]'), ...args)
};
