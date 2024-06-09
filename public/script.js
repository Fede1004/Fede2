document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const imageInput = document.getElementById('imageInput');
    const promptInput = document.getElementById('aiPrompt');
    const resultImage = document.getElementById('resultImage');
    const progressBar = document.getElementById('progressBar');
    const errorDisplay = document.getElementById('errorDisplay');

    function fetchWithRetry(url, options, retries = 5, backoff = 300) {
        return fetch(url, options).then(res => {
            if (res.ok) return res.json();  // Assumiamo che la risposta sia sempre JSON
            if (retries > 0) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(fetchWithRetry(url, options, retries - 1, backoff * 2));
                    }, backoff);
                });
            } else {
                throw new Error('Rate limit exceeded, please try again later.');
            }
        });
    }

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

        fetchWithRetry('/edit-image', {
            method: 'POST',
            body: formData
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

        simulateProgress();
    });

    function displayError(message) {
        errorDisplay.textContent = message;
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
