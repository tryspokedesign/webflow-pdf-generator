export async function handler(event) {
  // This function helps debug environment variables
  // DO NOT use this in production - remove after testing
  
  const hasApiKey = !!process.env.WEBFLOW_API_KEY;
  const hasCollectionId = !!process.env.WEBFLOW_COLLECTION_ID;
  const apiKeyLength = process.env.WEBFLOW_API_KEY ? process.env.WEBFLOW_API_KEY.length : 0;
  const collectionIdLength = process.env.WEBFLOW_COLLECTION_ID ? process.env.WEBFLOW_COLLECTION_ID.length : 0;
  
  // Show first 4 and last 4 characters only for security
  const apiKeyPreview = process.env.WEBFLOW_API_KEY 
    ? `${process.env.WEBFLOW_API_KEY.substring(0, 4)}...${process.env.WEBFLOW_API_KEY.substring(process.env.WEBFLOW_API_KEY.length - 4)}`
    : 'NOT SET';
  
  const collectionIdPreview = process.env.WEBFLOW_COLLECTION_ID
    ? `${process.env.WEBFLOW_COLLECTION_ID.substring(0, 4)}...${process.env.WEBFLOW_COLLECTION_ID.substring(process.env.WEBFLOW_COLLECTION_ID.length - 4)}`
    : 'NOT SET';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hasApiKey,
      hasCollectionId,
      apiKeyLength,
      collectionIdLength,
      apiKeyPreview,
      collectionIdPreview,
      allEnvVars: Object.keys(process.env).filter(key => key.startsWith('WEBFLOW'))
    }),
  };
}
