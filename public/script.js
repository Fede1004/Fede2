document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const imageInput = document.getElementById('imageInput');
    const promptInput = document.getElementById('aiPrompt');
    const resultImage = document.getElementById('resultImage');
    const progressBar = document.getElementById('progressBar');

    submitButton.addEventListener('click', function() {
        const file = imageInput.files[0];
        if (!file) {
            alert('Please select an image to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('prompt', promptInput.value);

        resultImage.innerHTML = '';
        progressBar.style.width = '0%'; // Reset progress bar

        fetch('/edit-image', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.imageUrl) {
                updateProgressBar(100);
                resultImage.innerHTML = `<img src="${data.imageUrl}" alt="Edited Image"/>`;
            } else {
                progressBar.style.backgroundColor = 'red';
                console.error('Server returned without an image URL.');
            }
        })
        .catch(error => {
            resultImage.innerHTML = 'An error occurred while fetching the edited image.';
            console.error('Error fetching the edited image:', error);
            progressBar.style.backgroundColor = 'red';
        });

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            if (progress >= 100) {
                clearInterval(interval);
            } else {
                progress += 10; // Incremental increase
                updateProgressBar(progress);
            }
        }, 200); // Updates every 200 milliseconds
    });

    function updateProgressBar(percent) {
        progressBar.style.width = percent + '%';
    }
});
