const express = require('express');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/data', express.static('data'));

// In-memory storage
let residentData = [];
let sheetDataMap = {};
let currentSheet = '';
let editedCells = {};

const upload = multer({ dest: 'uploads/' });

// Helper: Save state to disk
function saveState() {
  fs.writeFileSync('data/residentData.json', JSON.stringify(residentData));
  fs.writeFileSync('data/sheetDataMap.json', JSON.stringify(sheetDataMap));
  fs.writeFileSync('data/currentSheet.json', JSON.stringify(currentSheet));
  fs.writeFileSync('data/editedCells.json', JSON.stringify(editedCells));
}

// Helper: Load state from disk
function loadState() {
  if (fs.existsSync('data/residentData.json')) residentData = JSON.parse(fs.readFileSync('data/residentData.json'));
  if (fs.existsSync('data/sheetDataMap.json')) sheetDataMap = JSON.parse(fs.readFileSync('data/sheetDataMap.json'));
  if (fs.existsSync('data/currentSheet.json')) currentSheet = JSON.parse(fs.readFileSync('data/currentSheet.json'));
  if (fs.existsSync('data/editedCells.json')) editedCells = JSON.parse(fs.readFileSync('data/editedCells.json'));
}

// Ensure data directory exists
if (!fs.existsSync('data')) fs.mkdirSync('data');

loadState();

// Upload Excel file
app.post('/api/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
  sheetDataMap = {};
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    sheetDataMap[sheetName] = XLSX.utils.sheet_to_json(worksheet);
  });
  residentData = sheetDataMap[workbook.SheetNames[0]] || [];
  currentSheet = workbook.SheetNames[0];
  saveState();
  res.json({ sheets: Object.keys(sheetDataMap) });
});

// Get current sheet data
app.get('/api/data', (req, res) => {
  res.json({
    residentData,
    sheetNames: Object.keys(sheetDataMap),
    currentSheet
  });
});

// Set active sheet
app.post('/api/set-sheet', (req, res) => {
  currentSheet = req.body.sheetName;
  saveState();
  res.json(sheetDataMap[currentSheet]);
});

// Add new row
app.post('/api/add-row', (req, res) => {
  const newRow = req.body;
  residentData.push(newRow);
  sheetDataMap[currentSheet].push(newRow);
  saveState();
  res.json({ success: true });
});

// Delete row
app.post('/api/delete-row', (req, res) => {
  const id = req.body.id;
  residentData = residentData.filter(row => row.ID !== id);
  sheetDataMap[currentSheet] = sheetDataMap[currentSheet].filter(row => row.ID !== id);
  saveState();
  res.json({ success: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
