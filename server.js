const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const Queue = require('bull');
const Redis = require('ioredis');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

if (!process.env.REDISCLOUD_URL) {
  console.error('REDIS URL not set. Check your configuration.');
  process.exit(1);
}

const redis = new Redis(process.env.REDISCLOUD_URL, {
  tls: {
    rejectUnauthorized: false
  }
});

redis.on('error', (error) => {
  console.error('Redis Error', error);
});

const editQueue = new Queue('image-editing', {
  redis: {
    port: new URL(process.env.REDISCLOUD_URL).port,
    host: new URL(process.env.REDISCLOUD_URL).hostname,
    password: new URL(process.env.REDISCLOUD_URL).password,
    tls: { rejectUnauthorized: false }
  }
});

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
            return imageUrl;  // This will be available on job.finished()
        } else {
            throw new Error('API did not return the expected data');
        }
    } catch (error) {
        throw new Error(`Failed to process the image: ${error.message}`);
    }
});

app.get('/job-status/:jobId', async (req, res) => {
    const job = await editQueue.getJob(req.params.jobId);
    if (!job) {
        return res.status(404).send('Job not found');
    }

    const state = await job.getState();
    const progress = job._progress;
    const result = await job.finished();
    res.json({ id: job.id, state, progress, result });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
