document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const imageInput = document.getElementById('imageInput');
    const promptInput = document.getElementById('aiPrompt');
    const resultImage = document.getElementById('resultImage');
    const errorDisplay = document.getElementById('errorDisplay');
    const loader = document.getElementById('loader');

    submitButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (!imageInput.files.length) {
            displayError('Please select an image to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        formData.append('prompt', promptInput.value);

        loader.style.display = 'block'; // Mostra l'indicatore di caricamento

        fetch('/edit-image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loader.style.display = 'none'; // Nascondi l'indicatore di caricamento
            if (data.imageUrl) {
                resultImage.innerHTML = `<img src="${data.imageUrl}" alt="Edited Image" style="width:100%;">`; // Mostra l'immagine a schermo intero
            } else {
                throw new Error(data.error || 'Failed to submit image for processing.');
            }
        })
        .catch(error => {
            loader.style.display = 'none'; // Nascondi l'indicatore di caricamento
            displayError(`An error occurred: ${error.message}`);
        });
    });

    function displayError(message) {
        errorDisplay.textContent = message;
    }
});
