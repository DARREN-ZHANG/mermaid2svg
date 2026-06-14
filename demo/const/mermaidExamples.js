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
    "bar [150, 230, 180, 95, 310]";

export default [
  ["flowchart", "Flowchart", flowchart],
  ["sequenceDiagram", "Sequence Diagram", sequence],
  ["classDiagram", "Class Diagram", classDiagram],
  ["stateDiagram-v2", "State Diagram", stateDiagram],
  ["erDiagram", "ER Diagram", erDiagram],
  ["pie", "Pie Chart", pie],
  ["gantt", "Gantt Chart", gantt],
  ["xychart-beta", "XY Chart", xychart],
];
