import HeaderInner from "./HeaderInner/InnerOne";
import Topbar from "./Topbar";

export default function Header() {
  return (
    <>
      <header className="header">
        <Topbar />
        <HeaderInner />
      </header>
    </>
  );
}
