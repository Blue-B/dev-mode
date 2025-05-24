import { NavLink } from "react-router-dom";

const Header = () => {
  return (
    <header className="border-b border-[#eaeaea] py-3 px-6 flex items-center">
      <div className="flex items-center">
        <NavLink to="/">
          <span className="text-black mr-1">◆</span>
          <span className="font-semibold">깐부대출</span>
        </NavLink>
      </div>
    </header>
  );
};

export default Header;
