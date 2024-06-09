const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const Queue = require('bull');
dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

// Configura la coda di Bull utilizzando l'URL di Redis fornito da Heroku
const redisConfig = {
    redis: {
        port: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).port : 6379,
        host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'localhost',
        password: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).password : undefined,
        tls: process.env.REDIS_URL ? { rejectUnauthorized: false } : undefined // Utilizza TLS se connetti a Redis su Heroku
    }
};
const editQueue = new Queue('image-editing', redisConfig);

app.use(express.json());  // Middleware per parsare JSON
app.use(express.static('public'));  // Serve file statici dalla cartella public

app.post('/edit-image', upload.single('image'), async (req, res) => {
    if (!req.file || !req.body.prompt) {
        return res.status(400).json({ error: 'Both an image and a prompt description are required.' });
    }

    const job = await editQueue.add({
        image: req.file.buffer,
        prompt: req.body.prompt
    });

    res.json({ jobId: job.id, message: "Your request is being processed, please wait." });
});

// Processore della coda che gestisce l'elaborazione delle richieste
editQueue.process(async (job) => {
    try {
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            prompt: job.data.prompt,
            n: 1,
            size: "1024x1024"
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const imageUrl = response.data.choices[0].data.image_url;
            return { imageUrl: imageUrl };
        } else {
            throw new Error('API did not return the expected data');
        }
    } catch (error) {
        throw new Error(`Failed to process the image: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Gestione della chiusura dell'applicazione
process.on('SIGINT', async () => {
    await editQueue.close();
    console.log('Queue shut down');
    process.exit(0);
});
