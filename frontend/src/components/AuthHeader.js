import { useNavigate } from "react-router-dom";
import MintSlip from '../assests/mintslip-logo.png';

export default function AuthHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-center">
          <img 
            src={MintSlip}
            alt="MintSlip"
            className="cursor-pointer" 
            style={{ height: '40px', width: 'auto' }}
            onClick={() => navigate("/")}
          />
        </div>
      </div>
    </header>
  );
}
