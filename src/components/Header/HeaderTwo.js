import Topbar from "./Topbar";
import HeaderMiddle from "./HeaderMiddle";
import HeaderInner2 from "./HeaderInner/InnerTwo";

export default function HeaderTwo() {
  return (
    <>
      <header className="header style2">
        <Topbar />
        <HeaderMiddle />
        <HeaderInner2 />
      </header>
    </>
  );
}
