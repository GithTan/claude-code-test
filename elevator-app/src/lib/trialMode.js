// ─── TRIAL MODE FLAGS ────────────────────────────────────────────────────────
// Set all to false when going live. Nothing else needs to change.

export const HIDE_CONTACT_NUMBERS_DURING_TRIAL = true
export const HIDE_PROJECT_NAMES_DURING_TRIAL   = true
export const BYPASS_UPLOAD_GATES_DURING_TRIAL  = true  // skip required doc uploads in pipeline

// ─────────────────────────────────────────────────────────────────────────────

export function isTrialMode() {
  return HIDE_PROJECT_NAMES_DURING_TRIAL || BYPASS_UPLOAD_GATES_DURING_TRIAL
}

export function shouldHideContactNumbers() {
  return HIDE_CONTACT_NUMBERS_DURING_TRIAL
}

export function shouldHideProjectNames() {
  return HIDE_PROJECT_NAMES_DURING_TRIAL
}

export function shouldBypassUploads() {
  return BYPASS_UPLOAD_GATES_DURING_TRIAL
}

export function maskProjectName(value, fallback = 'Project') {
  if (!shouldHideProjectNames()) return value || fallback
  const raw = String(value || '').trim()
  if (!raw) return `${fallback} hidden`
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) % 10000
  }
  return `${fallback} ${String(hash || 1).padStart(4, '0')}`
}
