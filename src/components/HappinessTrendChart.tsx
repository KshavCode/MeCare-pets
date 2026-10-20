import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Smile, Sparkles, X } from 'lucide-react';
import { DailyHappinessPoint } from '../types/game';
import { getUpdated7DayHappinessHistory } from '../utils/mobileBridge';

interface HappinessTrendChartProps {
  history?: DailyHappinessPoint[];
  currentHappiness: number;
  petName: string;
  createdAtIso?: string;
  compact?: boolean;
  onClose?: () => void;
}

export const HappinessTrendChart: React.FC<HappinessTrendChartProps> = ({
  history,
  currentHappiness,
  petName,
  createdAtIso,
  compact = false,
  onClose,
}) => {
  const data = getUpdated7DayHappinessHistory(
    history,
    currentHappiness,
    0,
    Date.now(),
    createdAtIso
  );
  const dayCount = data.length;
  const firstVal = data[0]?.happiness ?? currentHappiness;
  const lastVal = data[data.length - 1]?.happiness ?? currentHappiness;
  const delta = dayCount > 1 ? lastVal - firstVal : 0;
  const totalInteractions = data.reduce(
    (sum, pt) => sum + (pt.interactions || 0),
    0
  );

  return (
    <div
      className={`bg-white pixel-box ${
        compact ? 'p-3 w-72 sm:w-80' : 'p-4 w-full'
      } text-slate-900 select-none`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Smile className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-display text-[10px] sm:text-xs text-slate-900">
            {dayCount === 1 ? 'PET MOOD (DAY 1)' : `${dayCount}-DAY MOOD TREND`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chart"
              className="w-6 h-6 bg-slate-100 hover:bg-rose-100 text-slate-700 border border-[#3B4254] flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recharts Area Visualization or Day 1 Journey Card */}
      {dayCount === 1 ? (
        <div className="py-3 px-3.5 bg-[#FAF6F0] pixel-box-sm flex flex-col justify-center items-center text-center space-y-1 my-1">
          <div className="font-display text-sm text-amber-700">
            {currentHappiness}% HAPPINESS
          </div>
          <div className="font-pixel text-base text-slate-700 font-bold">
            Day 1 Journey • {totalInteractions} Interactions Today
          </div>
          <p className="font-pixel text-sm text-slate-500">
            7-day mood trend graph tracks here as you complete daily quests!
          </p>
        </div>
      ) : (
        <div className={compact ? 'h-28 w-full' : 'h-36 w-full'}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 6, right: 6, left: -26, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11, fill: '#334155', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
                axisLine={{ stroke: '#3B4254' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                tick={{ fontSize: 10, fill: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
                axisLine={{ stroke: '#3B4254' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFBEB',
                  border: '2px solid #3B4254',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  boxShadow: '2px 2px 0px rgba(59,66,84,0.2)',
                }}
                formatter={(value: unknown, _name: unknown, item: { payload?: DailyHappinessPoint }) => [
                  `${Number(value ?? 0)}% (${item?.payload?.interactions ?? 0} interactions)`,
                  `${petName} Mood`,
                ]}
              />
              <Area
                type="monotone"
                dataKey="happiness"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="#FDE68A"
                fillOpacity={0.65}
                dot={{ r: 4, fill: '#F59E0B', stroke: '#78350F', strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
