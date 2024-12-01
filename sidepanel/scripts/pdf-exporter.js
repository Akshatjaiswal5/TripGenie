import html2pdf from 'html2pdf.js';

export class PDFExporter {
    static exportItinerary(itineraryContent, name) {
      html2pdf()
      .from(itineraryContent)
      .set({
        margin: 1,
        filename:name,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .save().then(() => {
    })
    .catch((error) => {
      throw error;
    });
    }    
}