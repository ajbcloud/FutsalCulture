import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { chartPalette } from '@/lib/ui/theme';

interface MiniSparklineProps {
  data: Array<{ date: string; value: number }>;
  color?: string;
  'data-testid'?: string;
}

export default function MiniSparkline({ 
  data, 
  color = chartPalette.primary,
  'data-testid': testId 
}: MiniSparklineProps) {
  if (!data || data.length === 0) return null;
  
  return (
    <div className="w-full h-full" data-testid={testId}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}