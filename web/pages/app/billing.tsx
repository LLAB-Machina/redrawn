import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetV1BillingPricesQuery, usePostV1BillingCreateCheckoutSessionMutation } from "@/services/genApi";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, Coins, Zap, Check } from "lucide-react";
import { useState } from "react";

export default function BillingPage() {
  const { user } = useAuth();
  const { data: prices, isLoading: pricesLoading } = useGetV1BillingPricesQuery({});
  const [createCheckoutSession, { isLoading: checkoutLoading }] = usePostV1BillingCreateCheckoutSessionMutation();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handlePurchase = async (priceId: string) => {
    try {
      setLoadingPriceId(priceId);
      const result = await createCheckoutSession({
        createCheckoutSessionRequest: { price_id: priceId }
      }).unwrap();
      
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
            <p className="text-muted-foreground">Manage your credits and billing</p>
          </div>
        </div>

        {/* Current Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="h-5 w-5 mr-2 text-primary" />
              Current Balance
            </CardTitle>
            <CardDescription>
              Your available credits for AI photo generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-primary">
                {user?.credits || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                credits remaining
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Each credit allows you to generate one AI-styled photo from your originals.
            </p>
          </CardContent>
        </Card>

        {/* Purchase Credits */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Purchase Credits</h2>
          
          {pricesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !prices || prices.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No pricing plans available</h3>
                    <p className="text-muted-foreground">Check back later for credit packages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prices.map((price, index) => (
                <Card key={price.id} className="relative hover:shadow-md transition-shadow">
                  {index === 1 && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Zap className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{price.name}</CardTitle>
                    <CardDescription>Get {price.credits} credits</CardDescription>
                    <div className="text-3xl font-bold text-primary">
                      ${price.credits ? (price.credits * 0.10).toFixed(2) : '0.00'}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">{price.credits} credits</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">Generate {price.credits} AI photos</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">No expiration</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handlePurchase(price.id || '')}
                      disabled={checkoutLoading || loadingPriceId === price.id}
                      variant={index === 1 ? "default" : "outline"}
                    >
                      {loadingPriceId === price.id ? (
                        "Processing..."
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Purchase Credits
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Billing Info */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>
              Secure payments powered by Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span>Credit/Debit Card</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security</span>
                <span>256-bit SSL encryption</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refund Policy</span>
                <span>Contact support for assistance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
