import PDFDocument from 'pdfkit';

const KardexeInv = (dataCallBack, endCallBack) => {
    const doc = new PDFDocument();
    doc.on('data', dataCallBack);
    doc.on('end', endCallBack);
    doc.fontSize(25);
    doc.text("Existencia de Articulos (Lotes vs Kardex)", 100, 100);
    doc.end();
}

export default KardexeInv;