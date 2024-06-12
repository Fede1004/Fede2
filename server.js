const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const sharp = require('sharp');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Endpoint per l'elaborazione delle immagini
app.post('/edit-image', upload.single('image'), async (req, res) => {
    if (!req.file || !req.body.prompt) {
        return res.status(400).json({ error: 'Both an image and a prompt are required.' });
    }

    try {
        // Process the image with sharp
        const processedImage = await sharp(req.file.buffer)
            .resize(1024, 1024)
            .ensureAlpha() // Ensures RGBA
            .png()
            .toBuffer();

        const imageData = processedImage.toString('base64');
        const payload = {
            prompt: req.body.prompt,
            n: 1,
            size: "1024x1024",
            model: "dall-e-2",
            image: imageData,
            response_format: "url"
        };

        const response = await axios.post('https://api.openai.com/v1/images/edits', payload, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Check if the response contains the image
        if (response.data && response.data.data && response.data.data.length > 0) {
            const imageUrl = response.data.data[0].url;
            res.json({ imageUrl });
        } else {
            throw new Error('No image returned from the API');
        }
    } catch (error) {
        console.error('Failed to process the image:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'Failed to submit image for processing.',
            details: error.response ? error.response.data : 'No additional information available'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
