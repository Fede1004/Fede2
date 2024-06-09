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
        .then(response => response.json())
        .then(data => {
            if (data.imageUrl) {
                resultImage.innerHTML = `<img src="${data.imageUrl}" alt="Edited Image"/>`;
                progressBar.style.width = '100%';
            } else {
                throw new Error('No image URL returned from the server.');
            }
        })
        .catch(error => {
            displayError(`An error occurred: ${error.message}`);
        });

        simulateProgress();
    });

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

    function displayError(message) {
        errorDisplay.textContent = message;
    }
});
