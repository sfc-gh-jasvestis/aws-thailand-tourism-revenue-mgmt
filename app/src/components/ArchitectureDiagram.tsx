'use client';

export function ArchitectureDiagram() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Solution Architecture</h3>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 860 320" className="w-full min-w-[650px]" xmlns="http://www.w3.org/2000/svg">
          {/* Background layers */}
          <rect x="10" y="10" width="240" height="300" rx="8" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
          <rect x="270" y="10" width="320" height="300" rx="8" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
          <rect x="610" y="10" width="240" height="300" rx="8" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1.5" />

          {/* Layer labels */}
          <text x="130" y="32" textAnchor="middle" fill="#9A3412" fontSize="10" fontWeight="600">AWS</text>
          <text x="430" y="32" textAnchor="middle" fill="#1E40AF" fontSize="10" fontWeight="600">SNOWFLAKE</text>
          <text x="730" y="32" textAnchor="middle" fill="#166534" fontSize="10" fontWeight="600">CONSUMERS</text>

          {/* AWS boxes - simplified to 4 */}
          <rect x="25" y="48" width="210" height="36" rx="4" fill="#FF9900" fillOpacity="0.15" stroke="#FF9900" strokeWidth="1" />
          <text x="130" y="71" textAnchor="middle" fill="#7C2D12" fontSize="10" fontWeight="500">Kinesis (OTA Rate Feeds)</text>

          <rect x="25" y="96" width="210" height="36" rx="4" fill="#FF9900" fillOpacity="0.15" stroke="#FF9900" strokeWidth="1" />
          <text x="130" y="119" textAnchor="middle" fill="#7C2D12" fontSize="10" fontWeight="500">S3 (Demand Signals)</text>

          <rect x="25" y="144" width="210" height="36" rx="4" fill="#FF9900" fillOpacity="0.15" stroke="#FF9900" strokeWidth="1" />
          <text x="130" y="167" textAnchor="middle" fill="#7C2D12" fontSize="10" fontWeight="500">Bedrock (Strategy Docs)</text>

          <rect x="25" y="192" width="210" height="36" rx="4" fill="#FF9900" fillOpacity="0.15" stroke="#FF9900" strokeWidth="1" />
          <text x="130" y="215" textAnchor="middle" fill="#7C2D12" fontSize="10" fontWeight="500">EventBridge (Rate Push)</text>

          <rect x="25" y="240" width="210" height="36" rx="4" fill="#FF9900" fillOpacity="0.15" stroke="#FF9900" strokeWidth="1" />
          <text x="130" y="263" textAnchor="middle" fill="#7C2D12" fontSize="10" fontWeight="500">QuickSight + Q</text>

          {/* Snowflake - organized in clear pipeline */}
          {/* Ingest layer */}
          <rect x="290" y="48" width="280" height="30" rx="4" fill="#29B5E8" fillOpacity="0.12" stroke="#29B5E8" strokeWidth="1" />
          <text x="430" y="68" textAnchor="middle" fill="#0C4A6E" fontSize="10" fontWeight="500">Snowpipe Streaming → RAW → Dynamic Tables</text>

          {/* ML layer */}
          <rect x="290" y="90" width="135" height="30" rx="4" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1" />
          <text x="357" y="109" textAnchor="middle" fill="#065F46" fontSize="9" fontWeight="500">ML.FORECAST</text>
          <rect x="435" y="90" width="135" height="30" rx="4" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1" />
          <text x="502" y="109" textAnchor="middle" fill="#065F46" fontSize="9" fontWeight="500">ML.ANOMALY</text>

          {/* AI layer */}
          <rect x="290" y="132" width="280" height="30" rx="4" fill="#8B5CF6" fillOpacity="0.12" stroke="#8B5CF6" strokeWidth="1" />
          <text x="430" y="152" textAnchor="middle" fill="#4C1D95" fontSize="10" fontWeight="500">Cortex Search + Complete (Native AI)</text>

          {/* Agent layer */}
          <rect x="290" y="174" width="280" height="30" rx="4" fill="#8B5CF6" fillOpacity="0.18" stroke="#8B5CF6" strokeWidth="1.5" />
          <text x="430" y="194" textAnchor="middle" fill="#4C1D95" fontSize="10" fontWeight="600">Cortex Agent (Revenue Intelligence)</text>

          {/* Semantic View */}
          <rect x="290" y="216" width="280" height="30" rx="4" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1" />
          <text x="430" y="236" textAnchor="middle" fill="#78350F" fontSize="10" fontWeight="500">Semantic View + Analyst</text>

          {/* Task DAG */}
          <rect x="290" y="258" width="280" height="30" rx="4" fill="#29B5E8" fillOpacity="0.12" stroke="#29B5E8" strokeWidth="1" />
          <text x="430" y="278" textAnchor="middle" fill="#0C4A6E" fontSize="10" fontWeight="500">Alerts + Task DAG (Rate Push Automation)</text>

          {/* Consumption */}
          <rect x="625" y="48" width="210" height="44" rx="5" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.5" />
          <text x="730" y="67" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="600">React App (SPCS)</text>
          <text x="730" y="81" textAnchor="middle" fill="#065F46" fontSize="8">Dashboard + AI Chat</text>

          <rect x="625" y="104" width="210" height="36" rx="5" fill="#10B981" fillOpacity="0.08" stroke="#10B981" strokeWidth="1" />
          <text x="730" y="126" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="500">Snowflake Intelligence</text>

          <rect x="625" y="152" width="210" height="36" rx="5" fill="#10B981" fillOpacity="0.08" stroke="#10B981" strokeWidth="1" />
          <text x="730" y="174" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="500">Revenue Manager</text>

          <rect x="625" y="200" width="210" height="36" rx="5" fill="#FF9900" fillOpacity="0.1" stroke="#FF9900" strokeWidth="1" />
          <text x="730" y="222" textAnchor="middle" fill="#7C2D12" fontSize="10" fontWeight="500">QuickSight + Q</text>

          <rect x="625" y="248" width="210" height="36" rx="5" fill="#10B981" fillOpacity="0.08" stroke="#10B981" strokeWidth="1" />
          <text x="730" y="270" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="500">Channel Manager</text>

          {/* Arrows */}
          <defs>
            <marker id="arr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
              <polygon points="0 0, 7 2.5, 0 5" fill="#64748B" />
            </marker>
          </defs>

          {/* AWS → Snowflake */}
          <line x1="235" y1="66" x2="288" y2="63" stroke="#64748B" strokeWidth="1.2" markerEnd="url(#arr)" />
          <line x1="235" y1="114" x2="288" y2="63" stroke="#64748B" strokeWidth="1.2" markerEnd="url(#arr)" />
          <line x1="235" y1="162" x2="288" y2="147" stroke="#64748B" strokeWidth="1" markerEnd="url(#arr)" strokeDasharray="3 2" opacity="0.6" />
          <line x1="235" y1="210" x2="288" y2="273" stroke="#64748B" strokeWidth="1" markerEnd="url(#arr)" strokeDasharray="3 2" opacity="0.6" />

          {/* Snowflake → Consumption */}
          <line x1="570" y1="63" x2="623" y2="66" stroke="#64748B" strokeWidth="1.2" markerEnd="url(#arr)" />
          <line x1="570" y1="189" x2="623" y2="122" stroke="#64748B" strokeWidth="1.2" markerEnd="url(#arr)" />
          <line x1="570" y1="231" x2="623" y2="215" stroke="#64748B" strokeWidth="1" markerEnd="url(#arr)" strokeDasharray="3 2" opacity="0.6" />
          <line x1="570" y1="273" x2="623" y2="266" stroke="#64748B" strokeWidth="1.2" markerEnd="url(#arr)" />

          {/* Internal vertical flow */}
          <line x1="430" y1="78" x2="430" y2="90" stroke="#29B5E8" strokeWidth="1" />
          <line x1="430" y1="120" x2="430" y2="132" stroke="#29B5E8" strokeWidth="1" />
          <line x1="430" y1="162" x2="430" y2="174" stroke="#29B5E8" strokeWidth="1" />
          <line x1="430" y1="204" x2="430" y2="216" stroke="#29B5E8" strokeWidth="1" />
          <line x1="430" y1="246" x2="430" y2="258" stroke="#29B5E8" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}
