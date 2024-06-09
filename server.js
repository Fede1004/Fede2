const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.post('/edit-image', upload.single('image'), async (req, res) => {
    if (!req.file || !req.body.prompt) {
        return res.status(400).send('Both an image and a prompt description are required.');
    }

    // Prepare the headers and body for the OpenAI API request
    const headers = {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
    };
    const body = {
        prompt: req.body.prompt,
        n: 1,
        size: "1024x1024"
    };

    try {
        // Sending the image editing request to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/images/generations', body, { headers: headers });
        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].data) {
            const imageUrl = response.data.choices[0].data.image_url;
            res.json({ imageUrl: imageUrl });
        } else {
            // Handling cases where the API response does not contain image data
            console.error('Invalid response from OpenAI API:', response.data);
            res.status(500).send('OpenAI API returned an unexpected response.');
        }
    } catch (error) {
        // Detailed error logging for troubleshooting
        console.error('Failed to call OpenAI API:', error.response ? error.response.data : error.message);
        res.status(500).send('Failed to edit image due to an API error.');
    }
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
