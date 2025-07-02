"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface PricePoint {
  timestamp: string;
  price: number;
  volume: number;
}

interface ContractData {
  contract_id: number;
  title: string;
  description?: string;
  price_history: PricePoint[];
}

interface PriceChartProps {
  contracts: ContractData[];
  selectedContract?: ContractData | null;
}

// Color palette for different contract lines
const COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export function PriceChart({ contracts, selectedContract }: PriceChartProps) {
  // Combine all price data into a single timeline
  const combinedData = React.useMemo(() => {
    const allTimestamps = new Set<string>();
    const contractsWithData = contracts.filter(contract => contract.price_history.length > 0);
    
    // Collect all unique timestamps
    contractsWithData.forEach(contract => {
      contract.price_history.forEach(point => {
        allTimestamps.add(point.timestamp);
      });
    });
    
    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();
    
    // Create data points for each timestamp
    const chartData = sortedTimestamps.map(timestamp => {
      const dataPoint: any = {
        timestamp,
        formattedTime: format(new Date(timestamp), 'MMM dd HH:mm'),
      };
      
      contractsWithData.forEach(contract => {
        // Find the most recent price for this contract at this timestamp
        const relevantPrices = contract.price_history.filter(
          point => point.timestamp <= timestamp
        );
        
        if (relevantPrices.length > 0) {
          const latestPrice = relevantPrices[relevantPrices.length - 1];
          dataPoint[`contract_${contract.contract_id}`] = latestPrice.price;
        }
      });
      
      return dataPoint;
    });
    
    return { chartData, contractsWithData };
  }, [contracts]);

  const { chartData, contractsWithData } = combinedData;

  const formatTooltip = (value: any, name: string, props: any) => {
    const contractId = name.replace('contract_', '');
    const contract = contractsWithData.find(c => c.contract_id.toString() === contractId);
    const contractTitle = contract?.title || `Contract ${contractId}`;
    
    return [
      `${(value * 100).toFixed(1)}¢`,
      contractTitle
    ];
  };

  const formatYAxisTick = (value: number) => {
    return `${(value * 100).toFixed(0)}¢`;
  };

  const formatXAxisTick = (value: string) => {
    return format(new Date(value), 'MMM dd');
  };

  if (contractsWithData.length === 0) {
    return (
      <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center text-gray-500">
          <div className="w-10 h-10 mx-auto mb-2 text-gray-400">📈</div>
          <p className="font-medium">No Price Data Available</p>
          <p className="text-sm">Prices will appear here after trading begins</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatXAxisTick}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 1]}
            tickFormatter={formatYAxisTick}
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy HH:mm')}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend 
            formatter={(value, entry) => {
              const contractId = value.replace('contract_', '');
              const contract = contractsWithData.find(c => c.contract_id.toString() === contractId);
              return contract?.title || `Contract ${contractId}`;
            }}
          />
          
          {contractsWithData.map((contract, index) => {
            const isSelected = selectedContract?.contract_id === contract.contract_id;
            const color = COLORS[index % COLORS.length];
            
            return (
              <Line
                key={contract.contract_id}
                type="stepAfter"
                dataKey={`contract_${contract.contract_id}`}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
                dot={false}
                connectNulls={false}
                opacity={selectedContract && !isSelected ? 0.3 : 1}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 