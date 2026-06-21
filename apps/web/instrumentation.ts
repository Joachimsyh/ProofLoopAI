export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { bootstrapRagIndex } = await import('@/lib/server/rag/pipeline');
    bootstrapRagIndex().catch((err) => {
      console.warn('[rag] bootstrap skipped:', err instanceof Error ? err.message : err);
    });
  }
}
