import { useState } from 'react';
import Modal from './Modal';

function Form() {
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    image: null,
    richText: '',
    designType: '',
    pdf: null,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [cmsItemData, setCmsItemData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'file' ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    const formDataToSend = new FormData();
    for (const key in formData) {
      formDataToSend.append(key, formData[key]);
    }

    try {
      // Step 1: Create CMS item
      const response = await fetch('/.netlify/functions/create-cms-item', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('CMS item created:', result);
      setCmsItemData(result);

      // Step 2: Generate PDF from the Webflow page URL
      const pdfResponse = await fetch('/.netlify/functions/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: result.pageUrl }),
      });

      if (!pdfResponse.ok) {
        throw new Error(`PDF generation error! status: ${pdfResponse.status}`);
      }

      const pdfResult = await pdfResponse.json();
      console.log('PDF generated:', pdfResult.size, 'bytes');
      
      setPdfData(pdfResult.pdf);
      setIsGenerating(false);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error: ${error.message}`);
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfData) return;

    const blob = new Blob([Uint8Array.from(atob(pdfData), c => c.charCodeAt(0))], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cmsItemData.slug || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadToCMS = async () => {
    if (!pdfData || !cmsItemData) return;

    setIsUploading(true);

    try {
      const uploadResponse = await fetch('/.netlify/functions/upload-pdf-to-cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: cmsItemData.itemId,
          pdfBase64: pdfData,
          fileName: `${cmsItemData.slug}.pdf`,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload error! status: ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('PDF uploaded to CMS:', uploadResult);
      alert('PDF uploaded to CMS successfully!');
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading PDF to CMS:', error);
      alert(`Error uploading PDF: ${error.message}`);
      setIsUploading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPdfData(null);
    setCmsItemData(null);
    
    // Reset form
    setFormData({
      name: '',
      shortDescription: '',
      image: null,
      richText: '',
      designType: '',
      pdf: null,
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="shortDescription">Short Description:</label>
          <textarea
            id="shortDescription"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="image">Image:</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="richText">Rich Text:</label>
          <textarea
            id="richText"
            name="richText"
            value={formData.richText}
            onChange={handleChange}
          ></textarea>
        </div>
        <div>
          <label htmlFor="designType">Design Type:</label>
          <select
            id="designType"
            name="designType"
            value={formData.designType}
            onChange={handleChange}
            required
          >
            <option value="">Select a design type</option>
            <option value="typeA">Type A</option>
            <option value="typeB">Type B</option>
            <option value="typeC">Type C</option>
          </select>
        </div>
        <div>
          <label htmlFor="pdf">PDF:</label>
          <input
            type="file"
            id="pdf"
            name="pdf"
            accept=".pdf"
            onChange={handleChange}
          />
        </div>
        <button type="submit" disabled={isGenerating}>
          {isGenerating ? 'Creating CMS Item & Generating PDF...' : 'Submit'}
        </button>
      </form>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="pdf-preview-container">
          <h2>PDF Generated Successfully!</h2>
          {pdfData && (
            <>
              <div className="pdf-viewer">
                <iframe
                  src={`data:application/pdf;base64,${pdfData}`}
                  title="PDF Preview"
                  width="100%"
                  height="500px"
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn-primary"
                  onClick={handleDownloadPDF}
                  disabled={isUploading}
                >
                  Download PDF
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleUploadToCMS}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload to CMS'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

export default Form;
