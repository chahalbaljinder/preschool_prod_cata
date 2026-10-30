const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'assets/products.json');
const IMG_DIR = path.join(__dirname, 'assets/products');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: IMG_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function readProducts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
}

app.get('/', (_req, res) => res.redirect('/admin.html'));

app.get('/api/products', (_req, res) => {
  try { res.json(readProducts()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:code', (req, res) => {
  const products = readProducts();
  const p = products.find(x => x.code === req.params.code);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json(p);
});

app.post('/api/products', upload.single('image'), (req, res) => {
  const products = readProducts();
  const { cat, name, code, size, price, notes } = req.body;
  if (!cat || !name || !code) return res.status(400).json({ error: 'cat, name, code required' });
  if (products.find(x => x.code === code)) return res.status(409).json({ error: 'code already exists' });
  const product = {
    cat, name, code,
    size: size || '',
    price: price ? Number(price) : 0,
    img: req.file ? `assets/products/${req.file.filename}` : 'assets/products/pg0777.png',
    notes: notes ? notes.split(',').map(s => s.trim()).filter(Boolean) : []
  };
  products.push(product);
  writeProducts(products);
  res.status(201).json(product);
});

app.put('/api/products/:code', upload.single('image'), (req, res) => {
  const products = readProducts();
  const idx = products.findIndex(x => x.code === req.params.code);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const { cat, name, size, price, notes } = req.body;
  const p = products[idx];
  if (cat) p.cat = cat;
  if (name) p.name = name;
  if (size !== undefined) p.size = size;
  if (price !== undefined) p.price = Number(price);
  if (notes !== undefined) p.notes = notes.split(',').map(s => s.trim()).filter(Boolean);
  if (req.file) p.img = `assets/products/${req.file.filename}`;
  writeProducts(products);
  res.json(p);
});

app.delete('/api/products/:code', (req, res) => {
  const products = readProducts();
  const idx = products.findIndex(x => x.code === req.params.code);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const removed = products.splice(idx, 1)[0];
  writeProducts(products);
  res.json({ removed });
});

app.listen(PORT, () => console.log(`Backend running http://localhost:${PORT}`));
