document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit');
    const imageInput = document.getElementById('imageInput');
    const promptInput = document.getElementById('aiPrompt');
    const resultImage = document.getElementById('resultImage');
    const errorDisplay = document.getElementById('errorDisplay');
    const loader = document.getElementById('loader');
    const canvas = new fabric.Canvas('canvas');

    let uploadedImage = null;

    imageInput.addEventListener('change', function(event) {
        const reader = new FileReader();
        reader.onload = function(e) {
            fabric.Image.fromURL(e.target.result, function(img) {
                uploadedImage = img;
                canvas.clear();
                img.scaleToWidth(800);
                canvas.setWidth(img.getScaledWidth());
                canvas.setHeight(img.getScaledHeight());
                canvas.add(img);
                canvas.renderAll();
            });
        }
        reader.readAsDataURL(event.target.files[0]);
    });

    submitButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (!uploadedImage) {
            displayError('Please select an image to upload.');
            return;
        }

        const prompt = promptInput.value;
        if (!prompt) {
            displayError('Please enter a prompt.');
            return;
        }

        loader.style.display = 'block';

        // Create mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskContext = maskCanvas.getContext('2d');

        const mask = new fabric.Rect({
            left: 0,
            top: 0,
            width: canvas.width,
            height: canvas.height,
            fill: 'transparent'
        });

        canvas.add(mask);
        canvas.renderAll();
        maskContext.fillStyle = 'black';
        canvas.forEachObject(function(obj) {
            if (obj !== uploadedImage && obj !== mask) {
                const objectMask = new fabric.Rect({
                    left: obj.left,
                    top: obj.top,
                    width: obj.width * obj.scaleX,
                    height: obj.height * obj.scaleY,
                    fill: 'black'
                });
                objectMask.render(maskContext);
            }
        });

        maskContext.globalCompositeOperation = 'destination-in';
        maskContext.drawImage(uploadedImage.getElement(), 0, 0);

        // Convert mask to data URL
        const maskDataUrl = maskCanvas.toDataURL('image/png');

        canvas.remove(mask);
        canvas.renderAll();

        // Convert canvas to data URL
        const imageDataUrl = canvas.toDataURL('image/png');

        // Convert data URLs to blobs
        fetch(imageDataUrl)
            .then(res => res.blob())
            .then(imageBlob => {
                fetch(maskDataUrl)
                    .then(res => res.blob())
                    .then(maskBlob => {
                        const formData = new FormData();
                        formData.append('image', imageBlob, 'image.png');
                        formData.append('mask', maskBlob, 'mask.png');
                        formData.append('prompt', prompt);

                        fetch('/edit-image', {
                            method: 'POST',
                            body: formData
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error, status = ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            loader.style.display = 'none';
                            if (data.imageUrl) {
                                resultImage.innerHTML = `<img src="${data.imageUrl}" alt="Edited Image" style="width:100%;">`;
                            } else {
                                throw new Error(data.error || 'Failed to submit image for processing.');
                            }
                        })
                        .catch(error => {
                            loader.style.display = 'none';
                            displayError(`An error occurred: ${error.message}`);
                        });
                    });
            });
    });

    function displayError(message) {
        errorDisplay.textContent = message;
    }
});
