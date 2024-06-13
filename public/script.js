document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const imageInput = document.getElementById('imageInput');
    const maskInput = document.getElementById('maskInput');
    const promptInput = document.getElementById('aiPrompt');
    const resultImage = document.getElementById('resultImage');
    const errorDisplay = document.getElementById('errorDisplay');
    const imageCanvas = document.getElementById('imageCanvas');
    const ctx = imageCanvas.getContext('2d');

    const brushSizes = {
        small: 5,
        medium: 10,
        large: 20
    };
    let currentBrushSize = brushSizes.medium;
    let drawing = false;
    let erasing = false;

    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const image = new Image();
                image.src = e.target.result;
                image.onload = function() {
                    imageCanvas.width = 1024;
                    imageCanvas.height = 1024;
                    ctx.drawImage(image, 0, 0, 1024, 1024);
                }
            }
            reader.readAsDataURL(file);
        }
    });

    imageCanvas.addEventListener('mousedown', function(e) {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });

    imageCanvas.addEventListener('mousemove', function(e) {
        if (drawing) {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.strokeStyle = erasing ? 'white' : 'black';
            ctx.lineWidth = currentBrushSize;
            ctx.stroke();
        }
    });

    imageCanvas.addEventListener('mouseup', function() {
        drawing = false;
    });

    document.getElementById('brushSizeSmall').addEventListener('click', function() {
        currentBrushSize = brushSizes.small;
    });

    document.getElementById('brushSizeMedium').addEventListener('click', function() {
        currentBrushSize = brushSizes.medium;
    });

    document.getElementById('brushSizeLarge').addEventListener('click', function() {
        currentBrushSize = brushSizes.large;
    });

    document.getElementById('erase').addEventListener('click', function() {
        erasing = !erasing;
    });

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
        } else {
            imageCanvas.toBlob(function(blob) {
                formData.append('mask', blob, 'mask.png');
                sendRequest(formData);
            });
        }
    });

    function sendRequest(formData) {
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
    }

    function displayError(message) {
        errorDisplay.textContent = message;
    }
});
