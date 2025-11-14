import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, Wallet, LogOut, DollarSign, BarChart3 } from 'lucide-react';
import { ProfitHistoryChart } from '@/components/charts/ProfitHistoryChart';
import { PortfolioDistributionChart } from '@/components/charts/PortfolioDistributionChart';
import { DailyReturnsChart } from '@/components/charts/DailyReturnsChart';
import { PerformanceMetricsChart } from '@/components/charts/PerformanceMetricsChart';
import type { DailyProfit, Subscription, Transaction } from '@/utils/chartDataProcessing';

const ClientDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dailyProfits, setDailyProfits] = useState<DailyProfit[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Fetch active subscriptions
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('*, trading_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setSubscriptions(subsData || []);

      // Fetch recent transactions
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentTransactions(transData || []);

      // Fetch all transactions for charts
      const { data: allTransData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setAllTransactions(allTransData || []);

      // Fetch daily profits for charts
      const { data: profitsData } = await supabase
        .from('daily_profits')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      setDailyProfits(profitsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/20 text-warning border-warning/50',
    approved: 'bg-success/20 text-success border-success/50',
    rejected: 'bg-danger/20 text-danger border-danger/50',
    completed: 'bg-success/20 text-success border-success/50',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">WIN-TRADE-INVEST</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Welcome back investor</div>
              <div className="font-semibold">{profile?.full_name || user?.email}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/50 shadow-[0_0_30px_rgba(139,195,74,0.2)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${profile?.balance?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                ${profile?.total_invested?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-success/50 shadow-[0_0_20px_rgba(139,195,74,0.15)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                ${profile?.total_profit?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => navigate('/client/deposit')}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            <ArrowDownCircle className="h-5 w-5" />
            Deposit Funds
          </Button>
          <Button
            onClick={() => navigate('/client/withdraw')}
            variant="outline"
            className="gap-2"
          >
            <ArrowUpCircle className="h-5 w-5" />
            Withdraw
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="gap-2"
          >
            <TrendingUp className="h-5 w-5" />
            View Trading Plans
          </Button>
        </div>

        {/* Profit History Chart - Full Width */}
        <Card className="border-primary/30 shadow-[0_0_30px_rgba(139,195,74,0.15)] animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Profit Growth Over Time
            </CardTitle>
            <CardDescription>Your cumulative profit journey</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitHistoryChart profits={dailyProfits} days={30} />
          </CardContent>
        </Card>

        {/* Charts Grid - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Distribution */}
          <Card className="border-secondary/30 shadow-[0_0_20px_rgba(77,182,172,0.15)] animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                Investment Distribution
              </CardTitle>
              <CardDescription>Your portfolio breakdown by plan</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioDistributionChart subscriptions={subscriptions} />
            </CardContent>
          </Card>

          {/* Daily Returns */}
          <Card className="border-success/30 shadow-[0_0_20px_rgba(139,195,74,0.15)] animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                Recent Daily Returns
              </CardTitle>
              <CardDescription>Last 7 days profit performance</CardDescription>
            </CardHeader>
            <CardContent>
              <DailyReturnsChart profits={dailyProfits} days={7} />
            </CardContent>
          </Card>
        </div>

        {/* Active Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Trading Plans</CardTitle>
            <CardDescription>Your current active subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/50"
                  >
                    <div>
                      <div className="font-semibold">{sub.trading_plans?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${sub.amount.toFixed(2)} • Earned: ${sub.total_earned.toFixed(2)}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active trading plans. Start investing today!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics Chart - Full Width */}
        <Card className="border-primary/30 shadow-[0_0_30px_rgba(139,195,74,0.15)] animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Performance Overview
            </CardTitle>
            <CardDescription>Track your deposits, investments, and profits</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceMetricsChart transactions={allTransactions} profits={dailyProfits} />
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border border-border/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {transaction.type === 'deposit' || transaction.type === 'profit' ? (
                        <ArrowDownCircle className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-warning" />
                      )}
                      <div>
                        <div className="font-medium capitalize">{transaction.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${transaction.amount.toFixed(2)}</div>
                      <Badge variant="outline" className={statusColors[transaction.status]}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
