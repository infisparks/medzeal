import ColorPlate from "./";

export default function ColorLayout({ children }) {
  return (
    <div>
      <ColorPlate />
      <main>{children}</main>
    </div>
  );
}
