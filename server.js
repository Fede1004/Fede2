const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Limite di richieste per evitare il superamento dei limiti dell'API
app.use('/edit-image', (req, res, next) => {
    // Implementa una logica di controllo rate limit qui se necessario
    next();
});

app.post('/edit-image', upload.single('image'), async (req, res) => {
    if (!req.file || !req.body.prompt) {
        return res.status(400).json({ error: 'Both an image and a prompt description are required.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing. Check your environment variables.' });
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            prompt: req.body.prompt,
            n: 1,
            size: "1024x1024"
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const imageUrl = response.data.choices[0].data.image_url;
            res.json({ imageUrl: imageUrl });
        } else {
            res.status(500).json({ error: 'Unexpected response from the API.', details: response.data });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to process the image.', details: error.response ? error.response.data : error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
