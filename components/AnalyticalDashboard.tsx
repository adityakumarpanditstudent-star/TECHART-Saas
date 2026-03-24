'use client';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Activity, BarChart3, PieChart as PieChartIcon, 
  FileText, Lightbulb, CheckCircle2, AlertCircle, Download, Copy, Share2
} from 'lucide-react';

interface AnalyticalDashboardProps {
  data: {
    summary: string;
    insights: string[];
    metrics: { name: string; value: number }[];
    sentiments: { name: string; value: number }[];
    trends: { name: string; value: number }[];
    fileName: string;
  };
  onDownload: () => void;
  onCopy: () => void;
}

const COLORS = ['#22d3ee', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'];

export default function AnalyticalDashboard({ data, onDownload, onCopy }: AnalyticalDashboardProps) {
  return (
    <div id="dashboard-content" className="space-y-8 animate-fadeIn">
      {/* Overview Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
        <div className="relative backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Analytical Summary
            </h3>
            <div className="flex gap-2">
              <button onClick={onCopy} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-cyan-400">
                <Copy size={20} />
              </button>
              <button onClick={onDownload} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-purple-400">
                <Download size={20} />
              </button>
            </div>
          </div>
          <div className="text-slate-200 leading-relaxed text-lg mb-8 italic border-l-4 border-cyan-500/50 pl-6 whitespace-pre-wrap">
            {data.summary}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.metrics.map((metric, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <p className="text-slate-400 text-sm mb-1">{metric.name}</p>
                <p className="text-2xl font-bold text-cyan-400">{metric.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Insights Section */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="text-yellow-400" />
            <h4 className="text-xl font-semibold text-slate-100">Deep Insights</h4>
          </div>
          <ul className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {data.insights.map((insight, i) => (
              <li key={i} className="flex gap-3 text-slate-300 group/item">
                <CheckCircle2 size={18} className="text-cyan-500 shrink-0 mt-1 group-hover/item:scale-110 transition-transform" />
                <span className="leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sentiment Analysis Chart */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <PieChartIcon className="text-purple-400" />
            <h4 className="text-xl font-semibold text-slate-100">Topic Distribution</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sentiments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.sentiments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.sentiments.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span>{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-cyan-400" />
            <h4 className="text-xl font-semibold text-slate-100">Analytical Trends</h4>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#22d3ee" fillOpacity={1} fill="url(#colorTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
