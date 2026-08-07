import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Queries Pinecone vector index for relevant relationship coaching transcripts based on a dense embedding.
 */
export async function getPineconeContext(queryText: string): Promise<string> {
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  if (!pineconeApiKey) {
    console.warn("[getPineconeContext] PINECONE_API_KEY is not defined");
    return "";
  }

  try {
    const pc = new Pinecone({ apiKey: pineconeApiKey });
    console.log("query text: ", queryText);
    const embeddingResult = await pc.inference.embed({
      model: "multilingual-e5-large",
      inputs: [queryText],
      parameters: {
        input_type: "query",
      },
    });

    const firstEmbedding = embeddingResult.data?.[0];
    const queryVector =
      firstEmbedding && firstEmbedding.vectorType === "dense"
        ? firstEmbedding.values
        : undefined;

    if (!queryVector) {
      console.warn("[getPineconeContext] Failed to generate embedding values from Pinecone");
      return "";
    }

    const indexName = process.env.PINECONE_INDEX || "youtube-transcripts";
    const index = pc.Index(indexName);

    const queryResponse = await index.query({
      vector: queryVector,
      topK: 5,
      includeMetadata: true,
    });

    console.log("query response: ", queryResponse.matches.map((m)=>m.metadata));

    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      return "";
    }

    return queryResponse.matches
      .map((match) => {
        const metadata = match.metadata as { text?: string; videoTitle?: string } | undefined;
        if (!metadata || !metadata.text) return "";
        return `[Video Segment: "${metadata.videoTitle || "Coaching Segment"}"]\n${metadata.text}`;
      })
      .filter(Boolean)
      .join("\n\n");
  } catch (error) {
    console.error("[getPineconeContext] Error querying Pinecone:", error);
    return "";
  }
}
