import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Gavel, 
  Wallet, 
  CreditCard, 
  AlertTriangle, 
  Mail, 
  MessageCircle,
  ShoppingCart,
  TrendingUp,
  Clock,
  Shield,
  Info
} from 'lucide-react';

const BiddingInfo = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Gavel className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">Bidding Process Guide</h1>
        <p className="text-xl text-muted-foreground">
          Everything you need to know about bidding on NAuction
        </p>
      </div>

      <div className="space-y-8">
        {/* Bidding and Buying */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="h-6 w-6 text-primary" />
              Bidding and Buying
            </CardTitle>
            <CardDescription>
              How to participate in auctions and place winning bids
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Balance Requirement
                </h3>
                <p className="text-muted-foreground">
                  You must have at least <strong>20% of the current bid price</strong> of an item 
                  as your account balance before you are able to bid on that item.
                </p>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Example:</strong> If the current bid is ₦10,000, you need at least 
                    ₦2,000 in your account balance to place a bid.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Payment Consequences
                </h3>
                <p className="text-muted-foreground">
                  If you win a bid and are not able to pay the remaining <strong>80%</strong>, 
                  you will forfeit <strong>10% of the final bid amount</strong>. This will be 
                  subtracted from your account balance.
                </p>
                <Badge variant="destructive" className="text-sm">
                  Payment Default Penalty: 10% of final bid
                </Badge>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Winning Notification
              </h3>
              <p className="text-muted-foreground">
                If you have the winning bid, you will be alerted by email or WhatsApp with 
                next steps for making payment and picking up the items.
              </p>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Buy It Now Option
              </h3>
              <p className="text-muted-foreground">
                Where available, you can use the <strong>"Buy It Now"</strong> price to 
                purchase an item immediately, ending the auction instantly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="h-6 w-6 text-primary" />
              Account Balance
            </CardTitle>
            <CardDescription>
              Managing your account balance for bidding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Balance Requirements</h3>
              <p className="text-muted-foreground">
                Before bidding on items, you must have an account balance that is equal to 
                at least <strong>20% of the current price</strong> of the item that you intend to bid on.
              </p>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">How to Add Money</h3>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  To top up your account, you have several options:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Bank Transfer</h4>
                      <p className="text-sm text-muted-foreground">
                        Transfer the amount to our bank account and send a receipt 
                        of the transfer to our WhatsApp line or via email for validation.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Contact Admin</h4>
                      <p className="text-sm text-muted-foreground">
                        Use the "Add Money to My Balance" button in your profile 
                        or contact our support team directly.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Contact Information:</strong><br />
                Email: support@nauction.com<br />
                WhatsApp: +234 (0) 123 456 7890<br />
                Phone: +234 (0) 123 456 7890
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Auto-Bidding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Clock className="h-6 w-6 text-primary" />
              Auto-Bidding Feature
            </CardTitle>
            <CardDescription>
              Set maximum bid amounts for automatic bidding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">How Auto-Bidding Works</h3>
              <p className="text-muted-foreground">
                You can set a maximum bid amount for an auction. Our system will automatically 
                place bids on your behalf up to your maximum amount, ensuring you stay competitive 
                without constantly monitoring the auction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Benefits</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Never miss a bid due to timing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Stay competitive automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Set your maximum and relax</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Cancel or modify anytime</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Requirements</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Must have 20% of max bid amount in balance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Maximum bid must exceed current price</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Can be cancelled before auction ends</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Reminders */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-orange-700">
              <Shield className="h-6 w-6" />
              Important Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Balance Hold:</strong> When you place a bid, 20% of the bid amount 
                  is temporarily held from your balance until the auction ends.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Payment Deadline:</strong> Winners have a limited time to complete 
                  payment. Failure to pay results in penalties and potential account restrictions.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Reserve Prices:</strong> Some auctions have reserve prices. 
                  If the reserve isn't met, the item won't be sold.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Bid Increments:</strong> Each auction has minimum bid increments 
                  set by the administrator. You cannot bid below these increments.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MessageCircle className="h-6 w-6 text-primary" />
              Need Help?
            </CardTitle>
            <CardDescription>
              Our support team is here to assist you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <Mail className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@nauction.com</p>
              </div>
              
              <div className="space-y-2">
                <MessageCircle className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">+234 (0) 123 456 7890</p>
              </div>
              
              <div className="space-y-2">
                <Clock className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">Support Hours</h3>
                <p className="text-sm text-muted-foreground">24/7 Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BiddingInfo;

