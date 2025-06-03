import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Carpeta para imágenes
const UPLOADS_DIR = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Carpeta y archivo para datos
const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
if (!fs.existsSync(PROJECTS_FILE)) fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ images: [], imageStartNumber: 1 }, null, 2));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// Endpoint: subir imágenes y datos
app.post('/api/upload', upload.array('images'), (req, res) => {
  try {
    const { imageStartNumber, imagesData } = JSON.parse(req.body.data);
    // Guardar imágenes y actualizar rutas
    const files = req.files;
    const updatedImages = imagesData.map((img, idx) => {
      if (img.fileIndex !== undefined && files[img.fileIndex]) {
        return {
          ...img,
          src: `/uploads/${files[img.fileIndex].filename}`
        };
      }
      return img;
    });
    // Guardar en projects.json
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ images: updatedImages, imageStartNumber }, null, 2));
    res.json({ ok: true, message: 'Proyecto guardado', images: updatedImages });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint: obtener datos e imágenes
app.get('/api/project', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Servir imágenes estáticas
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check
app.get('/', (req, res) => res.send('Backend de reportes fotográficos funcionando.'));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
