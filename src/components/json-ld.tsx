/**
 * JSON-LD, emitted as a script tag.
 *
 * `JSON.stringify` is not enough on its own: a farm named `</script>` would
 * close the tag and everything after it becomes markup. Escaping `<` is what
 * makes the payload inert, and it stays valid JSON because `\u003c` is the same
 * character to any parser.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
