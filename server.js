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
    if (!req.file || !req.body.prompt) {
        return res.status(400).send('Image and prompt are required.');
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            prompt: req.body.prompt,
            n: 1,
            size: "1024x1024"
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ imageUrl: response.data.choices[0].data.image_url });
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        res.status(500).send('Failed to process image');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
