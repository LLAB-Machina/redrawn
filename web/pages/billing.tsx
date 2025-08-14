import { useState } from "react";
import {
  useGetV1BillingPricesQuery,
  usePostV1BillingCreateCheckoutSessionMutation,
} from "../src/services/genApi";

export default function Billing() {
  const {
    data: prices,
    isLoading,
    error,
  } = useGetV1BillingPricesQuery(undefined);
  const [createCheckout] = usePostV1BillingCreateCheckoutSessionMutation();
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");

  async function startCheckout(priceId: string) {
    if (!priceId) {
      alert("Please select a price option");
      return;
    }

    try {
      const data = await createCheckout({
        createCheckoutSessionRequest: { price_id: priceId },
      }).unwrap();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(JSON.stringify(data));
      }
    } catch (e: any) {
      alert(String(e));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Buy credits</h2>
          <p className="text-neutral-600">Loading pricing options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Buy credits</h2>
          <p className="text-red-600">
            Error loading prices. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!prices || prices.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Buy credits</h2>
          <p className="text-neutral-600">
            No pricing options available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Buy credits</h2>
        <p className="text-neutral-600">
          Purchase credit packs for image generation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prices.map((price) => (
          <div
            key={price.id ?? "unknown"}
            className={`card p-6 border-2 transition-colors cursor-pointer ${
              selectedPriceId === (price.id ?? "")
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => price.id && setSelectedPriceId(price.id)}
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {price.name ?? "Untitled"}
                </h3>
                <p className="text-sm text-neutral-600">
                  {price.credits ?? 0} credits
                </p>
              </div>

              <button
                className={`btn w-full ${
                  selectedPriceId === (price.id ?? "")
                    ? "btn-primary"
                    : "btn-secondary"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (price.id) startCheckout(price.id);
                }}
              >
                {selectedPriceId === (price.id ?? "") ? "Buy Now" : "Select"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPriceId && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            Selected:{" "}
            {prices.find((p) => (p.id ?? "") === selectedPriceId)?.name ??
              "Untitled"}
            (
            {prices.find((p) => (p.id ?? "") === selectedPriceId)?.credits ?? 0}{" "}
            credits)
          </p>
        </div>
      )}
    </div>
  );
}
