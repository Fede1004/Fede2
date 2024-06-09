const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.post('/edit-image', upload.single('image'), async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("API key is not set. Check your environment variables.");
        return res.status(500).send('Server configuration error: API key is missing.');
    }

    if (!req.file || !req.body.prompt) {
        return res.status(400).send('Both an image and a prompt description are required.');
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
            res.status(500).send('OpenAI API returned an unexpected response.');
        }
    } catch (error) {
        console.error('Failed to call OpenAI API:', error.response ? error.response.data : error.message);
        res.status(500).send('Failed to edit image due to an API error.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
