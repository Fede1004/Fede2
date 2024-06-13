document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const imageInput = document.getElementById('imageInput');
    const maskInput = document.getElementById('maskInput');
    const promptInput = document.getElementById('aiPrompt');
    const resultImage = document.getElementById('resultImage');
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
        if (maskInput.files.length) {
            formData.append('mask', maskInput.files[0]);
        }

        fetch('/edit-image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.imageUrl) {
                resultImage.innerHTML = `<img src="${data.imageUrl}" alt="Edited Image" style="width:100%;">`;
            } else {
                throw new Error(data.error || 'Failed to submit image for processing.');
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
