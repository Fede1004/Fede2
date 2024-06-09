document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const imageInput = document.getElementById('imageInput');
    const promptInput = document.getElementById('aiPrompt');
    const resultImage = document.getElementById('resultImage');
    const progressBar = document.getElementById('progressBar');
    const errorDisplay = document.getElementById('errorDisplay');

    submitButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (!imageInput.files.length) {
            displayError('Please select an image to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        formData.append('prompt', promptInput.value);

        progressBar.style.width = '0%';
        errorDisplay.textContent = '';
        resultImage.innerHTML = '';

        fetch('/edit-image', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Rate limit exceeded, please try again later.');
            }
            return response.json();
        })
        .then(data => {
            if (data.imageUrl) {
                resultImage.innerHTML = `<img src="${data.imageUrl}" alt="Edited Image"/>`;
                progressBar.style.width = '100%';
            } else {
                throw new Error('Failed to process the image.');
            }
        })
        .catch(error => {
            displayError(`An error occurred: ${error.message}`);
        });
    });

    function displayError(message) {
        errorDisplay.textContent = message;
    }
});
