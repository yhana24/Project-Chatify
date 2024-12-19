const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
    getStreamFromURL: async (url) => {
        const response = await axios.get(url, { responseType: 'stream' });
        return response.data;
    },

    downloadFile: async (url, filepath) => {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    },

    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    randomNumber: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    
    shuffleArray: (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};
