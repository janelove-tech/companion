const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "this",
  "that",
  "these",
  "those",
  "am",
  "so",
  "if",
  "as",
  "not",
  "no",
  "just",
  "very",
  "too",
  "also",
  "than",
  "then",
  "there",
  "here",
  "when",
  "what",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "some",
  "such",
  "only",
  "own",
  "same",
  "can",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "once",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
}

function buildIdf(documents: string[][]): Map<string, number> {
  const docCount = documents.length;
  const docFreq = new Map<string, number>();

  for (const doc of documents) {
    const unique = new Set(doc);
    for (const term of Array.from(unique)) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, freq] of docFreq) {
    idf.set(term, Math.log((docCount + 1) / (freq + 1)) + 1);
  }
  return idf;
}

function tfidfVector(
  tokens: string[],
  idf: Map<string, number>
): Map<string, number> {
  const tf = termFrequency(tokens);
  const total = tokens.length || 1;
  const vector = new Map<string, number>();

  for (const [term, count] of tf) {
    const tfScore = count / total;
    const idfScore = idf.get(term) ?? 1;
    vector.set(term, tfScore * idfScore);
  }
  return vector;
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  const allKeys = new Set([...a.keys(), ...b.keys()]);

  for (const key of Array.from(allKeys)) {
    const valA = a.get(key) ?? 0;
    const valB = b.get(key) ?? 0;
    dot += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function checkSimilarity(
  candidate: string,
  recentMessages: string[]
): Promise<number> {
  if (recentMessages.length === 0) return 0;

  const candidateTokens = tokenize(candidate);
  const docTokens = recentMessages.map(tokenize);
  const allDocs = [candidateTokens, ...docTokens];
  const idf = buildIdf(allDocs);
  const candidateVec = tfidfVector(candidateTokens, idf);

  let maxSimilarity = 0;
  for (const doc of docTokens) {
    const docVec = tfidfVector(doc, idf);
    const sim = cosineSimilarity(candidateVec, docVec);
    if (sim > maxSimilarity) maxSimilarity = sim;
  }

  return maxSimilarity;
}
