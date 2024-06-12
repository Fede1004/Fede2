const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const sharp = require('sharp');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/edit-image', upload.fields([{ name: 'image' }, { name: 'mask' }]), async (req, res) => {
    if (!req.files.image || !req.body.prompt) {
        return res.status(400).json({ error: 'Both an image and a prompt are required.' });
    }

    try {
        const imageBuffer = req.files.image[0].buffer;
        const maskBuffer = req.files.mask ? req.files.mask[0].buffer : null;

        const processedImage = await sharp(imageBuffer)
            .resize(1024, 1024)
            .ensureAlpha()
            .png()
            .toBuffer();

        let processedMask = null;
        if (maskBuffer) {
            processedMask = await sharp(maskBuffer)
                .resize(1024, 1024)
                .ensureAlpha()
                .png()
                .toBuffer();
        }

        const formData = new FormData();
        formData.append('image', processedImage, {
            filename: 'image.png',
            contentType: 'image/png',
        });
        if (processedMask) {
            formData.append('mask', processedMask, {
                filename: 'mask.png',
                contentType: 'image/png',
            });
        }
        formData.append('prompt', req.body.prompt);
        formData.append('n', '1');
        formData.append('size', '1024x1024');
        formData.append('response_format', 'url');

        const response = await axios.post('https://api.openai.com/v1/images/edits', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        });

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
            details: error.response ? error.response.data : 'No additional information available',
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
