const PDFDocument = require('pdfkit');
const { generateBarcodePng } = require('./barcodeService');

function generateInvoicePDF(shipment, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${shipment.tracking_id}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(22).fillColor('#1a3a5c').text('SwiftShip Logistics', { continued: false });
  doc.fontSize(10).fillColor('#555').text('123 Freight Ave, Logistics City, LC 00000');
  doc.text('support@swiftship.com | (555) 123-4567');
  doc.moveDown(1.5);

  doc.fontSize(16).fillColor('#000').text('INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#555').text(`Invoice #: INV-${shipment.tracking_id}`, { align: 'right' });
  doc.text(`Date: ${new Date(shipment.created_at).toLocaleDateString()}`, { align: 'right' });
  doc.moveDown(1);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
  doc.moveDown(1);

  // Bill To / Shipment info
  doc.fontSize(12).fillColor('#000').text('Bill To:', { underline: true });
  doc.fontSize(10).fillColor('#333');
  doc.text(shipment.customer_name || 'Customer');
  doc.text(shipment.customer_email || '');
  doc.moveDown(0.8);

  doc.fontSize(12).fillColor('#000').text('Shipment Details:', { underline: true });
  doc.fontSize(10).fillColor('#333');
  doc.text(`Tracking ID: ${shipment.tracking_id}`);
  doc.text(`Origin: ${shipment.origin}`);
  doc.text(`Destination: ${shipment.destination}`);
  doc.text(`Service Type: ${(shipment.service_type || 'standard').toUpperCase()}`);
  doc.text(`Weight: ${shipment.weight_kg} kg`);
  if (shipment.length_cm) {
    doc.text(`Dimensions: ${shipment.length_cm} x ${shipment.width_cm} x ${shipment.height_cm} cm`);
  }
  doc.moveDown(1);

  // Charges table
  doc.fontSize(12).fillColor('#000').text('Charges', { underline: true });
  doc.moveDown(0.3);

  const tableTop = doc.y;
  doc.fontSize(10).fillColor('#000');
  doc.text('Description', 50, tableTop, { width: 300 });
  doc.text('Amount (USD)', 400, tableTop, { width: 145, align: 'right' });
  doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor('#ccc').stroke();
  doc.moveDown(0.6);

  const rows = [
    ['Base Fee', shipment.pricing?.base_fee],
    ['Distance Charge', shipment.pricing?.distance_cost],
    ['Weight Charge', shipment.pricing?.weight_cost],
  ];
  rows.forEach(([label, val]) => {
    if (val === undefined) return;
    const y = doc.y;
    doc.fontSize(10).fillColor('#333').text(label, 50, y, { width: 300 });
    doc.text(`$${Number(val).toFixed(2)}`, 400, y, { width: 145, align: 'right' });
    doc.moveDown(0.5);
  });

  doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor('#ccc').stroke();
  doc.moveDown(0.6);
  doc.fontSize(12).fillColor('#000').text('Total', 50, doc.y, { width: 300, });
  doc.fontSize(12).text(`$${Number(shipment.cost).toFixed(2)}`, 400, doc.y - 14, { width: 145, align: 'right' });

  doc.moveDown(3);
  doc.fontSize(9).fillColor('#888').text('Thank you for shipping with SwiftShip Logistics.', { align: 'center' });

  doc.end();
}

async function generateWaybillPDF(shipment, res) {
  const doc = new PDFDocument({ margin: 40, size: [400, 600] }); // label-sized
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=waybill-${shipment.tracking_id}.pdf`);
  doc.pipe(res);

  // Box border
  doc.rect(20, 20, 360, 560).strokeColor('#000').lineWidth(1.5).stroke();

  doc.fontSize(18).fillColor('#1a3a5c').text('SwiftShip', 35, 35);
  doc.fontSize(9).fillColor('#555').text('CONSIGNMENT WAYBILL', 35, 58);

  doc.moveTo(30, 80).lineTo(370, 80).strokeColor('#000').stroke();

  // Tracking ID big & bold
  doc.fontSize(11).fillColor('#333').text('TRACKING ID', 35, 92);
  doc.fontSize(20).fillColor('#000').font('Helvetica-Bold').text(shipment.tracking_id, 35, 108);
  doc.font('Helvetica');

  // Real, scannable Code128 barcode encoding the tracking ID.
  try {
    const barcodePng = await generateBarcodePng(shipment.tracking_id);
    doc.image(barcodePng, 35, 140, { width: 330, height: 55, fit: [330, 55] });
  } catch (err) {
    // If barcode generation ever fails (e.g. an unexpected character), the
    // waybill should still render — just without the scannable barcode —
    // rather than fail the whole document.
    doc.fontSize(9).fillColor('#b3432f').text('(barcode unavailable)', 35, 155);
  }

  let y = 210;
  doc.fontSize(9).fillColor('#555').text('SERVICE TYPE', 35, y);
  doc.fontSize(11).fillColor('#000').text((shipment.service_type || 'standard').toUpperCase(), 35, y + 12);

  y += 40;
  doc.moveTo(30, y).lineTo(370, y).strokeColor('#ccc').stroke();
  y += 12;

  doc.fontSize(9).fillColor('#555').text('FROM', 35, y);
  doc.fontSize(10).fillColor('#000').text(shipment.origin, 35, y + 12, { width: 320 });

  y += 45;
  doc.fontSize(9).fillColor('#555').text('TO', 35, y);
  doc.fontSize(10).fillColor('#000').text(shipment.destination, 35, y + 12, { width: 320 });

  y += 45;
  doc.moveTo(30, y).lineTo(370, y).strokeColor('#ccc').stroke();
  y += 12;

  doc.fontSize(9).fillColor('#555').text('RECIPIENT', 35, y);
  doc.fontSize(10).fillColor('#000').text(shipment.recipient_name, 35, y + 12);
  doc.fontSize(9).fillColor('#333').text(shipment.recipient_phone, 35, y + 26);
  doc.fontSize(9).fillColor('#333').text(shipment.recipient_address, 35, y + 39, { width: 320 });

  y += 90;
  doc.moveTo(30, y).lineTo(370, y).strokeColor('#ccc').stroke();
  y += 12;

  doc.fontSize(9).fillColor('#555').text('WEIGHT', 35, y);
  doc.fontSize(10).fillColor('#000').text(`${shipment.weight_kg} kg`, 35, y + 12);

  doc.fontSize(9).fillColor('#555').text('DIMENSIONS (L x W x H)', 190, y);
  doc.fontSize(10).fillColor('#000').text(
    shipment.length_cm ? `${shipment.length_cm} x ${shipment.width_cm} x ${shipment.height_cm} cm` : 'N/A',
    190, y + 12
  );

  y += 45;
  doc.fontSize(8).fillColor('#888').text(`Booked: ${new Date(shipment.created_at).toLocaleString()}`, 35, y);

  doc.end();
}

module.exports = { generateInvoicePDF, generateWaybillPDF };
