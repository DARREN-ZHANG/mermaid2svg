// Mermaid 示例图库 —— 每个 MVP 图类型一条，源文本取自已通过的 YAML 测试
// 元组结构: [diagramType, displayName, mermaidSource]
const flowchart = "graph TD\n" + "A[Start] --> B[Process] --> C[End]",
  sequence = "sequenceDiagram\n" + "Alice->>Bob: Hello\n" + "Bob-->>Alice: Hi",
  classDiagram =
    "classDiagram\n" +
    "class Animal {\n" +
    "  +String name\n" +
    "  +int age\n" +
    "  +eat() void\n" +
    "  +sleep() void\n" +
    "}",
  stateDiagram =
    "stateDiagram-v2\n" +
    "[*] --> Idle\n" +
    "Idle --> Running : start\n" +
    "Running --> [*] : stop",
  erDiagram = "erDiagram\n" + "CUSTOMER ||--o{ ORDER : places",
  pie = "pie\n" + '  title "Pets"\n' + '  "Dogs" : 10\n' + '  "Cats" : 5',
  gantt =
    "gantt\n" +
    "  dateFormat  YYYY-MM-DD\n" +
    "  title Adding GANTT diagram to mermaid\n" +
    "  section A section\n" +
    "  Completed task            :done,    des1, 2014-01-06,2014-01-08\n" +
    "  Active task               :active,  des2, 2014-01-09, 3d",
  xychart =
    "xychart-beta\n" +
    'title "Product Sales"\n' +
    "x-axis [Widgets, Gadgets, Gizmos, Doodads, Thingamajigs]\n" +
    "bar [150, 230, 180, 95, 310]",
  flowchartApproval =
    "graph TD\n" +
    "subgraph 申请人\n" +
    "  A[提交订单] --> B{经理审批}\n" +
    "end\n" +
    "subgraph 审批人\n" +
    "  B -->|通过| C[审核通过]\n" +
    "  B -->|拒绝| D[退回修改]\n" +
    "end\n" +
    "subgraph 系统\n" +
    "  C --> E[生成订单]\n" +
    "  D --> A\n" +
    "end",
  flowchartCicd =
    "graph TD\n" +
    "subgraph Dev\n" +
    "  A[提交代码] --> B[推送分支]\n" +
    "end\n" +
    "subgraph CI\n" +
    "  B --> C[Lint 检查]\n" +
    "  C --> D[单元测试]\n" +
    "  D --> E[构建镜像]\n" +
    "end\n" +
    "subgraph CD\n" +
    "  E --> F[部署测试环境]\n" +
    "  F --> G{验收测试}\n" +
    "  G -->|通过| H[部署生产]\n" +
    "  G -->|失败| I[回滚]\n" +
    "end\n" +
    "subgraph Monitor\n" +
    "  H --> J[监控告警]\n" +
    "  I --> J\n" +
    "end\n" +
    "classDef critical fill:#ff4444,stroke:#333,stroke-width:2px,color:#fff\n" +
    "classDef success fill:#44aa44,stroke:#333,stroke-width:2px,color:#fff\n" +
    "class E,H critical\n" +
    "class C,D,F success\n" +
    "linkStyle 7 stroke:#ff4444,stroke-width:3px\n" +
    "linkStyle 8 stroke:#44aa44,stroke-width:3px";

export default [
  ["flowchart", "Start Process", flowchart],
  ["flowchart", "Order Approval", flowchartApproval],
  ["flowchart", "CI/CD Pipeline", flowchartCicd],
  ["sequenceDiagram", "Greeting", sequence],
  ["classDiagram", "Animal Class", classDiagram],
  ["stateDiagram-v2", "Basic States", stateDiagram],
  ["erDiagram", "Customer-Order", erDiagram],
  ["pie", "Pets", pie],
  ["gantt", "Simple Tasks", gantt],
  ["xychart-beta", "Product Sales", xychart],
];
