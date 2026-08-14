import { importArticles } from './article-importer';

/**
 * Compatibility entry point for existing administrator seed controls.
 * Article ingestion is delegated to the validated content/articles importer,
 * which performs frontmatter, language, date and schema checks before writing.
 */
export async function seedArticles(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    await importArticles();
    return {
      success: true,
      message: 'Validated article import completed',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown article import failure';
    console.error('[seedArticles] Validated import failed:', error);
    return {
      success: false,
      message: 'Validated article import failed',
      error: message,
    };
  }
}
