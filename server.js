const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/edit-image', upload.fields([{ name: 'image' }, { name: 'mask' }]), async (req, res) => {
    if (!req.files['image'] || !req.body.prompt) {
        return res.status(400).json({ error: 'Both an image and a prompt are required.' });
    }

    try {
        const imageBuffer = req.files['image'][0].buffer;
        const maskBuffer = req.files['mask'][0].buffer;
        const imageBase64 = imageBuffer.toString('base64');
        const maskBase64 = maskBuffer.toString('base64');

        const response = await axios.post('https://api.openai.com/v1/images/edits', {
            image: imageBase64,
            mask: maskBase64,
            prompt: req.body.prompt,
            n: 1,
            size: "1024x1024"
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
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
            details: error.response ? error.response.data : 'No additional information available'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
