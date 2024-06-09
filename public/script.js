function submitImage() {
    const imageInput = document.getElementById('imageInput');
    const promptText = document.getElementById('aiPrompt').value;
    const resultImage = document.getElementById('resultImage');

    if (imageInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        formData.append('prompt', promptText);

        fetch('/edit-image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if(data.imageUrl) {
                resultImage.innerHTML = `<img src="${data.imageUrl}" alt="Edited Image"/>`;
            }
        })
        .catch(error => console.error('Error:', error));
    } else {
        alert('Please select an image to upload.');
    }
}
