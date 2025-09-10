import { AppLayout } from "@/components/layouts/AppLayout";
import {
  useGetV1AdminPricesQuery,
  usePostV1AdminPricesMutation,
  useDeleteV1AdminPricesByIdMutation,
  usePutV1AdminPricesByIdMutation,
} from "@/services/genApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function AdminPricesPage() {
  const { data, refetch } = useGetV1AdminPricesQuery({});
  const [createPrice] = usePostV1AdminPricesMutation();
  const [updatePrice] = usePutV1AdminPricesByIdMutation();
  const [deletePrice] = useDeleteV1AdminPricesByIdMutation();

  const [name, setName] = useState("");
  const [credits, setCredits] = useState<number>(10);
  const [stripePriceId, setStripePriceId] = useState("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPrice({
      createPriceRequest: {
        name,
        credits,
        stripe_price_id: stripePriceId,
        active: true,
      },
    }).unwrap();
    setName("");
    setCredits(10);
    setStripePriceId("");
    refetch();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Price</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid md:grid-cols-4 gap-4 items-end"
              onSubmit={onCreate}
            >
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  value={credits}
                  onChange={(e) => setCredits(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="spi">Stripe Price ID</Label>
                <Input
                  id="spi"
                  value={stripePriceId}
                  onChange={(e) => setStripePriceId(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {(data ?? []).map((p) => (
                <div key={p.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {p.credits} credits • {p.stripe_price_id}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await updatePrice({
                        id: p.id!,
                        updatePriceRequest: {
                          name: p.name,
                          credits: p.credits,
                          stripe_price_id: p.stripe_price_id,
                          active: !p.active,
                        },
                      }).unwrap();
                      refetch();
                    }}
                  >
                    {p.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await deletePrice({ id: p.id! }).unwrap();
                      refetch();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
