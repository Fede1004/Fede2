document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const imageInput = document.getElementById('imageInput');
    const promptInput = document.getElementById('aiPrompt');
    const resultImage = document.getElementById('resultImage');

    submitButton.addEventListener('click', function() {
        const file = imageInput.files[0];
        if (!file) {
            alert('Please select an image to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('prompt', promptInput.value);

        resultImage.innerHTML = 'Processing...';

        fetch('/edit-image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.imageUrl) {
                resultImage.innerHTML = `<img src="${data.imageUrl}" alt="Edited Image"/>`;
            } else {
                resultImage.innerHTML = 'Failed to load the edited image.';
                console.error('Server returned without an image URL.');
            }
        })
        .catch(error => {
            resultImage.innerHTML = 'An error occurred while fetching the edited image.';
            console.error('Error fetching the edited image:', error);
        });
    });
});
