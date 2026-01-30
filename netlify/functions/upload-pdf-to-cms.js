import fetch from 'node-fetch';
import FormData from 'form-data';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { itemId, pdfBase64, fileName } = JSON.parse(event.body);

    if (!itemId || !pdfBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: itemId, pdfBase64' }),
      };
    }

    const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;
    const WEBFLOW_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID;

    if (!WEBFLOW_API_KEY || !WEBFLOW_COLLECTION_ID) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error: Webflow API credentials missing.' }),
      };
    }

    console.log('Uploading PDF to CMS item:', itemId);

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: fileName || 'generated.pdf',
      contentType: 'application/pdf',
    });

    // Step 1: Upload file to Webflow assets
    const uploadResponse = await fetch('https://api.webflow.com/v2/sites/' + process.env.WEBFLOW_SITE_ID + '/assets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Webflow asset upload error:', uploadResponse.status, errorText);
      throw new Error(`Webflow asset upload error: ${uploadResponse.status} - ${errorText}`);
    }

    const assetResult = await uploadResponse.json();
    console.log('Asset uploaded:', assetResult);

    // Step 2: Update CMS item with the PDF file reference
    const updateResponse = await fetch(
      `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items/${itemId}/live`,
      {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
        },
        body: JSON.stringify({
          fieldData: {
            'pdf-file': assetResult.fileId || assetResult.id,
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Webflow CMS update error:', updateResponse.status, errorText);
      throw new Error(`Webflow CMS update error: ${updateResponse.status} - ${errorText}`);
    }

    const updateResult = await updateResponse.json();
    console.log('CMS item updated with PDF:', updateResult);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, asset: assetResult, item: updateResult }),
    };
  } catch (error) {
    console.error('Error uploading PDF to CMS:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error uploading PDF: ${error.message}` }),
    };
  }
}
