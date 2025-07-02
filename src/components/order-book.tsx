"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderBookEntry {
  price: string;
  quantity: number;
}

interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

interface Contract {
  contract_id: number;
  outcome: string;
  order_book: OrderBook;
}

interface OrderBookProps {
  contracts: Contract[];
}

export function OrderBook({ contracts }: OrderBookProps) {
  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatQuantity = (quantity: number) => {
    return quantity.toLocaleString();
  };

  const OrderBookTable = ({ orderBook, outcome }: { orderBook: OrderBook; outcome: string }) => (
    <div className="space-y-4">
      {/* Asks (Sell Orders) */}
      <div>
        <h4 className="text-sm font-medium text-red-600 mb-2">Asks (Sell)</h4>
        <div className="space-y-1">
          {orderBook.asks.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-2">No sell orders</div>
          ) : (
            orderBook.asks.slice(0, 10).map((ask, index) => (
              <div key={index} className="flex justify-between items-center bg-red-50 px-3 py-2 rounded text-sm">
                <span className="font-medium text-red-700">{formatPrice(ask.price)}</span>
                <span className="text-gray-600">{formatQuantity(ask.quantity)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Spread */}
      <div className="border-t border-b border-gray-200 py-2">
        <div className="text-center text-sm text-gray-500">
          {orderBook.bids.length > 0 && orderBook.asks.length > 0 ? (
            <>
              Spread: {formatPrice((parseFloat(orderBook.asks[0].price) - parseFloat(orderBook.bids[0].price)).toFixed(4))}
            </>
          ) : (
            "No spread available"
          )}
        </div>
      </div>

      {/* Bids (Buy Orders) */}
      <div>
        <h4 className="text-sm font-medium text-green-600 mb-2">Bids (Buy)</h4>
        <div className="space-y-1">
          {orderBook.bids.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-2">No buy orders</div>
          ) : (
            orderBook.bids.slice(0, 10).map((bid, index) => (
              <div key={index} className="flex justify-between items-center bg-green-50 px-3 py-2 rounded text-sm">
                <span className="font-medium text-green-700">{formatPrice(bid.price)}</span>
                <span className="text-gray-600">{formatQuantity(bid.quantity)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (contracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">No contracts available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Book</span>
          <div className="text-xs text-gray-500">Price | Quantity</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={contracts[0]?.outcome || "YES"}>
          <TabsList className="grid w-full grid-cols-2">
            {contracts.map((contract) => (
              <TabsTrigger key={contract.contract_id} value={contract.outcome}>
                {contract.outcome}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {contracts.map((contract) => (
            <TabsContent key={contract.contract_id} value={contract.outcome} className="mt-4">
              <OrderBookTable orderBook={contract.order_book} outcome={contract.outcome} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
} 