// Mermaid 示例图库 —— 每个 MVP 图类型一条，源文本使用 {{label_key}} 占位符
// 元组结构: [diagramType, displayName, mermaidSource]
const flowchart = "graph TD\n" + "{{start}} --> {{process}} --> {{end}}",
  sequence =
    "sequenceDiagram\n" + "{{alice}}->>{{bob}}: {{hello}}\n" + "{{bob}}-->>{{alice}}: {{hi}}",
  classDiagram =
    "classDiagram\n" +
    "class {{animal}} {\n" +
    "  +String {{name}}\n" +
    "  +int {{age}}\n" +
    "  +{{eat}} void\n" +
    "  +{{sleep}} void\n" +
    "}",
  stateDiagram =
    "stateDiagram-v2\n" +
    "[*] --> {{idle}}\n" +
    "{{idle}} --> {{running}} : {{start_action}}\n" +
    "{{running}} --> [*] : {{stop_action}}",
  erDiagram = "erDiagram\n" + "{{customer}} ||--o{ {{order}} : {{places}}",
  pie = "pie\n" + '  title "{{pets}}"\n' + '  "{{dogs}}" : 10\n' + '  "{{cats}}" : 5',
  gantt =
    "gantt\n" +
    "  dateFormat  YYYY-MM-DD\n" +
    "  title {{gantt_title}}\n" +
    "  section {{section_a}}\n" +
    "  {{completed_task}}            :done,    des1, 2014-01-06,2014-01-08\n" +
    "  {{active_task}}               :active,  des2, 2014-01-09, 3d",
  xychart =
    "xychart-beta\n" +
    'title "{{product_sales}}"\n' +
    "x-axis [{{widgets}}, {{gadgets}}, {{gizmos}}, {{doodads}}, {{thingamajigs}}]\n" +
    "bar [150, 230, 180, 95, 310]",
  flowchartApproval =
    "graph TD\n" +
    "subgraph sg1[{{applicant}}]\n" +
    "  n1[{{submit_order}}] --> n2{ {{manager_approval}} }\n" +
    "end\n" +
    "subgraph sg2[{{approver}}]\n" +
    "  n2 -->|{{approve}}| n3[{{approved}}]\n" +
    "  n2 -->|{{reject}}| n4[{{returned_for_revision}}]\n" +
    "end\n" +
    "subgraph sg3[{{system}}]\n" +
    "  n3 --> n5[{{generate_order}}]\n" +
    "  n4 --> n1\n" +
    "end",
  flowchartCicd =
    "graph TD\n" +
    "subgraph sg1[{{dev}}]\n" +
    "  n1[{{commit_code}}] --> n2[{{push_branch}}]\n" +
    "end\n" +
    "subgraph sg2[{{ci}}]\n" +
    "  n3[{{lint_check}}] --> n4[{{unit_test}}] --> n5[{{build_image}}]\n" +
    "end\n" +
    "subgraph sg3[{{cd}}]\n" +
    "  n6[{{deploy_staging}}] --> n7{ {{acceptance_test}} }\n" +
    "  n7 -->|{{approve}}| n8[{{deploy_production}}]\n" +
    "  n7 -->|{{reject}}| n9[{{rollback}}]\n" +
    "end\n" +
    "subgraph sg4[{{monitor}}]\n" +
    "  n10[{{monitor_alert}}]\n" +
    "end\n" +
    "sg1 --> sg2\n" +
    "sg2 --> sg3\n" +
    "sg3 --> sg4\n" +
    "classDef critical fill:#ff4444,stroke:#333,stroke-width:2px,color:#fff\n" +
    "classDef success fill:#44aa44,stroke:#333,stroke-width:2px,color:#fff\n" +
    "class n5,n8 critical\n" +
    "class n3,n4,n6 success\n" +
    "linkStyle 5 stroke:#ff4444,stroke-width:3px\n" +
    "linkStyle 4 stroke:#44aa44,stroke-width:3px",
  sequenceRetry =
    "sequenceDiagram\n" +
    "participant {{client}} as {{client}}\n" +
    "participant {{server}} as {{server}}\n" +
    "Note over {{client}},{{server}}: {{http_request_retry}}\n" +
    "loop {{max_3_retries}}\n" +
    "  {{client}}->>{{server}}: {{get_api_data}}\n" +
    "  alt {{retry_success}}\n" +
    "    {{server}}-->>{{client}}: {{ok_200}}\n" +
    "  else {{retry_failure}}\n" +
    "    {{server}}-->>{{client}}: {{error_500}}\n" +
    "    Note over {{client}}: {{wait_1s_retry}}\n" +
    "  end\n" +
    "end\n" +
    "alt {{all_failed}}\n" +
    "  {{client}}->>{{client}}: {{trigger_degraded}}\n" +
    "end",
  sequenceOauth =
    "sequenceDiagram\n" +
    "autonumber\n" +
    "participant {{user}} as {{user}}\n" +
    "participant {{client_actor}} as {{client_actor}}\n" +
    "participant {{auth_server}} as {{auth_server}}\n" +
    "participant {{resource_server}} as {{resource_server}}\n" +
    "rect rgb(240, 248, 255)\n" +
    "  Note over {{user}},{{auth_server}}: {{authorization_phase}}\n" +
    "  {{user}}->>{{client_actor}}: {{click_login}}\n" +
    "  activate {{client_actor}}\n" +
    "  {{client_actor}}->>{{auth_server}}: {{redirect_auth}}\n" +
    "  activate {{auth_server}}\n" +
    "  {{auth_server}}-->>{{user}}: {{show_login}}\n" +
    "  {{user}}->>{{auth_server}}: {{enter_credentials}}\n" +
    "  {{auth_server}}-->>{{client_actor}}: {{return_auth_code}}\n" +
    "  deactivate {{auth_server}}\n" +
    "end\n" +
    "rect rgb(240, 255, 240)\n" +
    "  Note over {{client_actor}},{{resource_server}}: {{exchange_token}}\n" +
    "  {{client_actor}}->>{{auth_server}}: {{code_secret}}\n" +
    "  activate {{auth_server}}\n" +
    "  {{auth_server}}-->>{{client_actor}}: {{access_token}}\n" +
    "  deactivate {{auth_server}}\n" +
    "  {{client_actor}}->>{{resource_server}}: {{request_resource}}\n" +
    "  activate {{resource_server}}\n" +
    "  {{resource_server}}-->>{{client_actor}}: {{return_user_data}}\n" +
    "  deactivate {{resource_server}}\n" +
    "  deactivate {{client_actor}}\n" +
    "end",
  classHierarchy =
    "classDiagram\n" +
    "class {{animal}} {\n" +
    "  +String {{name}}\n" +
    "  +int {{age}}\n" +
    "  +{{eat}} void\n" +
    "  +{{sleep}} void\n" +
    "}\n" +
    "class {{dog}} {\n" +
    "  +String {{breed}}\n" +
    "  +{{bark}} void\n" +
    "}\n" +
    "class {{cat}} {\n" +
    "  +boolean {{indoor}}\n" +
    "  +{{meow}} void\n" +
    "}\n" +
    "class {{bird}} {\n" +
    "  +double {{wingspan}}\n" +
    "  +{{fly}} void\n" +
    "}\n" +
    "{{animal}} <|-- {{dog}}\n" +
    "{{animal}} <|-- {{cat}}\n" +
    "{{animal}} <|-- {{bird}}",
  classStrategy =
    "classDiagram\n" +
    "class {{strategy}} {\n" +
    "  <<interface>>\n" +
    "  +{{execute_int}} int\n" +
    "}\n" +
    "class {{context}} {\n" +
    "  -{{strategy}} {{strategy}}\n" +
    "  +{{set_strategy}} void\n" +
    "  +{{execute_strategy}} int\n" +
    "}\n" +
    "class {{add_strategy}} {\n" +
    "  +{{execute_int}} int\n" +
    "}\n" +
    "class {{sub_strategy}} {\n" +
    "  +{{execute_int}} int\n" +
    "}\n" +
    "class {{mul_strategy}} {\n" +
    "  +{{execute_int}} int\n" +
    "}\n" +
    "class {{logger_factory}} {\n" +
    "  <<abstract>>\n" +
    "  +{{log_string}} void\n" +
    "}\n" +
    'note for {{strategy}} "{{strategy_note}}"\n' +
    'note for {{context}} "{{context_note}}"\n' +
    "{{strategy}} <|.. {{add_strategy}}\n" +
    "{{strategy}} <|.. {{sub_strategy}}\n" +
    "{{strategy}} <|.. {{mul_strategy}}\n" +
    "{{context}} *-- {{strategy}} : {{composite}}\n" +
    "{{context}} ..> {{logger_factory}} : {{dependency}}",
  stateOrder =
    "stateDiagram-v2\n" +
    "[*] --> s1\n" +
    "s1 : {{pending_payment}}\n" +
    "s1 --> s2 : {{user_pays}}\n" +
    "s2 : {{paid}}\n" +
    "s1 --> s3 : {{timeout_or_cancel}}\n" +
    "s3 : {{cancelled}}\n" +
    "state s2 {\n" +
    "  [*] --> s4\n" +
    "  s4 : {{pending_shipping}}\n" +
    "  s4 --> s5 : {{merchant_ships}}\n" +
    "  s5 : {{shipped}}\n" +
    "  s5 --> s6 : {{user_confirms_receipt}}\n" +
    "  s6 : {{received}}\n" +
    "}\n" +
    "s6 --> s7 : {{auto_confirm_7d}}\n" +
    "s7 : {{completed}}\n" +
    "s3 --> [*]\n" +
    "s7 --> [*]\n" +
    "note right of s1\n" +
    "  {{auto_cancel_30min}}\n" +
    "end note",
  stateElevator =
    "stateDiagram-v2\n" +
    "[*] --> s1\n" +
    "s1 : {{idle}}\n" +
    "s1 --> s2 : {{button_pressed}}\n" +
    "s2 : {{receive_instruction}}\n" +
    "s2 --> s3\n" +
    "s3 : {{fork_state}}\n" +
    "state s3 <<fork>>\n" +
    "s3 --> s4 : {{target_floor_up}}\n" +
    "s4 : {{up}}\n" +
    "s3 --> s5 : {{target_floor_down}}\n" +
    "s5 : {{down}}\n" +
    "s4 --> s6 : {{target}}\n" +
    "s5 --> s6 : {{target}}\n" +
    "s6 : {{arrive}}\n" +
    "state s6 {\n" +
    "  [*] --> s7\n" +
    "  s7 : {{door_opens}}\n" +
    "  s7 --> s8 : {{door_holds}}\n" +
    "  s8 : {{door_holds}}\n" +
    "  s8 --> s9 : {{after_5s}}\n" +
    "  s9 : {{door_closes}}\n" +
    "  s9 --> [*]\n" +
    "}\n" +
    "state s10 <<join>>\n" +
    "s10 : {{join_state}}\n" +
    "s6 --> s10\n" +
    "s10 --> s1\n" +
    "s1 --> s11 : {{emergency_button}}\n" +
    "s11 : {{alarm}}\n" +
    "s11 --> [*]\n" +
    "note right of s1\n" +
    "  {{elevator_history}}\n" +
    "end note",
  erEcommerce =
    "erDiagram\n" +
    "{{customer}} ||--o{ {{order}} : {{places}}\n" +
    "{{order}} ||--|{ {{order_item}} : {{contains}}\n" +
    "{{order_item}} }|--|| {{product}} : {{refers_to}}\n" +
    "{{product}} }o--o{ {{category}} : {{belongs_to}}\n" +
    "{{customer}} {\n" +
    "  int {{id}} PK\n" +
    "  string {{name}}\n" +
    "  string {{email}}\n" +
    "}\n" +
    "{{order}} {\n" +
    "  int {{id}} PK\n" +
    "  int {{customer_id}} FK\n" +
    "  datetime {{created_at}}\n" +
    "}\n" +
    "{{order_item}} {\n" +
    "  int {{id}} PK\n" +
    "  int {{order_id}} FK\n" +
    "  int {{product_id}} FK\n" +
    "  int {{quantity}}\n" +
    "}\n" +
    "{{product}} {\n" +
    "  int {{id}} PK\n" +
    "  string {{name}}\n" +
    "  decimal {{price}}\n" +
    "}\n" +
    "{{category}} {\n" +
    "  int {{id}} PK\n" +
    "  string {{name}}\n" +
    "}",
  erBanking =
    "erDiagram\n" +
    "{{customer}} ||--o{ {{account}} : {{owns}}\n" +
    "{{account}} ||--o{ {{transaction}} : {{has}}\n" +
    "{{customer}} ||--o{ {{card}} : {{has}}\n" +
    "{{account}} ||--o{ {{loan}} : {{secures}}\n" +
    "{{card}} }o--|| {{account}} : {{linked_to}}\n" +
    "{{customer}} {\n" +
    "  int {{id}} PK\n" +
    "  string {{name}} UK\n" +
    "  string {{id_card}} UK\n" +
    "  string {{phone}}\n" +
    "  datetime {{created_at}}\n" +
    "}\n" +
    "{{account}} {\n" +
    "  string {{account_no}} PK\n" +
    "  int {{customer_id}} FK\n" +
    "  decimal {{balance}}\n" +
    "  string {{currency}}\n" +
    "  datetime {{opened_at}}\n" +
    "}\n" +
    "{{transaction}} {\n" +
    "  bigint {{id}} PK\n" +
    "  string {{from_account}} FK\n" +
    "  string {{to_account}} FK\n" +
    "  decimal {{amount}}\n" +
    "  datetime {{trans_at}}\n" +
    "}\n" +
    "{{card}} {\n" +
    "  string {{card_no}} PK\n" +
    "  int {{customer_id}} FK\n" +
    "  string {{account_no}} FK\n" +
    "  date {{expire_date}}\n" +
    "  string {{card_type}}\n" +
    "}\n" +
    "{{loan}} {\n" +
    "  bigint {{id}} PK\n" +
    "  string {{account_no}} FK\n" +
    "  decimal {{principal}}\n" +
    "  decimal {{rate}}\n" +
    "  int {{term_months}}\n" +
    "}",
  pieDevice =
    "pie title {{device_traffic_2024}}\n" +
    '"{{mobile}}" : 60\n' +
    '"{{desktop}}" : 25\n' +
    '"{{tablet}}" : 10\n' +
    '"{{other}}" : 5',
  pieBrowser =
    '%%{init: {"themeVariables": {"pie1": "#FF6384", "pie2": "#36A2EB", "pie3": "#FFCE56", "pie4": "#4BC0C0", "pie5": "#9966FF", "pie6": "#FF9F40"}}%%\n' +
    "pie title {{browser_market_2024}}\n" +
    '"{{chrome}}" : 65\n' +
    '"{{safari}}" : 18\n' +
    '"{{edge}}" : 5\n' +
    '"{{firefox}}" : 3\n' +
    '"{{samsung_internet}}" : 2.5\n' +
    '"{{others}}" : 6.5',
  ganttSoftware =
    "gantt\n" +
    "  title {{software_project_gantt}}\n" +
    "  dateFormat YYYY-MM-DD\n" +
    "  section {{requirements}}\n" +
    "  {{requirement_analysis}}     :done,    req, 2024-01-01, 7d\n" +
    "  {{requirement_review}}     :done,    req2, after req, 2d\n" +
    "  section {{design}}\n" +
    "  {{ui_design}}      :active,  ui, 2024-01-10, 10d\n" +
    "  {{architecture_design}}     :         arch, 2024-01-10, 7d\n" +
    "  section {{development}}\n" +
    "  {{frontend_dev}}     :         fe, after ui, 14d\n" +
    "  {{backend_dev}}     :         be, after arch, 14d\n" +
    "  {{integration_testing}}         :         int, after fe, 7d\n" +
    "  section {{testing}}\n" +
    "  {{testing}}         :         test, after int, 7d\n" +
    "  {{go_live}}         :milestone, mil, after test, 0d",
  ganttQuarterly =
    "gantt\n" +
    "  title {{cross_quarter_2024}}\n" +
    "  dateFormat YYYY-MM-DD\n" +
    "  excludes weekends, 2024-01-01, 2024-02-10, 2024-02-12, 2024-04-04, 2024-05-01\n" +
    "  section {{q1}}\n" +
    "  {{project_initiation}}         :done, q1a, 2024-01-02, 5d\n" +
    "  {{research}}         :done, q1b, after q1a, 10d\n" +
    "  {{prototype_dev}}     :crit, q1c, after q1b, 15d\n" +
    "  {{internal_test}}     :crit, q1d, after q1c, 5d\n" +
    "  section {{q2}}\n" +
    "  {{public_beta}}         :q2a, after q1d, 14d\n" +
    "  {{bug_fix}}     :crit, q2b, after q2a, 7d\n" +
    "  {{official_release}}     :milestone, mil, after q2b, 0d\n" +
    "  {{operation_promotion}}     :q2c, after mil, 14d",
  xychartMulti =
    "xychart-beta\n" +
    'title "{{quarterly_sales_comparison}}"\n' +
    'x-axis ["Q1", "Q2", "Q3", "Q4"]\n' +
    'y-axis "{{sales_10k}}" 0 --> 300\n' +
    "bar [150, 180, 210, 250]\n" +
    "bar [80, 120, 150, 200]\n" +
    "bar [200, 190, 170, 160]",
  xychartRevenue =
    "xychart-beta\n" +
    'title "{{quarterly_revenue_comparison}}"\n' +
    'x-axis ["Q1", "Q2", "Q3", "Q4"]\n' +
    'y-axis "{{revenue_million_usd}}" 0 --> 300\n' +
    "bar [120, 145, 168, 198]\n" +
    "bar [142, 178, 201, 245]";

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
  ["xychart-beta", "Multi-series Chart", xychartMulti],
  ["xychart-beta", "Quarterly Revenue", xychartRevenue],
];
