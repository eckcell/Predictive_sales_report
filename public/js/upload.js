class Uploader {
    constructor(onSuccess, onError) {
        this.onSuccess = onSuccess;
        this.onError = onError;
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.selectBtn = document.getElementById('select-file-btn');
        
        this.init();
    }

    init() {
        this.selectBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
    }

    handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'xlsx' && ext !== 'xls') {
            this.onError('Please upload a valid Excel file (.xlsx or .xls)');
            return;
        }

        this.upload(file);
    }

    async upload(file) {
        const formData = new FormData();
        formData.append('file', file);

        // Show loading screen via app controller
        window.dispatchEvent(new CustomEvent('upload-started'));

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            this.onSuccess(data);
        } catch (err) {
            this.onError(err.message);
        }
    }
}

window.Uploader = Uploader;
