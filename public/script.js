document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const imageInput = document.getElementById('imageInput');
    const promptInput = document.getElementById('aiPrompt');
    const resultImage = document.getElementById('resultImage');
    const progressBar = document.getElementById('progressBar');
    const errorDisplay = document.getElementById('errorDisplay');

    submitButton.addEventListener('click', function(event) {
        event.preventDefault(); // Previene il comportamento di invio normale del form
        if (!imageInput.files.length) {
            displayError('Please select an image to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        formData.append('prompt', promptInput.value);

        progressBar.style.width = '0%'; // Resetta la barra di progresso
        errorDisplay.textContent = ''; // Pulisce eventuali messaggi di errore precedenti
        resultImage.innerHTML = ''; // Pulisce l'immagine precedente

        fetch('/edit-image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(obj => {
            if (obj.status === 200) {
                updateImage(obj.body);
            } else {
                throw new Error(obj.body.message || 'Failed to edit the image.');
            }
        })
        .catch(error => {
            displayError(`An error occurred: ${error.message}`);
        });

        simulateProgress();
    });

    function updateImage(data) {
        if (data.imageUrl) {
            resultImage.innerHTML = `<img src="${data.imageUrl}" alt="Edited Image"/>`;
            progressBar.style.width = '100%'; // Completa la barra di progresso
        } else {
            throw new Error('No image URL returned from the server.');
        }
    }

    function displayError(message) {
        errorDisplay.textContent = message; // Mostra il messaggio di errore all'utente
    }

    function simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            if (progress >= 100) {
                clearInterval(interval);
            } else {
                progress += 10;
                progressBar.style.width = `${progress}%`;
            }
        }, 100);
    }
});
