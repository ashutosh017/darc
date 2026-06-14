import { Pinecone } from '@pinecone-database/pinecone';

async function main() {
  const pineconeKey = process.env.PINECONE_API_KEY;
  if (!pineconeKey) {
    throw new Error('PINECONE_API_KEY is missing');
  }

  const pc = new Pinecone({ apiKey: pineconeKey });
  const index = pc.Index('youtube-transcripts');

  const queryText = "How to increase self confidence";
  console.log('Query:', queryText);

  try {
    console.log('Generating embedding via Pinecone Inference API...');
    const embeddingResponse = await pc.inference.embed({
      model: 'multilingual-e5-large',
      inputs: [queryText],
      parameters: {
        input_type: 'query',
      }
    });

    console.log('Full Response:', JSON.stringify(embeddingResponse, null, 2));

    const queryVector = embeddingResponse.data?.[0]?.values;
    if (!queryVector) {
      throw new Error('Failed to retrieve vector values');
    }
    console.log('Embedding generated successfully. Length:', queryVector.length);

    console.log('Querying Pinecone index...');
    const queryResult = await index.query({
      vector: queryVector,
      topK: 5,
      includeMetadata: true,
    });

    console.log('\n--- Pinecone Query Matches ---');
    for (const m of queryResult.matches || []) {
      console.log(`Score: ${m.score?.toFixed(4)} | Title: ${m.metadata?.videoTitle} | Text: ${m.metadata?.text}`);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

main().catch(console.error);
