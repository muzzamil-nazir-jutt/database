// controllers/pdfController.js
// Phase 2: Advanced PDF Grid Generation Engine
//
// Generates a printable, paginated PDF of all equipment QR labels.
// Each label cell contains:
//   TOP    → Equipment name (truncated, clean typography)
//   MIDDLE → QR code image (centered, crisp, encodes asset_number only)
//   BOTTOM → asset_number in bold monospace font
//
// Grid layout: 3 columns per row, N rows per page (auto-paginated).
// Streams the PDF directly to the HTTP response — no temp files on disk.

'use strict';

const PDFDocument = require('pdfkit');
const QRCode     = require('qrcode');
const { getAllEquipment } = require('../models/equipmentModel');

// ─── Page & Grid Constants ───────────────────────────────────────────────────

const PAGE_WIDTH   = 612;   // US Letter, points (72pt = 1 inch)
const PAGE_HEIGHT  = 792;

const MARGIN_X     = 36;    // 0.5" left/right margins
const MARGIN_TOP   = 70;    // Space for page title / header
const MARGIN_BOT   = 36;    // 0.5" bottom margin

const COLS         = 3;     // Label columns per row
const COL_GAP      = 12;    // Horizontal gap between cells (points)
const ROW_GAP      = 12;    // Vertical gap between rows (points)

// Derive cell dimensions from page geometry
const USABLE_W     = PAGE_WIDTH - MARGIN_X * 2;
const CELL_W       = (USABLE_W - COL_GAP * (COLS - 1)) / COLS;  // ~180pt

const CELL_PAD     = 8;     // Internal cell padding
const INNER_W      = CELL_W - CELL_PAD * 2;

// Typography heights (points)
const NAME_FONT_SIZE  = 9;
const NAME_LINE_H     = 13;
const NAME_LINES      = 2;   // Max lines before truncation
const NAME_H          = NAME_LINES * NAME_LINE_H;

const ASSETNO_FONT_SIZE = 8;
const ASSETNO_H         = 13;

const QR_SIZE       = Math.floor(INNER_W * 0.78);  // ~≈140pt — takes ~78% of inner width
const QR_V_PAD      = 6;   // Vertical padding above/below QR

const CELL_H        = CELL_PAD                 // top pad
                    + NAME_H                   // name text block
                    + QR_V_PAD                 // gap before QR
                    + QR_SIZE                  // QR image
                    + QR_V_PAD                 // gap after QR
                    + ASSETNO_H                // asset_number text
                    + CELL_PAD;               // bottom pad
                    // ≈ 8 + 26 + 6 + 140 + 6 + 13 + 8 = 207pt

// How many complete rows fit on one page
const USABLE_H      = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOT;
const ROWS_PER_PAGE = Math.floor((USABLE_H + ROW_GAP) / (CELL_H + ROW_GAP));
const PER_PAGE      = COLS * ROWS_PER_PAGE;

// ─── Helper: Generate QR PNG Buffer ──────────────────────────────────────────

/**
 * Renders a QR code encoding `text` as a high-contrast PNG buffer.
 * @param {string} text  The raw string to encode (asset_number).
 * @returns {Promise<Buffer>}
 */
async function generateQrBuffer(text) {
  return QRCode.toBuffer(text, {
    type:          'png',
    width:         QR_SIZE * 3,   // 3× for crisp embedding after PDF downscale
    margin:        1,
    color: {
      dark:  '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

// ─── Helper: Truncate a string to fit within `maxWidth` pts ──────────────────

function truncateToWidth(doc, str, maxWidth, fontSize) {
  doc.fontSize(fontSize);
  if (doc.widthOfString(str) <= maxWidth) return str;

  let truncated = str;
  while (truncated.length > 0 && doc.widthOfString(truncated + '…') > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

// ─── Helper: Wrap name text into max 2 lines ──────────────────────────────────

function wrapName(doc, name, maxWidth, fontSize) {
  doc.fontSize(fontSize);
  const words = name.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (doc.widthOfString(test) > maxWidth) {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= NAME_LINES - 1) {
        // On the last allowed line, truncate the rest
        current = truncateToWidth(doc, name.slice(name.indexOf(current)), maxWidth, fontSize);
        break;
      }
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, NAME_LINES);
}

// ─── Helper: Draw a single label cell ────────────────────────────────────────

/**
 * Draws one equipment label cell at position (x, y).
 * @param {PDFDocument} doc
 * @param {number} x       Left edge of cell
 * @param {number} y       Top edge of cell
 * @param {Object} item    Equipment record { name, asset_number }
 * @param {Buffer} qrBuf   PNG buffer of the QR code
 */
function drawCell(doc, x, y, item, qrBuf) {
  // ── Cell border (rounded rect, light gray) ────────────────────────────────
  doc
    .save()
    .roundedRect(x, y, CELL_W, CELL_H, 4)
    .strokeColor('#CCCCCC')
    .lineWidth(0.5)
    .stroke()
    .restore();

  // ── Name text block (top of cell) ─────────────────────────────────────────
  const nameLines = wrapName(doc, item.name, INNER_W, NAME_FONT_SIZE);
  doc.fontSize(NAME_FONT_SIZE).fillColor('#1a1a1a').font('Helvetica-Bold');

  nameLines.forEach((line, i) => {
    // Center each line horizontally
    const lineW   = doc.widthOfString(line);
    const lineX   = x + CELL_PAD + (INNER_W - lineW) / 2;
    const lineY   = y + CELL_PAD + i * NAME_LINE_H;
    doc.text(line, lineX, lineY, { lineBreak: false });
  });

  // ── QR Code image (centered horizontally) ─────────────────────────────────
  const qrX = x + CELL_PAD + (INNER_W - QR_SIZE) / 2;
  const qrY = y + CELL_PAD + NAME_H + QR_V_PAD;
  doc.image(qrBuf, qrX, qrY, { width: QR_SIZE, height: QR_SIZE });

  // ── Asset Number text (bottom of cell, monospace bold) ────────────────────
  doc.fontSize(ASSETNO_FONT_SIZE).fillColor('#000000').font('Courier-Bold');
  const assetStr  = item.asset_number;
  const assetW    = doc.widthOfString(assetStr);
  const assetX    = x + CELL_PAD + (INNER_W - assetW) / 2;
  const assetY    = qrY + QR_SIZE + QR_V_PAD;
  doc.text(assetStr, assetX, assetY, { lineBreak: false });
}

// ─── Helper: Draw page header ────────────────────────────────────────────────

function drawPageHeader(doc, pageNum, totalPages) {
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#111111');
  doc.text('Power Plant Equipment — QR Label Sheet', MARGIN_X, 20, {
    width: PAGE_WIDTH - MARGIN_X * 2,
    align: 'left',
    lineBreak: false,
  });

  // Page number (right-aligned)
  doc.fontSize(8).font('Helvetica').fillColor('#888888');
  const pageLabel = `Page ${pageNum} of ${totalPages}`;
  const labelW    = doc.widthOfString(pageLabel);
  doc.text(pageLabel, PAGE_WIDTH - MARGIN_X - labelW, 25, { lineBreak: false });

  // Thin separator line
  doc
    .moveTo(MARGIN_X, 44)
    .lineTo(PAGE_WIDTH - MARGIN_X, 44)
    .strokeColor('#DDDDDD')
    .lineWidth(0.75)
    .stroke();

  // Sub-header: generation timestamp
  doc.fontSize(7).font('Helvetica').fillColor('#AAAAAA');
  const ts = new Date().toLocaleString('en-US', { timeZone: 'UTC', hour12: false });
  doc.text(`Generated: ${ts} UTC  ·  Scan QR to retrieve equipment details`, MARGIN_X, 50, {
    lineBreak: false,
  });
}

// ─── Main Controller ──────────────────────────────────────────────────────────

/**
 * GET /api/download-qrs
 * Streams a printable PDF of all equipment QR label sheets.
 */
async function downloadQrPdf(req, res) {
  try {
    // 1. Fetch all equipment from the database
    const equipment = await getAllEquipment();

    if (equipment.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No equipment records found. Add equipment before generating QR sheets.',
      });
    }

    // 2. Pre-generate all QR buffers in parallel (fast)
    const qrBuffers = await Promise.all(
      equipment.map((item) => generateQrBuffer(item.asset_number))
    );

    // 3. Calculate total pages needed
    const totalPages = Math.ceil(equipment.length / PER_PAGE);

    // 4. Initialize PDF stream
    const doc = new PDFDocument({
      size:    'LETTER',
      margins: { top: MARGIN_TOP, bottom: MARGIN_BOT, left: MARGIN_X, right: MARGIN_X },
      autoFirstPage: false,   // We manually add pages for full control
      info: {
        Title:    'Power Plant Equipment QR Label Sheets',
        Author:   'Power Plant Equipment Tracking System',
        Subject:  'Equipment Asset QR Labels',
        Keywords: 'QR, equipment, power plant, asset tracking',
        Creator:  'PP-Tracker-API v1.0',
      },
    });

    // 5. Set streaming response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="equipment-qr-labels-${Date.now()}.pdf"`
    );
    res.setHeader('Cache-Control', 'no-cache');
    doc.pipe(res);

    // 6. Render pages
    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      doc.addPage({ size: 'LETTER' });

      // Draw header on every page
      drawPageHeader(doc, pageIdx + 1, totalPages);

      // Determine which equipment items go on this page
      const startIdx = pageIdx * PER_PAGE;
      const pageItems = equipment.slice(startIdx, startIdx + PER_PAGE);

      // 7. Grid layout math — position each cell precisely
      pageItems.forEach((item, localIdx) => {
        const col = localIdx % COLS;
        const row = Math.floor(localIdx / COLS);

        // X: left margin + (cell width + gap) × column index
        const cellX = MARGIN_X + col * (CELL_W + COL_GAP);

        // Y: top margin + (cell height + gap) × row index
        const cellY = MARGIN_TOP + row * (CELL_H + ROW_GAP);

        const globalIdx = startIdx + localIdx;
        drawCell(doc, cellX, cellY, item, qrBuffers[globalIdx]);
      });
    }

    // 8. Finalize and flush
    doc.end();

  } catch (err) {
    console.error('[downloadQrPdf] Fatal error:', err.message);
    // Only send error header if headers haven't been sent yet (PDF not started)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate PDF. Please try again.',
      });
    }
  }
}

module.exports = { downloadQrPdf };
