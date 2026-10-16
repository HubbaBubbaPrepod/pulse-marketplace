import { serializeSchema } from '../lib/seo.mjs';

export function StructuredData({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeSchema(data) }}
    />
  );
}
