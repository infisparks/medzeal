import Image from "next/image";
import Link from "next/link";

// Theme Logo
import ThemeLogo from "../../../../public/img/medzeal.png";

export default function Logo() {
  return (
    <>
      <div className="logo">
        <Link href="/">
          <Image src={ThemeLogo} alt="#" width={200} height={50} />
        </Link>
      </div>
    </>
  );
}
