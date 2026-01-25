document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reportForm');
    const fileUpload = document.getElementById('fileUpload');
    const fileInput = document.getElementById('itemPhoto');
    const imagePreview = document.getElementById('imagePreview');
    const alertContainer = document.getElementById('alertContainer');
    const dateInput = document.getElementById('dateFound');

    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;

    fileUpload.addEventListener('click', () => fileInput.click());

    fileUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUpload.style.borderColor = '#473472';
        fileUpload.style.background = 'rgba(71, 52, 114, 0.05)';
    });

    fileUpload.addEventListener('dragleave', () => {
        fileUpload.style.borderColor = 'rgba(135, 186, 195, 0.5)';
        fileUpload.style.background = 'transparent';
    });

    fileUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUpload.style.borderColor = 'rgba(135, 186, 195, 0.5)';
        fileUpload.style.background = 'transparent';

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function handleFileSelect(file) {
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image size must be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    function showAlert(message, type) {
        alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        try {
            let imageUrl = null;
            if (fileInput.files.length > 0) {
                imageUrl = await uploadImage(fileInput.files[0]);
            }

            const itemData = {
                name: document.getElementById('itemName').value,
                category: document.getElementById('category').value,
                location: document.getElementById('location').value,
                date_found: document.getElementById('dateFound').value,
                description: document.getElementById('description').value,
                image_url: imageUrl,
                finder_name: document.getElementById('finderName').value,
                finder_email: document.getElementById('finderEmail').value,
                status: 'pending'
            };

            await addItem(itemData);

            showAlert('Item reported successfully! It will be reviewed by an admin.', 'success');
            form.reset();
            imagePreview.style.display = 'none';
            dateInput.value = today;

        } catch (error) {
            console.error('Error submitting report:', error);
            showAlert('Error submitting report. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});
