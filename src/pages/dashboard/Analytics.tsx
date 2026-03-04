import { analyticsData } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";

const tooltipStyle = { borderRadius: 8, border: "1px solid hsl(220, 13%, 91%)", fontSize: 13 };

const Analytics = () => {
  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm">Deep insights into your customer growth and engagement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Return Rate */}
        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">Customer Return Rate</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analyticsData.returnRate}>
              <defs>
                <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="rate" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#colorReturn)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Review Generation */}
        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Google Review Generation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analyticsData.reviewGeneration}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="reviews" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Performance */}
        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Campaign Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analyticsData.campaignPerformance}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sent" fill="hsl(220, 15%, 13%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="opened" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-foreground" /><span className="text-xs text-muted-foreground">Sent</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Opened</span></div>
          </div>
        </div>

        {/* Visit Trends */}
        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Visit Trends (Weekly)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analyticsData.visitTrends}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="visits" stroke="hsl(220, 15%, 13%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(220, 15%, 13%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
