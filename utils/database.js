const fs = require('fs-extra');
const path = require('path');

class Database {
    constructor(filename) {
        this.path = path.join(__dirname, '../data', filename);
        this.data = {};
    }

    async init() {
        try {
            await fs.ensureFile(this.path);
            const content = await fs.readFile(this.path, 'utf8');
            this.data = content ? JSON.parse(content) : {};
        } catch (error) {
            this.data = {};
        }
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        this.save();
    }

    async save() {
        try {
            await fs.writeFile(this.path, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving database:', error);
        }
    }

    delete(key) {
        delete this.data[key];
        this.save();
    }

    clear() {
        this.data = {};
        this.save();
    }
}

module.exports = Database;
