function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function experimentToCSV(experiment) {
  const lines = []

  // Header info
  lines.push('# Experiment Report')
  lines.push(`# Goal,${experiment.goal}`)
  lines.push(`# Status,${experiment.status}`)
  lines.push(`# Created,${experiment.created_at}`)
  if (experiment.completed_at) lines.push(`# Completed,${experiment.completed_at}`)
  lines.push('')

  // Parameters
  lines.push('# Parameters')
  lines.push('Parameter,Value')
  Object.entries(experiment.parameters || {}).forEach(([k, v]) => {
    lines.push(`${k},${v}`)
  })
  lines.push('')

  // Candidates from simulation
  const simStep = experiment.steps?.find((s) => s.step_name === 'Simulation')
  if (simStep?.output?.candidates) {
    lines.push('# Simulation Candidates')
    lines.push('ID,Name,Formula,Category,Thermal Conductivity (W/mK),Density (g/cm3),Stability Score,Cost ($/kg),Match Score')
    simStep.output.candidates.forEach((c) => {
      lines.push(`${c.id},"${c.name || ''}",${c.formula || ''},${c.category || ''},${c.thermal_conductivity},${c.density || ''},${c.stability_score},${c.cost_per_kg},${c.match_score || ''}`)
    })
    lines.push('')
  }

  // Final result
  const fr = experiment.final_result
  if (fr && Object.keys(fr).length > 0) {
    lines.push('# Analysis Result')
    lines.push('Metric,Value')
    lines.push(`Best Candidate,${fr.best_candidate}`)
    if (fr.best_name) lines.push(`Name,"${fr.best_name}"`)
    if (fr.best_formula) lines.push(`Formula,${fr.best_formula}`)
    if (fr.best_category) lines.push(`Category,${fr.best_category}`)
    lines.push(`Thermal Conductivity,${fr.best_thermal_conductivity} W/mK`)
    if (fr.best_density) lines.push(`Density,${fr.best_density} g/cm3`)
    if (fr.best_melting_point) lines.push(`Melting Point,${fr.best_melting_point} C`)
    if (fr.best_stability_score) lines.push(`Stability Score,${fr.best_stability_score}`)
    if (fr.best_cost_per_kg) lines.push(`Cost,${fr.best_cost_per_kg} $/kg`)
    if (fr.match_score_pct) lines.push(`Match Score,${fr.match_score_pct}%`)
    if (fr.runner_up) lines.push(`Runner-up,"${fr.runner_up}"`)
    lines.push('')
  }

  // AI Suggestion
  const sug = experiment.ai_suggestion
  if (sug && sug.confidence > 0) {
    lines.push('# AI Suggestion')
    lines.push(`Reasoning,"${sug.reasoning}"`)
    lines.push(`Predicted Improvement,+${sug.predicted_improvement_pct}%`)
    lines.push(`Confidence,${(sug.confidence * 100).toFixed(0)}%`)
    lines.push('')
    lines.push('Parameter,Current,Suggested,Direction,Expected Impact')
    sug.suggested_parameters?.forEach((p) => {
      lines.push(`${p.name},${p.current_value},${p.suggested_value},${p.change_direction},"${p.expected_impact}"`)
    })
  }

  return lines.join('\n')
}

export default function ExportResults({ experiment }) {
  if (!experiment || experiment.status !== 'completed') return null

  const handleExportJSON = () => {
    const data = {
      id: experiment.id,
      goal: experiment.goal,
      parameters: experiment.parameters,
      constraints: experiment.constraints,
      status: experiment.status,
      steps: experiment.steps,
      final_result: experiment.final_result,
      ai_suggestion: experiment.ai_suggestion,
      created_at: experiment.created_at,
      completed_at: experiment.completed_at,
    }
    downloadFile(
      JSON.stringify(data, null, 2),
      `looplab-${experiment.id.slice(0, 8)}.json`,
      'application/json'
    )
  }

  const handleExportCSV = () => {
    downloadFile(
      experimentToCSV(experiment),
      `looplab-${experiment.id.slice(0, 8)}.csv`,
      'text/csv'
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportJSON}
        className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] hover:text-[var(--cyan)] transition-colors cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--cyan-dim)] bg-[var(--surface-2)]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1V8M6 8L3.5 5.5M6 8L8.5 5.5M1 10H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        JSON
      </button>
      <button
        onClick={handleExportCSV}
        className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] hover:text-[var(--cyan)] transition-colors cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--cyan-dim)] bg-[var(--surface-2)]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1V8M6 8L3.5 5.5M6 8L8.5 5.5M1 10H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        CSV
      </button>
    </div>
  )
}
