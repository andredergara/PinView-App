export function PinViewLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const heights = { sm: 28, md: 38, lg: 56 };
  return (
    <img
      src="/pinview-logo.png"
      alt="PinView"
      style={{ height: heights[size], width: "auto", objectFit: "contain" }}
    />
  );
}
