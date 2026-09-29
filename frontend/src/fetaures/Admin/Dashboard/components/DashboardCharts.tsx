import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, EmptyState } from '../../../../components/ui';
import { format } from 'date-fns';
import type { Breakdown } from '../../../../types';

/** Shared chart palette so every chart on the dashboard reads as one system. */
export const CHART_COLORS = ['#2563eb', '#14b8a6', '#f59e0b', '#16a34a', '#8b5cf6', '#64748b'];

/** "2026-09" -> "Sep" for compact axis labels. */
export const monthLabel = (key: string) => {
  const [year, month] = key.split('-');
  return format(new Date(Number(year), Number(month) - 1, 1), 'MMM');
};

const withLabels = <T extends { month: string }>(rows: T[]) =>
  rows.map((row) => ({ ...row, label: monthLabel(row.month) }));

export function ChartCard({
  title,
  isEmpty,
  emptyMessage,
  children,
}: {
  title: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <p className="mb-2 text-sm font-semibold text-secondary">{title}</p>
      {isEmpty ? (
        <p className="py-10 text-center text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          {children}
        </ResponsiveContainer>
      )}
    </Card>
  );
}

/** Donut chart with a legend list underneath. */
export function BreakdownDonut({ rows }: { rows: Breakdown[] }) {
  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={rows.map((row) => ({ name: row.label, value: row.count }))}
            dataKey="value"
            nameKey="name"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
          >
            {rows.map((row, index) => (
              <Cell key={row.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 space-y-1">
        {rows.map((row, index) => (
          <li key={row.key} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-slate-600">{row.label}</span>
            <span className="font-medium text-slate-800">{row.count}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Horizontal bar chart, used for categorical breakdowns. */
export function BreakdownBars({ rows, color }: { rows: Breakdown[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
        <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip />
        <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, withLabels };
export { EmptyState };
