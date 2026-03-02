import { CostTrend } from './ui/CostTrend';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  data?: any;
  loading?: boolean;
}

export const Dashboard = ({}: DashboardProps) => {
  // Sample data for cost trend
  const costTrendData = {
    summary: {
      totalSpend: 4520.00,
      totalWaste: 890.00
    }
  };

  const resourcesData = [
    { id: 'ecs-28b2c-3c45f964', type: 'EBS Volume', cost: 45.00, region: 'us-east-1' },
    { id: 'rds-dfe097d5c52m', type: 'Elastic IP', cost: 45.00, region: 'us-east-1' },
    { id: 'smap-2nd-efs8gSq73kl', type: 'Snapshot', cost: 12.40, region: 'us-west-2' },
    { id: 'smap-3-efs8g6q73kl', type: 'EBS Volume', cost: 45.00, region: 'eu-west-1' },
    { id: 'vcp-0sfb0c30fe5fb', type: 'EBS Volume', cost: 45.00, region: 'us-east-1' }
  ];

  return (
    <main className="bg-[#13141b] min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stats Cards - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#1f2029] border border-[#242732] rounded-[20px] p-6">
            <p className="text-[#818ca2] text-[11px]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
              Total Monthly Spend
            </p>
            <h3 className="text-white text-[28px] font-bold mt-3" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>
              $4,520.00
            </h3>
            <p className="text-[#00CC44] text-[12px] mt-2" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 }}>
              +2.0% <span className="text-[#818ca2]">vs last month</span>
            </p>
          </div>

          <div className="bg-[#1f2029] border border-[#242732] rounded-[20px] p-6">
            <p className="text-[#818ca2] text-[11px]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
              Monthly Spend
            </p>
            <h3 className="text-white text-[28px] font-bold mt-3" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>
              $4,520.00
            </h3>
            <p className="text-[#00CC44] text-[12px] mt-2" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 }}>
              +2.0% <span className="text-[#818ca2]">vs last month</span>
            </p>
          </div>

          <div className="bg-[#1f2029] border border-[#242732] rounded-[20px] p-6">
            <p className="text-[#818ca2] text-[11px]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
              Wasted Resources
            </p>
            <h3 className="text-white text-[28px] font-bold mt-3" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>
              12
            </h3>
            <p className="text-[#FF5555] text-[12px] mt-2" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 }}>
              +12.5% <span className="text-[#818ca2]">vs last month</span>
            </p>
          </div>

          <div className="bg-[#1f2029] border border-[#242732] rounded-[20px] p-6">
            <p className="text-[#818ca2] text-[11px]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
              Security Level
            </p>
            <h3 className="text-white text-[28px] font-bold mt-3" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>
              92%
            </h3>
            <p className="text-[#00CC44] text-[12px] mt-2" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 }}>
              +5.2% <span className="text-[#818ca2]">vs last month</span>
            </p>
          </div>
        </div>

        {/* Cost Trend and Spend by Service */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cost Trend - 2 columns */}
          <div className="lg:col-span-2 bg-[#1f2029] border border-[#242732] rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white text-[16px] font-bold" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>
                  Cost Trend
                </h2>
                <p className="text-[#818ca2] text-[12px] mt-1" style={{ fontFamily: "'Albert Sans', sans-serif" }}>
                  Last 7 days spending analysis
                </p>
              </div>
              <span className="text-[#00CC44] text-[14px]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                +15.2%
              </span>
            </div>
            <CostTrend data={costTrendData} />
          </div>

          {/* Spend by Service - 1 column */}
          <div className="bg-[#1f2029] border border-[#242732] rounded-[20px] p-6">
            <h2 className="text-white text-[16px] font-bold mb-6" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>
              Spend by Service
            </h2>
            
            {/* Pie Chart */}
            <div style={{ width: '100%', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'EC2', value: 60, color: '#9966FF' },
                      { name: 'S3', value: 10, color: '#FF8400' },
                      { name: 'RDS', value: 25, color: '#4488FF' },
                      { name: 'Other', value: 5, color: '#818ca2' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={91}
                    paddingAngle={6}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                    stroke="#242732"
                    strokeWidth={2}
                  >
                    {[
                      { name: 'EC2', value: 60, color: '#9966FF' },
                      { name: 'S3', value: 10, color: '#FF8400' },
                      { name: 'RDS', value: 25, color: '#4488FF' },
                      { name: 'Other', value: 5, color: '#818ca2' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#242732',
                      border: '1px solid #242732',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(value) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="space-y-3 text-[12px] mt-6">
              {/* EC2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="6" width="16" height="12" rx="2" stroke="#9966FF" strokeWidth="2" fill="none"/>
                    <line x1="8" y1="10" x2="16" y2="10" stroke="#9966FF" strokeWidth="1.5"/>
                    <line x1="8" y1="14" x2="16" y2="14" stroke="#9966FF" strokeWidth="1.5"/>
                  </svg>
                  <span className="text-[#818ca2]">EC2</span>
                </div>
                <span className="text-white font-semibold">60%</span>
              </div>

              {/* S3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7L12 3L20 7V10H4V7Z" stroke="#FF8400" strokeWidth="2" fill="none"/>
                    <path d="M4 10L12 14L20 10" stroke="#FF8400" strokeWidth="2" fill="none"/>
                    <path d="M4 14L12 18L20 14" stroke="#FF8400" strokeWidth="2" fill="none"/>
                    <line x1="4" y1="17" x2="20" y2="21" stroke="#FF8400" strokeWidth="2"/>
                  </svg>
                  <span className="text-[#818ca2]">S3</span>
                </div>
                <span className="text-white font-semibold">10%</span>
              </div>

              {/* RDS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#4488FF" strokeWidth="2" fill="none"/>
                    <path d="M4 6V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V6" stroke="#4488FF" strokeWidth="2" fill="none"/>
                    <ellipse cx="12" cy="18" rx="8" ry="3" stroke="#4488FF" strokeWidth="1.5" fill="none"/>
                    <line x1="4" y1="12" x2="20" y2="12" stroke="#4488FF" strokeWidth="1.5" opacity="0.5"/>
                  </svg>
                  <span className="text-[#818ca2]">RDS</span>
                </div>
                <span className="text-white font-semibold">25%</span>
              </div>

              {/* Other */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="4" width="14" height="3" rx="1" stroke="#818ca2" strokeWidth="2" fill="none"/>
                    <rect x="5" y="9" width="14" height="3" rx="1" stroke="#818ca2" strokeWidth="2" fill="none"/>
                    <rect x="5" y="14" width="14" height="3" rx="1" stroke="#818ca2" strokeWidth="2" fill="none"/>
                  </svg>
                  <span className="text-[#818ca2]">Other</span>
                </div>
                <span className="text-white font-semibold">5%</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#242732]">
                <span className="text-[#818ca2]">Total</span>
                <span className="text-white font-bold">$2,870.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unused Resources Table */}
        <div className="bg-[#1f2029] border border-[#242732] rounded-[20px] p-6">
          <h2 className="text-white text-[16px] font-bold mb-6" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>
            Unused Resources
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#242732]">
                  <th className="text-left py-3 px-4 text-[#818ca2] font-semibold" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                    RESOURCE ID
                  </th>
                  <th className="text-left py-3 px-4 text-[#818ca2] font-semibold" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                    TYPE
                  </th>
                  <th className="text-left py-3 px-4 text-[#818ca2] font-semibold" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                    REGION
                  </th>
                  <th className="text-left py-3 px-4 text-[#818ca2] font-semibold" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                    COST
                  </th>
                  <th className="text-left py-3 px-4 text-[#818ca2] font-semibold" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {resourcesData.map((resource, idx) => (
                  <tr key={idx} className="border-b border-[#242732] hover:bg-[#242732]/50 transition">
                    <td className="py-3 px-4 text-[#1a85ff]" style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: '11px' }}>
                      {resource.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-[#9966FF]/20 text-[#9966FF] px-2 py-1 rounded text-[10px]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                        {resource.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#818ca2]" style={{ fontFamily: "'Albert Sans', sans-serif" }}>
                      {resource.region}
                    </td>
                    <td className="py-3 px-4 text-[#FF5555] font-semibold" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                      ${resource.cost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-[#818ca2] hover:text-[#FF5555] transition">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};
