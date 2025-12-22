export default function Avatar({
  src,
  size = 11,
  sizePx,
  alt = "avatar",
  className = "",
}) {
  const computedPx =
    typeof sizePx === "number" && sizePx > 0
      ? sizePx
      : (typeof size === "number" ? size : parseInt(size, 10)) * 4; 

  return (
    <img
      src={src}
      alt={alt}
      style={{ width: computedPx, height: computedPx }}
      className={`rounded-full bg-gray-200 object-cover ring-2 ring-primary-400/30 ${className}`}
    />
  );
}
