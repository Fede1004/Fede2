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

// Configurazione avanzata di Redis per gestire correttamente TLS/SSL
const redis = new Redis(process.env.REDISCLOUD_URL, {
  tls: {
    rejectUnauthorized: false, // Non raccomandato per produzione senza ulteriori considerazioni di sicurezza
    minVersion: 'TLSv1.2' // Assicurati che sia compatibile con il tuo provider Redis
  }
});

redis.on('connect', () => console.log('Connected to Redis successfully!'));
redis.on('error', (error) => console.error('Redis Error', error));

const editQueue = new Queue('image-editing', {
  createClient: function (type) {
    return new Redis(process.env.REDISCLOUD_URL, {
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });
  }
});

app.post('/edit-image', upload.single('image'), async (req, res) => {
    if (!req.file || !req.body.prompt) {
        return res.status(400).json({ error: 'Both an image and a prompt are required.' });
    }

    const job = await editQueue.add({
        image: req.file.buffer,
        prompt: req.body.prompt
    });

    res.json({ jobId: job.id, message: "Your request is being processed, please wait." });
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
