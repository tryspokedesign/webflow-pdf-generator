import { parse } from 'lambda-multipart-parser';
import fetch from 'node-fetch';
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }
  console.log("WEBFLOW_API_KEY:", process.env.WEBFLOW_API_KEY);
  console.log("WEBFLOW_COLLECTION_ID:", process.env.WEBFLOW_COLLECTION_ID);

  try {
    console.log('METHOD:', event.httpMethod);
    console.log('Event Body Length:', event.body ? event.body.length : 'undefined');
    console.log('Event isBase64Encoded:', event.isBase64Encoded);
    console.log('Content-Type:', event.headers['content-type'] || event.headers['Content-Type']);

    // Let lambda-multipart-parser handle the base64 decoding
    const parsedResult = await parse(event);
    console.log('Parsed Result:', JSON.stringify(parsedResult, null, 2));

    // Extract fields directly from parsedResult (lambda-multipart-parser puts them directly on the object)
    const name = parsedResult.name || '';
    const shortDescription = parsedResult.shortDescription || '';
    const richText = parsedResult.richText || '';
    const designType = parsedResult.designType || '';

    console.log('Received Fields:', { name, shortDescription, richText, designType });

    // Validate required fields
    if (!name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: name' }),
      };
    }

    // Handle file uploads (Image and PDF)
    const files = parsedResult.files || [];
    const imageFile = files.find(file => file.fieldname === 'image');
    const pdfFile = files.find(file => file.fieldname === 'pdf');

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
      fieldData: {
        name: name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
        'short-description': shortDescription,
        'rich-text': richText,
        // 'design-type': designType,
        // Add placeholder for image and PDF if you have URLs
        // 'main-image': imageUrl,
        // 'pdf-file': pdfUrl,
      },
    };

    try {
      const webflowResponse = await fetch(
        `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items?skipInvalidFiles=true`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
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
