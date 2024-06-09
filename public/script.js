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

        fetch('/edit-image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.jobId) {
                checkJobStatus(data.jobId);
            } else {
                throw new Error('Failed to submit image for processing.');
            }
        })
        .catch(error => {
            displayError(`An error occurred: ${error.message}`);
        });
    });

    function checkJobStatus(jobId) {
        fetch(`/job-status/${jobId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'completed') {
                resultImage.innerHTML = `<img src="${data.result.imageUrl}" alt="Edited Image"/>`;
                progressBar.style.width = '100%';
            } else if (data.status === 'failed') {
                throw new Error('Failed to process the image.');
            } else {
                setTimeout(() => checkJobStatus(jobId), 3000); // Ripeti il polling ogni 3 secondi
            }
        })
        .catch(error => {
            displayError(`An error occurred: ${error.message}`);
        });
    }

    function displayError(message) {
        errorDisplay.textContent = message;
    }
});
