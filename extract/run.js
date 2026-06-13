#!/usr/bin/env node

// Mermaid 测试抽取脚本
// 从三个本地参考仓库中扫描 Mermaid 测试候选，选取高信号子集生成 YAML 测试文件
// 输入: docs/init/test-candidates.json (Phase 4 挖掘产物)
// 输出: test/*.yml, test/schema.yml, extract/report.json

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, rmSync } from 'fs'
import { join, dirname, relative, sep } from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
, ROOT = join(__dirname, '..')
, REFS = join(ROOT, 'references')
, CANDIDATES_PATH = join(ROOT, 'docs/init/test-candidates.json')
, TEST_DIR = join(ROOT, 'test')
, REPORT_PATH = join(__dirname, 'report.json')
, SCHEMA_PATH = join(TEST_DIR, 'schema.yml')

// 仓库短名 → 规约全名映射
const REPO_FULL = {
  maid: 'probelabs/maid',
  'beautiful-mermaid': 'lukilabs/beautiful-mermaid',
  mermaid: 'mermaid-js/mermaid',
}

// 每种 diagram type 在高信号集中的配额
const TYPE_QUOTA = {
  flowchart: 5,
  sequenceDiagram: 3,
  classDiagram: 2,
  stateDiagram: 2,
  erDiagram: 2,
  pie: 2,
  gantt: 1,
  other: 1,
}

// 优先级权重，数字越小越优先
const PRIORITY_WEIGHT = { P0: 0, P1: 1, P2: 2 }

// 递归扫描目录，返回匹配扩展名的文件列表
const scanDir = (dir, exts, base = dir) => {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue
    const full = join(dir, name)
    , st = statSync(full)
    if (st.isDirectory()) {
      out.push(...scanDir(full, exts, base))
    } else if (exts.some(e => name.endsWith(e))) {
      out.push(relative(base, full).split(sep).join('/'))
    }
  }
  return out
}

// 统计每个仓库的扫描文件数
const countScanned = () => {
  const maidFixtures = join(REFS, 'maid/test-fixtures')
  , maidMmd = scanDir(maidFixtures, ['.mmd'])

  const bmRoot = join(REFS, 'beautiful-mermaid')
  , bmTs = scanDir(bmRoot, ['.ts'])
    .filter(p => p.includes('samples') || p.includes('__tests__'))

  const mmCypress = join(REFS, 'mermaid/cypress')
  , mmDemos = join(REFS, 'mermaid/demos')
  , mmPkgs = join(REFS, 'mermaid/packages/mermaid/src/diagrams')
  , mmSpecs = scanDir(mmCypress, ['.spec.js', '.spec.ts'])
  , mmHtml = scanDir(mmDemos, ['.html'])
  , mmDevMmd = scanDir(join(mmCypress, 'platform/dev-diagrams'), ['.mmd'])
  , mmPkgSpec = scanDir(mmPkgs, ['.spec.js'])

  return {
    maid: maidMmd.length,
    'beautiful-mermaid': bmTs.length,
    mermaid: mmSpecs.length + mmHtml.length + mmDevMmd.length + mmPkgSpec.length,
  }
}

// 按优先级排序，同优先级按 ID 稳定排序
const sortByPriority = (list) =>
  [...list].sort((a, b) => {
    const pa = PRIORITY_WEIGHT[a.priority] ?? 9
    , pb = PRIORITY_WEIGHT[b.priority] ?? 9
    if (pa !== pb) return pa - pb
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })

// 轮询选取：同优先级内交替从不同来源取候选，确保来源多样性
const roundRobinPick = (list, quota) => {
  // 按来源分组，每组内已按优先级排序
  const bySource = {}
  for (const c of list) {
    const k = c.sourceRepo
    if (!bySource[k]) bySource[k] = []
    bySource[k].push(c)
  }
  const sources = Object.keys(bySource).sort()
  , picked = []
  let progress = true
  while (progress && picked.length < quota) {
    progress = false
    for (const src of sources) {
      if (picked.length >= quota) break
      const pool = bySource[src]
      if (pool.length > 0) {
        picked.push(pool.shift())
        progress = true
      }
    }
  }
  // 剩余候选
  const remaining = sources.flatMap(src => bySource[src])
  return [picked, remaining]
}

// 按配额选取高信号子集，返回 { accepted, skipped }
const selectTests = (candidates) => {
  const accepted = []
  , skipped = []

  // 非 minimal_core 一律跳过
  for (const c of candidates) {
    if (c.classification !== 'minimal_core') {
      skipped.push({
        ...pickSkipMeta(c),
        reason: 'classification_' + c.classification,
      })
    }
  }

  // minimal_core 按类型分组
  const minimal = candidates.filter(c => c.classification === 'minimal_core')
  , byType = {}
  for (const c of minimal) {
    const t = c.type in TYPE_QUOTA ? c.type : 'other'
    if (!byType[t]) byType[t] = []
    byType[t].push(c)
  }

  // 每个类型轮询选取
  for (const [type, list] of Object.entries(byType)) {
    const sorted = sortByPriority(list)
    , quota = TYPE_QUOTA[type] || 0
    , [picked, rest] = roundRobinPick(sorted, quota)
    accepted.push(...picked)
    for (const c of rest) {
      skipped.push({
        ...pickSkipMeta(c),
        reason: 'quota_exceeded_' + type,
      })
    }
  }

  // 按 ID 排序输出，便于人工 review
  accepted.sort((a, b) => a.id < b.id ? -1 : 1)
  skipped.sort((a, b) => a.id < b.id ? -1 : 1)

  return { accepted, skipped }
}

// 提取跳过记录的元信息
const pickSkipMeta = (c) => ({
  id: c.id,
  sourceRepo: REPO_FULL[c.sourceRepo] || c.sourceRepo,
  sourcePath: c.sourcePath,
  type: c.type,
  priority: c.priority,
  classification: c.classification,
})

// 构建单条 YAML 测试对象
const buildTestYaml = (c) => ({
  id: c.id,
  source: {
    repo: REPO_FULL[c.sourceRepo] || c.sourceRepo,
    path: c.sourcePath,
    url: null,
  },
  diagram: {
    type: c.type,
    title: null,
  },
  input: {
    mermaid: c.input,
  },
  expect: {
    render: true,
    svg: {
      root: true,
      viewBox: true,
      containsText: [],
    },
  },
  skip: {
    enabled: false,
    reason: null,
  },
})

// 生成 test/schema.yml 内容
const SCHEMA_YML = `# Mermaid YAML 测试 Schema
# 每条 test/*.yml 必须匹配此结构后才能进入渲染测试
# 由 extract/run.js 生成，请勿手动修改

type: object
required: [id, source, diagram, input, expect, skip]
properties:
  id:
    type: string
    description: 稳定唯一测试编号
  source:
    type: object
    required: [repo, path, url]
    properties:
      repo:
        type: string
        description: 来源仓库全名 (如 probelabs/maid)
      path:
        type: string
        description: 来源文件相对路径
      url:
        type: [string, 'null']
        description: 可追溯 URL，当前为 null
  diagram:
    type: object
    required: [type, title]
    properties:
      type:
        type: string
        description: Mermaid diagram type (如 flowchart, sequenceDiagram)
      title:
        type: [string, 'null']
        description: 图表标题，当前为 null
  input:
    type: object
    required: [mermaid]
    properties:
      mermaid:
        type: string
        description: Mermaid 源文本
  expect:
    type: object
    required: [render, svg]
    properties:
      render:
        type: boolean
        description: 是否预期渲染成功
      svg:
        type: object
        required: [root, viewBox, containsText]
        properties:
          root:
            type: boolean
            description: SVG 是否包含合法根节点
          viewBox:
            type: boolean
            description: SVG 是否包含 viewBox 属性
          containsText:
            type: array
            items:
              type: string
            description: SVG 中应包含的文本片段列表
  skip:
    type: object
    required: [enabled, reason]
    properties:
      enabled:
        type: boolean
        description: 是否跳过此测试
      reason:
        type: [string, 'null']
        description: 跳过原因，仅在 enabled 为 true 时有值
`

// 清理旧的生成文件
const cleanOldTests = () => {
  if (!existsSync(TEST_DIR)) return
  for (const name of readdirSync(TEST_DIR)) {
    if (name.endsWith('.yml') && name !== 'schema.yml') {
      rmSync(join(TEST_DIR, name))
    }
  }
}

// 构建 report.json
const buildReport = (candidates, accepted, skipped, scanned) => {
  const sources = {}
  for (const [short, full] of Object.entries(REPO_FULL)) {
    const repoCands = candidates.filter(c => c.sourceRepo === short)
    , repoAccepted = accepted.filter(c => c.sourceRepo === short)
    , repoSkipped = skipped.filter(s => s.sourceRepo === full)

    sources[full] = {
      scannedFiles: scanned[short] || 0,
      candidates: repoCands.length,
      accepted: repoAccepted.length,
      skipped: repoSkipped.length,
    }
    if (repoAccepted.length === 0) {
      sources[full].zeroAcceptedReason = '该仓库无候选被选入高信号集'
    }
  }

  // 按 diagram type 聚合
  const byDiagramType = {}
  for (const c of accepted) {
    const t = c.type
    if (!byDiagramType[t]) byDiagramType[t] = { accepted: 0, skipped: 0 }
    byDiagramType[t].accepted++
  }
  for (const s of skipped) {
    const t = s.type
    if (!byDiagramType[t]) byDiagramType[t] = { accepted: 0, skipped: 0 }
    byDiagramType[t].skipped++
  }

  // 跳过原因聚合
  const skipReasons = {}
  for (const s of skipped) {
    skipReasons[s.reason] = (skipReasons[s.reason] || 0) + 1
  }

  return {
    generatedAt: new Date().toISOString(),
    sources,
    byDiagramType,
    skipReasons,
    skippedSamples: skipped,
    summary: {
      totalCandidates: candidates.length,
      totalAccepted: accepted.length,
      totalSkipped: skipped.length,
    },
  }
}

// === 主流程 ===

console.log('[extract] 读取候选列表...')
const candidates = JSON.parse(readFileSync(CANDIDATES_PATH, 'utf8'))
console.log('[extract] 候选总数: ' + candidates.length)

console.log('[extract] 扫描参考仓库...')
const scanned = countScanned()
console.log('[extract] 扫描文件: ' + JSON.stringify(scanned))

console.log('[extract] 选取高信号子集...')
const { accepted, skipped } = selectTests(candidates)
console.log('[extract] 接受: ' + accepted.length + ', 跳过: ' + skipped.length)

console.log('[extract] 清理旧测试文件...')
cleanOldTests()

console.log('[extract] 生成 YAML 测试文件...')
for (const c of accepted) {
  const testObj = buildTestYaml(c)
  , ymlContent = yaml.dump(testObj, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    sortKeys: false,
  })
  , filePath = join(TEST_DIR, c.id + '.yml')
  writeFileSync(filePath, ymlContent, 'utf8')
  console.log('  → ' + c.id + '.yml (' + c.type + ' from ' + c.sourceRepo + ')')
}

console.log('[extract] 生成 schema.yml...')
writeFileSync(SCHEMA_PATH, SCHEMA_YML, 'utf8')

console.log('[extract] 生成 report.json...')
const report = buildReport(candidates, accepted, skipped, scanned)
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8')

console.log('[extract] 完成。')
console.log('  测试文件: ' + accepted.length + ' 个')
console.log('  跳过候选: ' + skipped.length + ' 个')
console.log('  schema: ' + relative(ROOT, SCHEMA_PATH))
console.log('  report: ' + relative(ROOT, REPORT_PATH))
