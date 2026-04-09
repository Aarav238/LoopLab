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
    lines.push('ID,Thermal Conductivity (W/mK),Stability Score,Cost ($/kg)')
    simStep.output.candidates.forEach((c) => {
      lines.push(`${c.id},${c.thermal_conductivity},${c.stability_score},${c.cost_per_kg}`)
    })
    lines.push('')
  }

  // Final result
  if (experiment.final_result && Object.keys(experiment.final_result).length > 0) {
    lines.push('# Analysis Result')
    lines.push('Metric,Value')
    lines.push(`Best Candidate,${experiment.final_result.best_candidate}`)
    lines.push(`Thermal Conductivity,${experiment.final_result.best_thermal_conductivity} W/mK`)
    lines.push(`Improvement Over Baseline,+${experiment.final_result.improvement_over_baseline_pct}%`)
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
