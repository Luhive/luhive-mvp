// import { Mail, Twitter, Linkedin } from "lucide-react";
// import LuhiveLogo1 from '~/assets/images/LuhiveLogo.svg'
import LuhiveLogo from '../../assets/images/LuhiveLogo.svg'
import { Link } from "react-router";
import Xsocialmedia from '../../assets/icons/Xsocialmedia.svg'
import Linkedin from '../../assets/icons/Linkedin.svg' 
import Message from '../../assets/icons/Message.svg'


export default function Footer() {
  return (
    <footer className="py-3 pb-5 flex items-center justify-between bg-white text-gray-600">
      {/* Left Section */}
      <div className="flex items-center space-x-5">
        <Link to="/" className="flex items-center gap-3">
            <img className="h-4 w-4" src={LuhiveLogo} alt="Luhive Logo" />
            <h1 className="font-black text-xs tracking-tight hidden sm:block">Luhive</h1>
        </Link>

        {/* circle */}
        <div className="h-1 w-1 rounded-full bg-gray-600">
        </div>

        <a href="#" className="hover:text-black transition text-xs opacity-70 font-sans">Discover</a>
        <a href="#" className="hover:text-black transition text-xs opacity-70 font-sans">Help</a>

      </div>

      

      {/* Right Icons */}
      <div className="flex items-center space-x-4">
        <a href="mailto:contact@luhive.com" className="hover:text-black transition">
          <img className="h-6 w-6" src={Message} alt="Message Icon" />
        </a>
        <a href="https://twitter.com/luhive_" target="_blank" rel="noopener noreferrer" className="hover:text-black transition">
            <img className="h-6 w-6" src={Xsocialmedia} alt="X Icon" />
        </a>
        <a href="https://www.linkedin.com/company/luhive" target="_blank" rel="noopener noreferrer" className="hover:text-black transition">
            <img className="h-6 w-6" src={Linkedin} alt="LinkedIn Icon" />
        </a>
      </div>
    </footer>
  );
}
