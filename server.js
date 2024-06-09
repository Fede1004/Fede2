const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

// Configura il limitatore di richieste per prevenire il superamento dei limiti dell'API
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minuto
    max: 3,  // Max requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});

app.use(express.static('public'));
app.use("/edit-image", apiLimiter);  // Applica il limite solo al percorso di invio dell'immagine

app.post('/edit-image', upload.single('image'), async (req, res) => {
    if (!req.file || !req.body.prompt) {
        return res.status(400).json({ error: 'Both an image and a prompt description are required.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("API key is not set. Check your environment variables.");
        return res.status(500).json({ error: 'API key is missing.' });
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

        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].data) {
            const imageUrl = response.data.choices[0].data.image_url;
            res.json({ imageUrl: imageUrl });
        } else {
            res.status(500).json({ error: 'OpenAI API returned an unexpected response.', details: response.data });
        }
    } catch (error) {
        console.error('Failed to call OpenAI API:', error);
        res.status(500).json({ error: 'Failed to process the image.', details: error.response ? error.response.data : error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
