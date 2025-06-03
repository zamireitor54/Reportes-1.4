const input = document.getElementById('imageInput');
const grid = document.getElementById('gridContainer');
const generateBtn = document.getElementById('generateBtn');
const loadingText = document.getElementById('loadingText');
const progressFill = document.getElementById('progressFill');
let imageCount = 0;
let imagesData = [];

// Agregar input para número inicial de imagen
let imageStartNumber = 1;

input.addEventListener('change', handleImageUpload);

window.addEventListener('DOMContentLoaded', () => {
    loadSession();
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.onclick = generateWord;

    // Asignar evento al botón Limpiar si existe
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.onclick = function() {
            imagesData = [];
            imageStartNumber = 1; // Reinicia el número inicial
            saveSession();
            renderGrid();
            updateImageCounter();
            generateBtn.disabled = true;
            // Limpiar barra de progreso y texto de carga
            if (progressFill) progressFill.style.width = '0%';
            if (loadingText) loadingText.style.display = 'none';
        };
    }

    // Crear modal de visualización si no existe
    if (!document.getElementById('imageViewModal')) {
        const modal = document.createElement('div');
        modal.id = 'imageViewModal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.8)';
        modal.style.zIndex = '99999';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.innerHTML = `<img id="imageViewImg" style="max-width:90vw;max-height:90vh;border:8px solid #fff;border-radius:12px;box-shadow:0 0 32px #000;">`;
        modal.onclick = () => { modal.style.display = 'none'; };
        document.body.appendChild(modal);
    }
    imageViewModal = document.getElementById('imageViewModal');
    imageViewImg = document.getElementById('imageViewImg');

    // Mostrar modal de info al hacer click en el botón de interrogación
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const closeInfoBtn = document.getElementById('closeInfoBtn');
    if (infoBtn && infoModal) {
        infoBtn.onclick = function() {
            infoModal.style.display = 'flex';
            setTimeout(() => {
                // --- FLECHAS SIEMPRE VISIBLES EN TODAS LAS RESOLUCIONES ---
                const prevBtn = document.getElementById('infoPrevBtn');
                const nextBtn = document.getElementById('infoNextBtn');
                if (prevBtn && nextBtn) {
                    prevBtn.style.display = 'flex';
                    nextBtn.style.display = 'flex';
                }
                // Swipe táctil en móvil (opcional, pero flechas SIEMPRE visibles)
                const slider = document.querySelector('.info-slider');
                let startX = null;
                let moved = false;
                if (slider) {
                    slider.ontouchstart = function(e) {
                        if (e.touches.length === 1) {
                            startX = e.touches[0].clientX;
                            moved = false;
                        }
                    };
                    slider.ontouchmove = function(e) {
                        if (startX !== null && e.touches.length === 1) {
                            const dx = e.touches[0].clientX - startX;
                            if (Math.abs(dx) > 30) moved = true;
                        }
                    };
                    slider.ontouchend = function(e) {
                        if (startX !== null && moved) {
                            const endX = e.changedTouches[0].clientX;
                            const dx = endX - startX;
                            if (dx > 40) {
                                if (typeof goPrev === 'function') goPrev();
                            } else if (dx < -40) {
                                if (typeof goNext === 'function') goNext();
                            }
                        }
                        startX = null;
                        moved = false;
                    };
                }
            }, 100);
        };
    }
    if (closeInfoBtn && infoModal) {
        closeInfoBtn.onclick = function() {
            infoModal.style.display = 'none';
        };
    }

    // Evento para el botón de selección rápida
    const quickBtn = document.getElementById('quickStateBtn');
    if (quickBtn) {
        quickBtn.onclick = function() {
            if (!quickStateMode) enterQuickStateMode();
        };
    }
    updateImageCounter(); // <-- Asegura que el input y el contador se sincronicen tras cargar sesión

    // --- Quitar botones de exportar/importar proyecto ---
    // (No se añaden los botones ni la lógica de export/import)
});

// --- Guardar y cargar sesión con localStorage ---
function isQuotaExceeded(e) {
    let quotaExceeded = false;
    if (e) {
        if (e.code) {
            switch (e.code) {
                case 22:
                    quotaExceeded = true;
                    break;
                case 1014: // Firefox
                    if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') quotaExceeded = true;
                    break;
            }
        } else if (e.number === -2147024882) { // IE8
            quotaExceeded = true;
        }
    }
    return quotaExceeded;
}

function saveSession() {
    try {
        localStorage.setItem('imagesData', JSON.stringify(imagesData));
        localStorage.setItem('imageStartNumber', imageStartNumber);
    } catch (e) {
        if (isQuotaExceeded(e)) {
            throw new Error('quota');
        } else {
            throw e;
        }
    }
}

function loadSession() {
    const data = localStorage.getItem('imagesData');
    if (data) {
        try {
            imagesData = JSON.parse(data);
            imageCount = imagesData.length;
        } catch (e) {
            imagesData = [];
            imageCount = 0;
        }
    }
    const startNum = localStorage.getItem('imageStartNumber');
    if (startNum && !isNaN(parseInt(startNum, 10))) {
        imageStartNumber = parseInt(startNum, 10);
    } else {
        imageStartNumber = 1;
    }
    renderGrid();
    if (imagesData.length > 0) generateBtn.disabled = false;
}

// --- Contador y límite de imágenes ---
// Eliminar MAX_IMAGES y mostrar solo la cantidad de imágenes subidas
function updateImageCounter() {
    let counter = document.getElementById('imageCounter');
    if (!counter) {
        counter = document.createElement('div');
        counter.id = 'imageCounter';
        const gridParent = grid.parentElement;
        if (gridParent) gridParent.insertBefore(counter, grid);
        else document.body.insertBefore(counter, grid);
    }
    let total = imagesData.length;
    // Input bonito para el número inicial
    counter.innerHTML =
      `<span style='margin-right:18px;display:inline-flex;align-items:center;gap:6px;'>
        <b>Num. inicial:</b>
        <input type='number' id='imageStartNumberInput' min='1' value='${imageStartNumber}' style='width:60px;font-size:1.08rem;font-weight:bold;border-radius:8px;border:2px solid #3498db;padding:2px 8px;color:#2c3e50;text-align:center;'/>
      </span>` +
      `<span id="stateCounter" style="margin-right:18px;">
        <span style="font-weight:bold;color:#2c3e50;">Estados seleccionados:</span> <span id="stateCountValue"></span> / ${total}
      </span>` +
      `<span id="descCounter" style="margin-right:18px;">
        <span style="font-weight:bold;color:#2c3e50;">Descripciones llenas:</span> <span id="descCountValue"></span> / ${total}
      </span>` +
      `Imágenes subidas: ${total}`;
    // Evento para el input de número inicial
    const input = counter.querySelector('#imageStartNumberInput');
    if (input) {
        input.value = imageStartNumber; // Siempre sincroniza el valor visual
        input.onchange = function() {
            let val = parseInt(this.value, 10);
            if (isNaN(val) || val < 1) val = 1;
            imageStartNumber = val;
            renderGrid();
            updateImageCounter();
            saveSession();
        };
    }
    let descFilled = imagesData.filter(img => (img.description && img.description.trim().length > 0)).length;
    let stateFilled = imagesData.filter(img => (img.status && img.status !== "")).length;
    let descCountValue = document.getElementById('descCountValue');
    let stateCountValue = document.getElementById('stateCountValue');
    if (descCountValue) descCountValue.textContent = descFilled;
    if (stateCountValue) stateCountValue.textContent = stateFilled;
    // Alternar clase en body para mostrar/ocultar el botón y altura card
    if (typeof document !== 'undefined') {
        if (total > 0) {
            document.body.classList.add('has-images');
        } else {
            document.body.classList.remove('has-images');
        }
    }
}

// --- Integrar límite en handleImageUpload ---
// Eliminar validación de límite de imágenes
const originalHandleImageUpload = handleImageUpload;
handleImageUpload = async function(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    await originalHandleImageUpload.call(this, event);
    saveSession();
    updateImageCounter();
};

async function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    loadingText.style.display = 'block';
    progressFill.style.width = '0%';
    let failedFiles = [];
    let processedCount = 0;
    // NO guardar imágenes en localStorage, solo en memoria
    for (let i = 0; i < files.length; i++) {
        try {
            const imageData = await Promise.race([
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resizeImage(e.target.result, 1024, (resizedDataUrl) => {
                            resolve({
                                src: resizedDataUrl,
                                index: imagesData.length + 1,
                                description: '',
                                status: ''
                            });
                        });
                    };
                    reader.onerror = () => reject(new Error('Error leyendo la imagen.'));
                    reader.readAsDataURL(files[i]);
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: procesamiento de imagen muy lento o corrupto.')), 10000))
            ]);
            imagesData.push(imageData);
            renderGrid();
            processedCount++;
        } catch (err) {
            let reason = err && err.message ? err.message : 'Error desconocido';
            failedFiles.push({ name: files[i].name, reason });
            console.error('Error procesando imagen:', files[i].name, reason);
        }
        progressFill.style.width = `${((i + 1) / files.length) * 100}%`;
        loadingText.textContent = `Procesando imágenes... (${i + 1}/${files.length})`;
        await new Promise(res => setTimeout(res, 30));
    }
    loadingText.style.display = 'none';
    loadingText.textContent = 'Procesando imágenes...'; // Reset
    generateBtn.disabled = imagesData.length === 0;
    updateImageCounter();
    if (failedFiles.length > 0) {
        showFailedImagesAlert(failedFiles);
    }
}

function processImage(file, index) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Redimensionar la imagen antes de guardarla (máx 1024px)
            resizeImage(e.target.result, 1024, (resizedDataUrl) => {
                imageCount++;
                const imageData = {
                    src: resizedDataUrl,
                    index: imagesData.length + 1, // index secuencial
                    description: '',
                    status: ''
                };
                imagesData.push(imageData);
                renderGrid();
                resolve();
            });
        };
        reader.readAsDataURL(file);
    });
}

// Redimensiona la imagen a un máximo de maxSize px (ancho o alto)
function resizeImage(dataUrl, maxSize, callback) {
    const img = new window.Image();
    img.onload = function() {
        let width = img.width;
        let height = img.height;
        if (width > maxSize || height > maxSize) {
            if (width > height) {
                height = Math.round(height * (maxSize / width));
                width = maxSize;
            } else {
                width = Math.round(width * (maxSize / height));
                height = maxSize;
            }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
}

function renderGrid() {
    grid.innerHTML = '';
    imagesData.forEach((imageData, idx) => {
        imageData.index = imageStartNumber + idx;
        createImageBox(imageData, idx);
    });
}

function createImageBox(imageData, idx) {
    const div = document.createElement('div');
    div.className = 'image-box';
    div.setAttribute('draggable', 'true');
    div.setAttribute('data-index', idx);
    div.addEventListener('dragstart', function(e) {
        isInternalDrag = true; // Marcar drag interno
        handleDragStart.call(this, e);
    });
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('dragleave', handleDragLeave);
    div.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over-animated');
        const indicator = this.querySelector('.drop-indicator');
        if (indicator) indicator.style.display = 'none';
        // Si el drop contiene archivos (imágenes) Y NO es drag interno, reemplazar la imagen de esta tarjeta (optimizada)
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isInternalDrag) {
            const file = e.dataTransfer.files[0];
            if (file.type && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    resizeImage(ev.target.result, 1024, (resizedDataUrl) => {
                        imagesData[idx].src = resizedDataUrl;
                        renderGrid();
                        updateImageCounter();
                        saveSession();
                    });
                };
                reader.readAsDataURL(file);
                return; // Importante: no ejecutar reordenamiento si es archivo
            }
        }
        // Si no, es un reordenamiento normal
        handleDrop.call(this, e);
    });
    div.addEventListener('dragend', function(e) {
        isInternalDrag = false; // Fin del drag interno
        handleDragEnd.call(this, e);
    });
    div.innerHTML = `
        <button class="remove-image-btn" title="Eliminar imagen" onclick="removeImage(${idx}, event)">×</button>
        <div class="image-container" style="position:relative;">
            <img src="${imageData.src}" alt="Imagen ${imageData.index}" style="cursor:zoom-in;" onclick="showImageViewModal('${imageData.src}')" />
        </div>
        <div class="image-label-desc-row">
            <div class="image-label">Imagen ${imageData.index}:</div>
            <textarea class="description" placeholder="Descripción de la inspección..." 
                      onchange="updateImageData(${idx}, 'description', this.value)">${imageData.description || ''}</textarea>
        </div>
        <select class="status-select" onchange="updateImageData(${idx}, 'status', this.value); updateSelectStyle(this)">
            <option value="">Seleccionar estado</option>
            <option value="verde" ${imageData.status === 'verde' ? 'selected' : ''}>🟢 Buen estado</option>
            <option value="amarillo" ${imageData.status === 'amarillo' ? 'selected' : ''}>🟡 Observaciones de mejora</option>
            <option value="rojo" ${imageData.status === 'rojo' ? 'selected' : ''}>🔴 No conformidad. Requiere intervención</option>
        </select>
        <div class="drop-indicator"></div>
    `;
    grid.appendChild(div);
}

window.removeImage = function(idx, event) {
    event.stopPropagation();
    imagesData.splice(idx, 1);
    renderGrid();
    if (imagesData.length === 0) {
        generateBtn.disabled = true;
    }
}

let dragSrcIdx = null;
let autoScrollInterval = null;

function handleDragStart(e) {
    dragSrcIdx = Number(this.getAttribute('data-index'));
    this.style.opacity = '0.4';
    // Activar auto-scroll
    document.addEventListener('dragover', handleAutoScroll);
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over-animated');
    // Mostrar indicador visual
    const indicator = this.querySelector('.drop-indicator');
    if (indicator) {
        indicator.style.display = 'block';
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over-animated');
    const indicator = this.querySelector('.drop-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over-animated');
    const indicator = this.querySelector('.drop-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
    const targetIdx = Number(this.getAttribute('data-index'));
    if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
        const moved = imagesData.splice(dragSrcIdx, 1)[0];
        imagesData.splice(targetIdx, 0, moved);
        renderGrid();
    }
}

function handleDragEnd(e) {
    this.style.opacity = '';
    document.querySelectorAll('.image-box').forEach(box => {
        box.style.border = '2px solid #ecf0f1';
        box.classList.remove('drag-over-animated');
        const indicator = box.querySelector('.drop-indicator');
        if (indicator) indicator.style.display = 'none';
    });
    dragSrcIdx = null;
    // Desactivar auto-scroll
    document.removeEventListener('dragover', handleAutoScroll);
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
}

function handleAutoScroll(e) {
    const scrollMargin = 60; // px desde el borde
    const scrollSpeed = 18; // px por frame
    const y = e.clientY;
    const winHeight = window.innerHeight;
    if (y < scrollMargin) {
        // Scroll up
        if (!autoScrollInterval) {
            autoScrollInterval = setInterval(() => {
                window.scrollBy(0, -scrollSpeed);
            }, 16);
        }
    } else if (y > winHeight - scrollMargin) {
        // Scroll down
        if (!autoScrollInterval) {
            autoScrollInterval = setInterval(() => {
                window.scrollBy(0, scrollSpeed);
            }, 16);
        }
    } else {
        // Stop scrolling
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    }
}

// --- Lógica para exportar a Word ---
async function generateWord(forceExport) {
    syncDescriptionsFromDOM();
    // Validar antes de continuar
    if (!forceExport) {
        // Si hay imágenes incompletas, showFancyAlert detiene el flujo
        const valid = validateBeforeExport(() => generateWord(true));
        if (!valid) return; // Detener si hay imágenes incompletas y el usuario no ha elegido continuar
    }

    // Verificar múltiples formas de acceso a la librería
    const docxLib = window.docx || window.Docx || (window.docxjs && window.docxjs.docx);
    
    if (!docxLib) {
        // Intentar cargar la librería de forma alternativa
        try {
            await loadDocxLibrary();
        } catch (error) {
            alert('Error: No se puede cargar la librería docx. Verifica tu conexión a internet y recarga la página.');
            return;
        }
    }

    if (imagesData.length === 0) {
        alert('Por favor, carga al menos una imagen antes de generar el reporte.');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ Generando...';

    try {
        const finalDocx = window.docx || window.Docx || docxLib;
        const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, SectionType } = finalDocx;

        const sections = [];
        const imagesPerPage = 9;
        const totalPages = Math.ceil(imagesData.length / imagesPerPage);

        for (let page = 0; page < totalPages; page++) {
            const children = [];
            // Título principal SIN fondo
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "REPORTE FOTOGRÁFICO DE INSPECCIÓN",
                            bold: true,
                            size: 28,
                            color: "000000",
                            font: "Tahoma"
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                })
            );

            // Texto "Convenciones:" debajo del título, alineado a la izquierda
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Convenciones:",
                            bold: true,
                            size: 20,
                            color: "000000",
                            font: "Tahoma"
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 100 }
                })
            );

            // Tabla horizontal SOLO con las 3 convenciones
            const convencionesTable = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ 
                                                text: "🟢 Buen estado", 
                                                size: 16, 
                                                color: "FFFFFF", 
                                                font: "Tahoma" 
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                shading: { fill: "27AE60" },
                                width: { size: 33.33, type: WidthType.PERCENTAGE },
                                margins: { top: 200, bottom: 200, left: 200, right: 200 }
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ 
                                                text: "🟡 Observaciones de mejora", 
                                                size: 16, 
                                                color: "000000", 
                                                font: "Tahoma" 
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                shading: { fill: "F1C40F" },
                                width: { size: 33.33, type: WidthType.PERCENTAGE },
                                margins: { top: 200, bottom: 200, left: 200, right: 200 }
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ 
                                                text: "🔴 No conformidad. Requiere intervención.", 
                                                size: 16, 
                                                color: "FFFFFF", 
                                                font: "Tahoma" 
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                shading: { fill: "E74C3C" },
                                width: { size: 33.33, type: WidthType.PERCENTAGE },
                                margins: { top: 200, bottom: 200, left: 200, right: 200 }
                            })
                        ]
                    })
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
                }
            });

            children.push(convencionesTable);

            // Espacio entre convenciones y tabla principal
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: "", font: "Tahoma" })],
                    spacing: { after: 400 }
                })
            );

            // Crear la tabla 3x3 (IMAGEN ARRIBA, DESCRIPCIÓN ABAJO)
            const rows = [];
            for (let i = 0; i < 3; i++) {
                const imageRowCells = [];
                const descRowCells = [];
                for (let j = 0; j < 3; j++) {
                    const globalIndex = page * imagesPerPage + (i * 3 + j);
                    if (globalIndex < imagesData.length) {
                        const imageData = imagesData[globalIndex];
                        // --- CELDA DE IMAGEN ---
                        let imageCell;
                        try {
                            const imageBuffer = base64ToArrayBuffer(imageData.src);
                            imageCell = new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: imageBuffer,
                                                transformation: {
                                                    width: 160,
                                                    height: 200
                                                }
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER,
                                        spacing: { after: 100 }
                                    })
                                ],
                                verticalAlign: "center",
                                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                width: { size: 33.33, type: WidthType.PERCENTAGE }
                            });
                        } catch (error) {
                            imageCell = new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: "[Error al cargar imagen]", color: "FF0000", italics: true, font: "Tahoma" })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                width: { size: 33.33, type: WidthType.PERCENTAGE }
                            });
                        }
                        // --- CELDA DE DESCRIPCIÓN ---
                        let bgColor = "FFFFFF";
                        let textColor = "000000";
                        if (imageData.status === 'verde') {
                            bgColor = "27AE60";
                            textColor = "FFFFFF";
                        } else if (imageData.status === 'amarillo') {
                            bgColor = "F1C40F";
                            textColor = "000000";
                        } else if (imageData.status === 'rojo') {
                            bgColor = "E74C3C";
                            textColor = "FFFFFF";
                        }
                        const descriptionText = imageData.description || 
                            (imageData.status === 'verde' ? 'En buen estado' :
                             imageData.status === 'amarillo' ? 'Observaciones de mejora' :
                             imageData.status === 'rojo' ? 'No conformidad. Requiere intervención' :
                             'Sin descripción');
                        const descCell = new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: `Imagen ${imageStartNumber + globalIndex}`,
                                            bold: true,
                                            size: 16,
                                            color: textColor,
                                            font: "Tahoma"
                                        })
                                    ],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 100 },
                                    shading: { fill: bgColor }
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: descriptionText,
                                            size: 16,
                                            color: textColor,
                                            font: "Tahoma"
                                        })
                                    ],
                                    alignment: AlignmentType.CENTER,
                                    shading: { fill: bgColor }
                                })
                            ],
                            verticalAlign: "center",
                            shading: { fill: bgColor },
                            width: { size: 33.33, type: WidthType.PERCENTAGE }
                        });
                        imageRowCells.push(imageCell);
                        descRowCells.push(descCell);
                    } else {
                        // Celdas vacías (imagen y descripción)
                        imageRowCells.push(new TableCell({
                            children: [new Paragraph({ text: "", font: "Tahoma" })],
                            width: { size: 33.33, type: WidthType.PERCENTAGE }
                        }));
                        descRowCells.push(new TableCell({
                            children: [new Paragraph({ text: "", font: "Tahoma" })],
                            width: { size: 33.33, type: WidthType.PERCENTAGE }
                        }));
                    }
                }
                rows.push(new TableRow({ children: imageRowCells }));
                rows.push(new TableRow({ children: descRowCells }));
            }
            // Agregar la tabla al children de la sección
            children.push(
                new Table({
                    rows: rows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
                    }
                })
            );
            // Agregar la sección (página)
            sections.push({
                properties: {
                    page: {
                        margin: {
                            top: 720,
                            right: 720,
                            bottom: 720,
                            left: 720
                        }
                    },
                    type: SectionType.NEXT_PAGE
                },
                children: children
            });
        }
        // Crear el documento con todas las secciones
        const doc = new Document({
            sections: sections
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_fotografico_inspeccion_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccessAlert('¡Reporte generado exitosamente con formato 3x3!');

    } catch (error) {
        console.error('Error al generar el documento:', error);
        alert('Error al generar el documento: ' + error.message);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '📄 Generar Reporte Word';
    }
}

// Alerta moderna de éxito
function showSuccessAlert(message) {
    const old = document.getElementById('successAlertModal');
    if (old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'successAlertModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(39, 174, 96, 0.12)';
    modal.style.zIndex = '100001';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `
      <div style="background:linear-gradient(135deg,#27ae60 60%,#2ecc71 100%);max-width:400px;width:90vw;padding:32px 24px 24px 24px;border-radius:18px;box-shadow:0 8px 32px #0003;display:flex;flex-direction:column;align-items:center;position:relative;animation:fadeInScale 0.4s;">
        <div style="font-size:2.5rem;color:#fff;margin-bottom:10px;">✅</div>
        <div style="font-size:1.18rem;color:#fff;text-align:center;margin-bottom:18px;font-weight:bold;">${message}</div>
        <button id="successAlertBtn" class="generate-btn" style="background:#fff;color:#27ae60;min-width:120px;font-weight:bold;font-size:1rem;box-shadow:0 2px 8px #27ae6033;">Cerrar</button>
      </div>
      <style>@keyframes fadeInScale{0%{opacity:0;transform:scale(0.8);}100%{opacity:1;transform:scale(1);}}</style>
    `;
    document.body.appendChild(modal);
    document.getElementById('successAlertBtn').onclick = () => {
        modal.remove();
    };
}

function showFailedImagesAlert(failedFiles) {
    const old = document.getElementById('failedImagesAlertModal');
    if (old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'failedImagesAlertModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(231, 76, 60, 0.13)';
    modal.style.zIndex = '100002';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `
      <div style="background:linear-gradient(135deg,#e74c3c 60%,#f1c40f 100%);max-width:480px;width:96vw;padding:32px 24px 24px 24px;border-radius:18px;box-shadow:0 8px 32px #0003;display:flex;flex-direction:column;align-items:center;position:relative;animation:fadeInScale 0.4s;">
        <div style="font-size:2.5rem;color:#fff;margin-bottom:10px;">❌</div>
        <div style="font-size:1.18rem;color:#fff;text-align:center;margin-bottom:18px;font-weight:bold;">Algunas imágenes no se pudieron cargar</div>
        <div style="max-height:220px;overflow:auto;width:100%;background:#fff3f3;color:#c0392b;padding:10px 12px;border-radius:10px;font-size:0.98rem;margin-bottom:18px;">
          <ul style="margin:0;padding-left:18px;">
            ${failedFiles.map(f => `<li><b>${f.name}</b><br><span style='font-size:0.97em;color:#b94a48;'>${f.reason}</span></li>`).join('')}
          </ul>
        </div>
        <button id="failedImagesAlertBtn" class="generate-btn" style="background:#fff;color:#e74c3c;min-width:120px;font-weight:bold;font-size:1rem;box-shadow:0 2px 8px #e74c3c33;">Cerrar</button>
      </div>
      <style>@keyframes fadeInScale{0%{opacity:0;transform:scale(0.8);}100%{opacity:1;transform:scale(1);}}</style>
    `;
    document.body.appendChild(modal);
    document.getElementById('failedImagesAlertBtn').onclick = () => {
        modal.remove();
    };
}

// --- Guardar sesión and contador al renderizar y eliminar imágenes ---
const originalRenderGrid = renderGrid;
renderGrid = function() {
    originalRenderGrid.apply(this, arguments);
    updateImageCounter();
    saveSession();
};

const originalRemoveImage = window.removeImage;
window.removeImage = function(idx, event) {
    originalRemoveImage(idx, event);
    updateImageCounter();
    saveSession();
};

// --- BACKEND URL CONFIG ---
// Cambia esto por la URL de tu backend en la nube o local
const BACKEND_URL = 'http://localhost:4000'; // Ejemplo local. Cambia por tu URL de Render/Railway

// --- GUARDAR PROYECTO EN BACKEND ---
async function saveProjectToBackend() {
    // Prepara FormData
    const formData = new FormData();
    const files = [];
    // Solo envía imágenes nuevas (base64) como archivos, el resto como datos
    const imagesDataToSend = imagesData.map((img, idx) => {
        if (img.src && img.src.startsWith('data:')) {
            // Es una imagen nueva (base64)
            const arr = img.src.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            const file = new File([u8arr], `image_${idx}.jpg`, { type: mime });
            files.push(file);
            return { ...img, fileIndex: files.length - 1, src: '' }; // src se reemplazará en backend
        }
        return img;
    });
    files.forEach(f => formData.append('images', f));
    formData.append('data', JSON.stringify({ imagesData: imagesDataToSend, imageStartNumber }));
    const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData
    });
    const result = await res.json();
    if (result.ok) {
        // Actualiza las rutas de las imágenes (src) con las del backend
        imagesData = result.images.map(img => ({ ...img }));
        showSuccessAlert('¡Proyecto guardado en el servidor!');
        renderGrid();
        updateImageCounter();
    } else {
        alert('Error al guardar en el backend: ' + (result.error || 'Error desconocido'));
    }
}

// --- CARGAR PROYECTO DESDE BACKEND ---
async function loadProjectFromBackend() {
    const res = await fetch(`${BACKEND_URL}/api/project`);
    if (!res.ok) {
        alert('No se pudo cargar el proyecto del backend');
        return;
    }
    const data = await res.json();
    if (data && Array.isArray(data.images)) {
        imagesData = data.images.map(img => ({ ...img }));
        imageStartNumber = data.imageStartNumber || 1;
        // Corrige las rutas de las imágenes para que apunten al backend
        imagesData.forEach(img => {
            if (img.src && img.src.startsWith('/uploads/')) {
                img.src = BACKEND_URL + img.src;
            }
        });
        renderGrid();
        updateImageCounter();
        showSuccessAlert('¡Proyecto cargado desde el servidor!');
    }
}

// --- BOTONES DE GUARDAR Y CARGAR EN LA UI ---
window.addEventListener('DOMContentLoaded', () => {
    // Botón guardar en backend
    if (!document.getElementById('saveBackendBtn')) {
        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveBackendBtn';
        saveBtn.className = 'main-btn';
        saveBtn.textContent = '💾 Guardar en servidor';
        saveBtn.style.marginLeft = '12px';
        saveBtn.onclick = saveProjectToBackend;
        const uploadSection = document.querySelector('.upload-section-inner');
        if (uploadSection) uploadSection.appendChild(saveBtn);
    }
    // Botón cargar desde backend
    if (!document.getElementById('loadBackendBtn')) {
        const loadBtn = document.createElement('button');
        loadBtn.id = 'loadBackendBtn';
        loadBtn.className = 'main-btn';
        loadBtn.textContent = '🔄 Cargar del servidor';
        loadBtn.style.marginLeft = '12px';
        loadBtn.onclick = loadProjectFromBackend;
        const uploadSection = document.querySelector('.upload-section-inner');
        if (uploadSection) uploadSection.appendChild(loadBtn);
    }
});

// --- Drag & Drop global para cargar imagen en cualquier parte de la pantalla ---
let globalDropOverlay = null;
let isInternalDrag = false; // Nuevo: para distinguir drag interno

function showGlobalDropOverlay() {
    if (!globalDropOverlay) {
        globalDropOverlay = document.createElement('div');
        globalDropOverlay.id = 'globalDropOverlay';
        globalDropOverlay.style.position = 'fixed';
        globalDropOverlay.style.top = '0';
        globalDropOverlay.style.left = '0';
        globalDropOverlay.style.width = '100vw';
        globalDropOverlay.style.height = '100vh';
        globalDropOverlay.style.background = 'rgba(52, 152, 219, 0.13)';
        globalDropOverlay.style.zIndex = '100000';
        globalDropOverlay.style.display = 'flex';
        globalDropOverlay.style.alignItems = 'center';
        globalDropOverlay.style.justifyContent = 'center';
        globalDropOverlay.style.pointerEvents = 'none';
        globalDropOverlay.innerHTML = `<div style="background:rgba(255,255,255,0.92);padding:38px 48px;border-radius:22px;box-shadow:0 8px 32px #2980b933;font-size:1.5rem;color:#2980b9;font-weight:bold;display:flex;align-items:center;gap:18px;"><span style='font-size:2.2rem;'>📷</span> Suelta aquí para cargar imagen</div>`;
        document.body.appendChild(globalDropOverlay);
    }
    globalDropOverlay.style.display = 'flex';
}
function hideGlobalDropOverlay() {
    if (globalDropOverlay) globalDropOverlay.style.display = 'none';
}

// Eventos globales para drag & drop
let dragCounter = 0;
document.addEventListener('dragenter', function(e) {
    // Solo mostrar overlay si NO es drag interno
    if (e.dataTransfer && e.dataTransfer.types.includes('Files') && !isInternalDrag) {
        dragCounter++;
        showGlobalDropOverlay();
    }
});
document.addEventListener('dragleave', function(e) {
    if (e.dataTransfer && e.dataTransfer.types.includes('Files') && !isInternalDrag) {
        dragCounter--;
        if (dragCounter <= 0) {
            hideGlobalDropOverlay();
            dragCounter = 0;
        }
    }
});
document.addEventListener('dragover', function(e) {
    if (e.dataTransfer && e.dataTransfer.types.includes('Files') && !isInternalDrag) {
        e.preventDefault();
    }
});
document.addEventListener('drop', function(e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isInternalDrag) {
        e.preventDefault();
        hideGlobalDropOverlay();
        dragCounter = 0;
        // Si el drop NO es sobre una tarjeta, agregar la imagen al grid
        const isCard = e.target.closest && e.target.closest('.image-box');
        if (!isCard) {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                // Simular input file
                handleImageUpload({ target: { files } });
            }
        }
    }
});

// --- Selección rápida de estado ---
let quickStateMode = false;
let quickStateValue = '';
let quickStateBar = null;

function createQuickStateBar() {
    if (quickStateBar) quickStateBar.remove();
    quickStateBar = document.createElement('div');
    quickStateBar.id = 'quickStateBar';
    quickStateBar.innerHTML = `
      <div class="quick-state-bar-card">
        <div class="quick-state-bar-title">Selecciona un estado</div>
        <div class="quick-state-bar-btns">
          <button class="quick-state-btn" data-state="verde" title="Buen estado">🟢</button>
          <button class="quick-state-btn" data-state="amarillo" title="Observaciones">🟡</button>
          <button class="quick-state-btn" data-state="rojo" title="No conformidad">🔴</button>
          <button class="quick-state-btn select-all-btn" id="quickStateSelectAllBtn" title="Aplicar a todas" style="margin-left:18px;font-size:1.1rem;padding:8px 18px;background:#eaf6ff;color:#2980b9;border:2px solid #2980b9;">Seleccionar todo</button>
        </div>
        <button id="exitQuickStateBtn" title="Salir del modo rápido" class="quick-state-exit">✕</button>
      </div>
    `;
    quickStateBar.style.pointerEvents = 'none';
    quickStateBar.querySelector('.quick-state-bar-card').style.pointerEvents = 'auto';
    document.body.appendChild(quickStateBar);
    // Eventos
    quickStateBar.querySelectorAll('.quick-state-btn').forEach(btn => {
        if (btn.classList.contains('select-all-btn')) return; // skip select all for this
        btn.onclick = function() {
            quickStateValue = this.getAttribute('data-state');
            quickStateBar.querySelectorAll('.quick-state-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.body.classList.add('quick-state-active');
        };
    });
    document.getElementById('exitQuickStateBtn').onclick = exitQuickStateMode;
    // Nuevo: seleccionar todo
    document.getElementById('quickStateSelectAllBtn').onclick = function() {
        if (!quickStateValue) {
            alert('Primero selecciona un estado (color) para aplicar a todas las imágenes.');
            return;
        }
        imagesData.forEach((img, idx) => {
            img.status = quickStateValue;
        });
        // Actualizar visualmente todos los selects
        document.querySelectorAll('.image-box').forEach(box => {
            const select = box.querySelector('select.status-select');
            if (select) {
                select.value = quickStateValue;
                select.classList.remove('status-verde', 'status-amarillo', 'status-rojo');
                if (quickStateValue === 'verde') select.classList.add('status-verde');
                if (quickStateValue === 'amarillo') select.classList.add('status-amarillo');
                if (quickStateValue === 'rojo') select.classList.add('status-rojo');
            }
            box.classList.add('quick-state-anim');
            setTimeout(() => box.classList.remove('quick-state-anim'), 400);
        });
        updateImageCounter();
        saveSession();
    };
}

function enterQuickStateMode() {
    quickStateMode = true;
    quickStateValue = '';
    createQuickStateBar();
    document.body.classList.add('quick-state-mode');
    // Feedback visual en las tarjetas
    document.querySelectorAll('.image-box').forEach(box => {
        box.classList.add('quick-state-pointer');
        box.addEventListener('click', quickStateCardHandler, { capture: true });
    });
    // ESC para salir
    document.addEventListener('keydown', quickStateEscHandler);
}

function exitQuickStateMode() {
    quickStateMode = false;
    quickStateValue = '';
    if (quickStateBar) quickStateBar.remove();
    document.body.classList.remove('quick-state-mode');
    document.body.classList.remove('quick-state-active');
    document.querySelectorAll('.image-box').forEach(box => {
        box.classList.remove('quick-state-pointer');
        box.classList.remove('quick-state-anim');
        box.removeEventListener('click', quickStateCardHandler, { capture: true });
    });
    document.removeEventListener('keydown', quickStateEscHandler);
}

function quickStateCardHandler(e) {
    if (!quickStateMode || !quickStateValue) return;
    const idx = Number(this.getAttribute('data-index'));
    imagesData[idx].status = quickStateValue;
    // Forzar actualización visual solo de la tarjeta (sin re cargar todo el grid)
    const select = this.querySelector('select.status-select');
    if (select) {
        select.value = quickStateValue;
        // Actualizar estilo visual del select
        select.classList.remove('status-verde', 'status-amarillo', 'status-rojo');
        if (quickStateValue === 'verde') select.classList.add('status-verde');
        if (quickStateValue === 'amarillo') select.classList.add('status-amarillo');
        if (quickStateValue === 'rojo') select.classList.add('status-rojo');
    }
    // Animación feedback
    this.classList.add('quick-state-anim');
    setTimeout(() => this.classList.remove('quick-state-anim'), 400);
    updateImageCounter();
    saveSession();
    e.stopPropagation();
    e.preventDefault();
    // Permitir seguir seleccionando más imágenes (NO salir del modo)
}

function quickStateEscHandler(e) {
    if (e.key === 'Escape') exitQuickStateMode();
}

// --- Estilos visuales para selección rápida ---
const quickStateStyle = document.createElement('style');
quickStateStyle.innerHTML = `
.quick-state-pointer { cursor: pointer !important; box-shadow: 0 0 0 3px #27ae6066 !important; transition: box-shadow 0.2s; }
.quick-state-active .image-box.quick-state-pointer:hover { box-shadow: 0 0 0 5px #27ae60cc, 0 0 24px #27ae6033 !important; }
.quick-state-anim { animation: quickStatePulse 0.4s; }
@keyframes quickStatePulse { 0% { box-shadow: 0 0 0 0 #27ae60cc; } 60% { box-shadow: 0 0 0 12px #27ae6033; } 100% { box-shadow: 0 0 0 0 #27ae60cc; } }
#quickStateBar .quick-state-btn.active { outline: 3px solid #2980b9; filter: brightness(1.08); }
#quickStateBar .quick-state-btn { font-size:1rem; padding:8px 18px; border-radius:8px; border:none; font-weight:bold; cursor:pointer; transition:box-shadow 0.2s,filter 0.2s; box-shadow:0 2px 8px #0001; }
#quickStateBar { animation: fadeInScale 0.3s; }
`;
document.head.appendChild(quickStateStyle);

// --- Mantener imágenes y estados tras recargar la página ---
window.addEventListener('DOMContentLoaded', () => {
    loadSession();
});

// --- Actualización en tiempo real de descripción/estado ---
window.updateImageData = function(idx, field, value) {
    if (!imagesData[idx]) return;
    imagesData[idx][field] = value;
    updateImageCounter();
    saveSession();
};

// --- RESPONSIVE: mostrar/ocultar flechas al cambiar tamaño de pantalla ---
window.addEventListener('resize', function() {
    const prevBtn = document.getElementById('infoPrevBtn');
    const nextBtn = document.getElementById('infoNextBtn');
    if (prevBtn && nextBtn) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
    }
});

// --- FORZAR visibilidad de flechas del modal info SIEMPRE (PC y móvil) ---
function forceInfoArrowsVisible() {
    const prevBtn = document.getElementById('infoPrevBtn');
    const nextBtn = document.getElementById('infoNextBtn');
    if (prevBtn) prevBtn.style.display = 'flex';
    if (nextBtn) nextBtn.style.display = 'flex';
}
// Llamar al abrir el modal info
const infoBtn = document.getElementById('infoBtn');
if (infoBtn) {
    infoBtn.addEventListener('click', forceInfoArrowsVisible);
}
// Llamar también al cargar la página (por si el modal ya está visible)
window.addEventListener('DOMContentLoaded', forceInfoArrowsVisible);
// Llamar al cambiar tamaño de pantalla
window.addEventListener('resize', forceInfoArrowsVisible);

// --- Exportar proyecto (JSON con imágenes, descripciones, estados, número inicial) ---
function exportProject() {
    const data = {
        imagesData,
        imageStartNumber
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_fotografico_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Importar proyecto (restaura todo el estado) ---
function importProject(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.imagesData || !Array.isArray(data.imagesData)) throw new Error('Archivo inválido');
    imagesData = data.imagesData;
    imageStartNumber = data.imageStartNumber || 1;
    renderGrid();
    updateImageCounter();
    showSuccessAlert('¡Proyecto importado exitosamente!');
}

