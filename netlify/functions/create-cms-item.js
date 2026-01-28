import { parse } from 'lambda-multipart-parser';
import fetch from 'node-fetch';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { fields, files } = await parse(event);

    // Extract fields
    const name = fields.find(field => field.name === 'name')?.value || '';
    const shortDescription = fields.find(field => field.name === 'shortDescription')?.value || '';
    const richText = fields.find(field => field.name === 'richText')?.value || '';
    const designType = fields.find(field => field.name === 'designType')?.value || '';

    // Handle file uploads (Image and PDF)
    const imageFile = files.find(file => file.fieldname === 'image');
    const pdfFile = files.find(file => file.fieldname === 'pdf');

    console.log('Received Fields:', { name, shortDescription, richText, designType });
    console.log('Received Files:', { imageFile, pdfFile });

    // TODO: Implement actual file uploads to a service like Cloudinary or S3
    // For now, we'll just use placeholder URLs or omit them if no actual upload is done
    let imageUrl = '';
    let pdfUrl = '';

    if (imageFile) {
      console.log(`Image file detected: ${imageFile.filename}`);
      // Example: Upload image to Cloudinary and get URL
      // imageUrl = await uploadToCloudinary(imageFile.content);
    }

    if (pdfFile) {
      console.log(`PDF file detected: ${pdfFile.filename}`);
      // Example: Upload PDF to Cloudinary/S3 and get URL
      // pdfUrl = await uploadToS3(pdfFile.content);
    }

    // Webflow CMS Integration
    const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;
    const WEBFLOW_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID;

    if (!WEBFLOW_API_KEY || !WEBFLOW_COLLECTION_ID) {
      console.error('Webflow API key or Collection ID is missing.');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error: Webflow API credentials missing.' }),
      };
    }

    const webflowItemData = {
      fields: {
        name: name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
        'short-description': shortDescription,
        'rich-text': richText,
        'design-type': designType,
        // Add placeholder for image and PDF if you have URLs
        // 'main-image': imageUrl,
        // 'pdf-file': pdfUrl,
        _archived: false,
        _draft: true, // Create as draft initially
      },
    };

    try {
      const webflowResponse = await fetch(
        `https://api.webflow.com/collections/${WEBFLOW_COLLECTION_ID}/items`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
            'User-Agent': 'Webflow-PDF-Converter/1.0.0',
          },
          body: JSON.stringify(webflowItemData),
        }
      );

      if (!webflowResponse.ok) {
        const errorText = await webflowResponse.text();
        console.error('Webflow API error:', webflowResponse.status, errorText);
        throw new Error(`Webflow API error: ${webflowResponse.status} - ${errorText}`);
      }

      const webflowResult = await webflowResponse.json();
      console.log('Webflow CMS item created:', webflowResult);

      // Publish the item (optional, can be done manually in Webflow or via another API call)
      // const publishResponse = await fetch(`https://api.webflow.com/collections/${WEBFLOW_COLLECTION_ID}/items/${webflowResult.id}/publish`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
      //   },
      // });

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, webflowItem: webflowResult }),
      };
    } catch (webflowError) {
      console.error('Error interacting with Webflow API:', webflowError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: webflowError.message }),
      };
    }
  } catch (parseError) {
    console.error('Error parsing multipart form data:', parseError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error parsing form data: ${parseError.message}` }),
    };
  }
}
