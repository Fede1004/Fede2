const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.post('/edit-image', upload.single('image'), async (req, res) => {
    if (!req.file || !req.body.prompt) {
        return res.status(400).json({ error: 'Both an image and a prompt are required.' });
    }

    // Simula un processo asincrono di elaborazione dell'immagine
    setTimeout(() => {
        res.json({ message: "Image processed successfully!" });
    }, 3000); // Simuliamo un ritardo di 3 secondi
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
