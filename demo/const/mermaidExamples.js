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
    "linkStyle 8 stroke:#44aa44,stroke-width:3px",
  sequenceRetry =
    "sequenceDiagram\n" +
    "participant C as Client\n" +
    "participant S as Server\n" +
    "Note over C,S: HTTP 请求重试\n" +
    "loop 最多 3 次重试\n" +
    "  C->>S: GET /api/data\n" +
    "  alt 成功\n" +
    "    S-->>C: 200 OK\n" +
    "  else 失败\n" +
    "    S-->>C: 500 Error\n" +
    "    Note over C: 等待 1s 后重试\n" +
    "  end\n" +
    "end\n" +
    "alt 全部失败\n" +
    "  C->>C: 触发降级\n" +
    "end",
  sequenceOauth =
    "sequenceDiagram\n" +
    "autonumber\n" +
    "participant U as User\n" +
    "participant C as Client\n" +
    "participant A as AuthServer\n" +
    "participant R as ResourceServer\n" +
    "rect rgb(240, 248, 255)\n" +
    "  Note over U,A: 1. 授权阶段\n" +
    "  U->>C: 点击登录\n" +
    "  activate C\n" +
    "  C->>A: 跳转授权页\n" +
    "  activate A\n" +
    "  A-->>U: 显示登录页\n" +
    "  U->>A: 输入凭证\n" +
    "  A-->>C: 返回授权码 code\n" +
    "  deactivate A\n" +
    "end\n" +
    "rect rgb(240, 255, 240)\n" +
    "  Note over C,R: 2. 换取令牌\n" +
    "  C->>A: code + client_secret\n" +
    "  activate A\n" +
    "  A-->>C: access_token\n" +
    "  deactivate A\n" +
    "  C->>R: 请求资源 + access_token\n" +
    "  activate R\n" +
    "  R-->>C: 返回用户数据\n" +
    "  deactivate R\n" +
    "  deactivate C\n" +
    "end",
  classHierarchy =
    "classDiagram\n" +
    "class Animal {\n" +
    "  +String name\n" +
    "  +int age\n" +
    "  +eat() void\n" +
    "  +sleep() void\n" +
    "}\n" +
    "class Dog {\n" +
    "  +String breed\n" +
    "  +bark() void\n" +
    "}\n" +
    "class Cat {\n" +
    "  +boolean indoor\n" +
    "  +meow() void\n" +
    "}\n" +
    "class Bird {\n" +
    "  +double wingspan\n" +
    "  +fly() void\n" +
    "}\n" +
    "Animal <|-- Dog\n" +
    "Animal <|-- Cat\n" +
    "Animal <|-- Bird",
  classStrategy =
    "classDiagram\n" +
    "class Strategy {\n" +
    "  <<interface>>\n" +
    "  +execute(int, int) int\n" +
    "}\n" +
    "class Context {\n" +
    "  -Strategy strategy\n" +
    "  +setStrategy(Strategy) void\n" +
    "  +executeStrategy(int, int) int\n" +
    "}\n" +
    "class AddStrategy {\n" +
    "  +execute(int, int) int\n" +
    "}\n" +
    "class SubStrategy {\n" +
    "  +execute(int, int) int\n" +
    "}\n" +
    "class MulStrategy {\n" +
    "  +execute(int, int) int\n" +
    "}\n" +
    "class LoggerFactory {\n" +
    "  <<abstract>>\n" +
    "  +log(String) void\n" +
    "}\n" +
    "note for Strategy \"策略接口：定义算法族\"\n" +
    "note for Context \"上下文：持有策略引用\"\n" +
    "Strategy <|.. AddStrategy\n" +
    "Strategy <|.. SubStrategy\n" +
    "Strategy <|.. MulStrategy\n" +
    "Context *-- Strategy : 组合\n" +
    "Context ..> LoggerFactory : 依赖",
  stateOrder =
    "stateDiagram-v2\n" +
    "[*] --> 待支付\n" +
    "待支付 --> 已支付 : 用户付款\n" +
    "待支付 --> 已取消 : 超时或用户取消\n" +
    "state 已支付 {\n" +
    "  [*] --> 待发货\n" +
    "  待发货 --> 已发货 : 商家发货\n" +
    "  已发货 --> 已签收 : 用户签收\n" +
    "}\n" +
    "已签收 --> 已完成 : 自动确认 7 天后\n" +
    "已取消 --> [*]\n" +
    "已完成 --> [*]\n" +
    "note right of 待支付 : 30 分钟未付款自动取消",
  stateElevator =
    "stateDiagram-v2\n" +
    "[*] --> 空闲\n" +
    "空闲 --> 接收指令 : 按钮按下\n" +
    "接收指令 --> fork_state\n" +
    "state fork_state <<fork>>\n" +
    "fork_state --> 上行 : 目标楼层在上\n" +
    "fork_state --> 下行 : 目标楼层在下\n" +
    "上行 --> 到达 : 到达目标\n" +
    "下行 --> 到达 : 到达目标\n" +
    "state 到达 {\n" +
    "  [*] --> 门打开\n" +
    "  门打开 --> 门保持\n" +
    "  门保持 --> 门关闭 : 5 秒后\n" +
    "  门关闭 --> [*]\n" +
    "}\n" +
    "state join_state <<join>>\n" +
    "到达 --> join_state\n" +
    "join_state --> 空闲\n" +
    "空闲 --> 报警 : 紧急按钮\n" +
    "报警 --> [*]\n" +
    "note right of 空闲 : 历史状态：电梯会记住上次方向",
  erEcommerce =
    "erDiagram\n" +
    "CUSTOMER ||--o{ ORDER : places\n" +
    "ORDER ||--|{ ORDER_ITEM : contains\n" +
    "ORDER_ITEM }|--|| PRODUCT : refers_to\n" +
    "PRODUCT }o--o{ CATEGORY : belongs_to\n" +
    "CUSTOMER {\n" +
    "  int id PK\n" +
    "  string name\n" +
    "  string email\n" +
    "}\n" +
    "ORDER {\n" +
    "  int id PK\n" +
    "  int customer_id FK\n" +
    "  datetime created_at\n" +
    "}\n" +
    "ORDER_ITEM {\n" +
    "  int id PK\n" +
    "  int order_id FK\n" +
    "  int product_id FK\n" +
    "  int quantity\n" +
    "}\n" +
    "PRODUCT {\n" +
    "  int id PK\n" +
    "  string name\n" +
    "  decimal price\n" +
    "}\n" +
    "CATEGORY {\n" +
    "  int id PK\n" +
    "  string name\n" +
    "}",
  erBanking =
    "erDiagram\n" +
    "CUSTOMER ||--o{ ACCOUNT : owns\n" +
    "ACCOUNT ||--o{ TRANSACTION : has\n" +
    "CUSTOMER ||--o{ CARD : has\n" +
    "ACCOUNT ||--o{ LOAN : secures\n" +
    "CARD }o--|| ACCOUNT : linked_to\n" +
    "CUSTOMER {\n" +
    "  int id PK\n" +
    "  string name UK\n" +
    "  string id_card UK\n" +
    "  string phone\n" +
    "  datetime created_at\n" +
    "}\n" +
    "ACCOUNT {\n" +
    "  string account_no PK\n" +
    "  int customer_id FK\n" +
    "  decimal balance\n" +
    "  string currency\n" +
    "  datetime opened_at\n" +
    "}\n" +
    "TRANSACTION {\n" +
    "  bigint id PK\n" +
    "  string from_account FK\n" +
    "  string to_account FK\n" +
    "  decimal amount\n" +
    "  datetime trans_at\n" +
    "}\n" +
    "CARD {\n" +
    "  string card_no PK\n" +
    "  int customer_id FK\n" +
    "  string account_no FK\n" +
    "  date expire_date\n" +
    "  string card_type\n" +
    "}\n" +
    "LOAN {\n" +
    "  bigint id PK\n" +
    "  string account_no FK\n" +
    "  decimal principal\n" +
    "  decimal rate\n" +
    "  int term_months\n" +
    "}",
  pieDevice =
    "pie title 设备流量分布 2024\n" +
    '"移动端" : 60\n' +
    '"桌面端" : 25\n' +
    '"平板" : 10\n' +
    '"其他" : 5',
  pieBrowser =
    '%%{init: {"themeVariables": {"pie1": "#FF6384", "pie2": "#36A2EB", "pie3": "#FFCE56", "pie4": "#4BC0C0", "pie5": "#9966FF", "pie6": "#FF9F40"}}%%\n' +
    "pie title 全球浏览器市场份额 2024 Q4 (StatCounter)\n" +
    '"Chrome" : 65\n' +
    '"Safari" : 18\n' +
    '"Edge" : 5\n' +
    '"Firefox" : 3\n' +
    '"Samsung Internet" : 2.5\n' +
    '"其他" : 6.5',
  ganttSoftware =
    "gantt\n" +
    "  title 软件开发项目甘特图\n" +
    "  dateFormat YYYY-MM-DD\n" +
    "  section 需求\n" +
    "  需求分析     :done,    req, 2024-01-01, 7d\n" +
    "  需求评审     :done,    req2, after req, 2d\n" +
    "  section 设计\n" +
    "  UI 设计      :active,  ui, 2024-01-10, 10d\n" +
    "  架构设计     :         arch, 2024-01-10, 7d\n" +
    "  section 开发\n" +
    "  前端开发     :         fe, after ui, 14d\n" +
    "  后端开发     :         be, after arch, 14d\n" +
    "  联调         :         int, after fe, 7d\n" +
    "  section 测试\n" +
    "  测试         :         test, after int, 7d\n" +
    "  上线         :milestone, mil, after test, 0d",
  ganttQuarterly =
    "gantt\n" +
    "  title 2024 Q1-Q2 跨季度项目\n" +
    "  dateFormat YYYY-MM-DD\n" +
    "  excludes weekends, 2024-01-01, 2024-02-10, 2024-02-12, 2024-04-04, 2024-05-01\n" +
    "  section Q1\n" +
    "  立项         :done, q1a, 2024-01-02, 5d\n" +
    "  调研         :done, q1b, after q1a, 10d\n" +
    "  原型开发     :crit, q1c, after q1b, 15d\n" +
    "  内部测试     :crit, q1d, after q1c, 5d\n" +
    "  section Q2\n" +
    "  公测         :q2a, after q1d, 14d\n" +
    "  Bug 修复     :crit, q2b, after q2a, 7d\n" +
    "  正式发布     :milestone, mil, after q2b, 0d\n" +
    "  运营推广     :q2c, after mil, 14d";

export default [
  ["flowchart", "Start Process", flowchart],
  ["flowchart", "Order Approval", flowchartApproval],
  ["flowchart", "CI/CD Pipeline", flowchartCicd],
  ["sequenceDiagram", "Greeting", sequence],
  ["sequenceDiagram", "Retry Mechanism", sequenceRetry],
  ["sequenceDiagram", "OAuth Flow", sequenceOauth],
  ["classDiagram", "Animal Class", classDiagram],
  ["classDiagram", "Animal Hierarchy", classHierarchy],
  ["classDiagram", "Strategy Pattern", classStrategy],
  ["stateDiagram-v2", "Basic States", stateDiagram],
  ["stateDiagram-v2", "Order State Machine", stateOrder],
  ["stateDiagram-v2", "Elevator Dispatch", stateElevator],
  ["erDiagram", "Customer-Order", erDiagram],
  ["erDiagram", "E-commerce Core", erEcommerce],
  ["erDiagram", "Banking System", erBanking],
  ["pie", "Pets", pie],
  ["pie", "Device Share", pieDevice],
  ["pie", "Browser Market", pieBrowser],
  ["gantt", "Simple Tasks", gantt],
  ["gantt", "Software Project", ganttSoftware],
  ["gantt", "Quarterly Plan", ganttQuarterly],
  ["xychart-beta", "Product Sales", xychart],
];
