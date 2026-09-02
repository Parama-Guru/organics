export function StorefrontPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`storefront-illustration ${compact ? "storefront-illustration--compact" : ""}`} aria-hidden>
      <span className="storefront-illustration__sun" />
      <span className="storefront-illustration__ground" />
      <span className="storefront-illustration__shop">
        <i className="storefront-illustration__awning" />
        <i className="storefront-illustration__door" />
        <i className="storefront-illustration__window" />
        <i className="storefront-illustration__sign">O</i>
      </span>
      <span className="storefront-illustration__plant storefront-illustration__plant--one" />
      <span className="storefront-illustration__plant storefront-illustration__plant--two" />
    </div>
  );
}
