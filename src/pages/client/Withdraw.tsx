import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';

const Withdraw = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState('Bitcoin');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchBalance();
    }
  }, [user, authLoading, navigate]);

  const fetchBalance = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (data) {
      setAvailableBalance(data.balance || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (amount < 10) {
      toast.error('Minimum withdrawal is $10');
      return;
    }

    if (amount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'withdrawal',
        amount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_details: { details: paymentDetails },
        notes,
      });

      if (error) throw error;

      toast.success('Withdrawal request submitted! Awaiting admin approval.');
      navigate('/client/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/client/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back main to Dashboard
        </Button>

        <Card className="border-warning/30 shadow-[0_0_40px_rgba(255,167,38,0.15)]">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-warning/20">
                <ArrowUpCircle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <CardTitle className="text-2xl">Withdraw Funds</CardTitle>
                <CardDescription>Request a withdrawal from your account</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Available Balance */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
                <div className="text-2xl font-bold text-foreground">
                  ${availableBalance.toFixed(2)}
                </div>
              </div>

              {/* Amount Slider */}
              <div className="space-y-4">
                <Label>Withdrawal Amount</Label>
                <div className="text-center">
                  <div className="text-5xl font-bold text-warning mb-2">
                    ${amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Min: $5000 • Max: ${availableBalance.toFixed(2)}
                  </div>
                </div>
                <Slider
                  value={[amount]}
                  onValueChange={([value]) => setAmount(value)}
                  min={10}
                  max={Math.max(10, availableBalance)}
                  step={10}
                  className="my-6"
                  disabled={availableBalance < 10}
                />
                <div className="flex gap-2">
                  {[
                    Math.min(100, availableBalance),
                    Math.min(500, availableBalance),
                    Math.min(1000, availableBalance),
                    availableBalance
                  ]
                    .filter((v, i, a) => v >= 10 && a.indexOf(v) === i)
                    .map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(Math.floor(preset))}
                        className="flex-1"
                      >
                        ${Math.floor(preset)}
                      </Button>
                    ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">Withdrawal Method</Label>
                <Input
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Bitcoin, Bank Transfer, etc."
                  required
                />
              </div>

              {/* Payment Details */}
              <div className="space-y-2">
                <Label htmlFor="payment-details">
                  Receiving Address/Account Details
                </Label>
                <Input
                  id="payment-details"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder="Enter your wallet address or account details"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Withdrawal Amount</span>
                  <span className="font-semibold">${amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining Balance</span>
                  <span className="font-semibold">
                    ${(availableBalance - amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Status</span>
                  <span>Pending approval after submission</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-warning hover:bg-warning/90 text-background"
                disabled={isSubmitting || availableBalance < 10}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Withdrawal Request'}
              </Button>

              {availableBalance < 10 && (
                <p className="text-sm text-center text-muted-foreground">
                  Insufficient balance for withdrawal
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Withdraw;
