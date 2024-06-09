const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const Queue = require('bull');
const cors = require('cors');
dotenv.config();

const app = express();
app.use(cors());  // Abilita CORS per tutte le origini
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

const redisConfig = {
    redis: {
        port: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).port : 6379,
        host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'localhost',
        password: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).password : undefined,
        tls: process.env.REDIS_URL ? { rejectUnauthorized: false } : undefined
    }
};
const editQueue = new Queue('image-editing', redisConfig);

app.use(express.json());
app.use(express.static('public'));

app.post('/edit-image', upload.single('image'), async (req, res) => {
    if (!req.file || !req.body.prompt) {
        return res.status(400).json({ error: 'Both an image and a prompt description are required.' });
    }

    try {
        const job = await editQueue.add({
            image: req.file.buffer,
            prompt: req.body.prompt
        });
        res.json({ jobId: job.id, message: "Your request is being processed, please wait." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Fallback per altre richieste non gestite
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
