import { Link } from 'react-router-dom';
import { Gavel, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Gavel className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">NAuction</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nigeria's premier online auction platform. Bid on unique items and discover great deals.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <div className="space-y-2">
              <Link 
                to="/" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/auctions" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Browse Auctions
              </Link>
              <Link 
                to="/bidding-info" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                How to Bid
              </Link>
              <Link 
                to="/register" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Join NAuction
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <div className="space-y-2">
              <Link 
                to="/bidding-info" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Bidding Guide
              </Link>
              <a 
                href="#" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                FAQ
              </a>
              <a 
                href="#" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </a>
              <a 
                href="#" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Contact Us</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@nauction.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+234 (0) 123 456 7890</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Lagos, Nigeria</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} NAuction. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Secure payments</span>
              <span>•</span>
              <span>Trusted platform</span>
              <span>•</span>
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

