import { useState } from 'react';

function Form() {
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    image: null,
    richText: '',
    designType: '',
    pdf: null,
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'file' ? files[0] : value,
    }));
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    for (const key in formData) {
      formDataToSend.append(key, formData[key]);
    }

    try {
      const response = await fetch('/.netlify/functions/create-cms-item', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Submission successful:', result);
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form.');
    }
  };

  return (
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
      <button type="submit">Submit</button>
    </form>
  );
}

export default Form;
