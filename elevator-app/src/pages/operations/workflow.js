export const TEAM_MEMBERS = ['Chel', 'Vic', 'Jose', 'Isza', 'Jonathan']

export const OPS_STATUS_SEQUENCE = [
  'on_going_production',
  'for_delivery',
  'unit_delivered_awaiting_shaft',
  'awaiting_shaft_readiness',
  'for_unloading',
  'mechanical_installation',
  'for_tnc',
  'done_tnc',
  'awaiting_power',
  'for_handover',
  'handed_over',
]

export const OWNER_ROLES = [
  { value: 'operations', label: 'Operations / PIC / Engineer' },
  { value: 'finance', label: 'Finance' },
  { value: 'admin', label: 'Admin / Owner' },
]

export const REQUIRED_DOCUMENTS = [
  { key: 'client_contract_approval', label: 'Client contract approval', help: 'Signed client contract with FIEC' },
  { key: 'client_drawing_approval', label: 'Client drawing approval', help: 'Signed approved drawing from client' },
  { key: 'engineer_technical_approval', label: 'Engineer technical approval', help: 'Engineer confirmation to supplier that specs are correct' },
  { key: 'supplier_contract_approval', label: 'Supplier contract', help: 'Signed contract between FIEC and supplier' },
]

export function getMissingOwnershipFields(projectLike) {
  const missing = []
  if (!projectLike?.owner_role) missing.push('owner')
  if (!projectLike?.assigned_to) missing.push('assigned person')
  if (!projectLike?.next_action) missing.push('next action')
  if (!projectLike?.next_action_date) missing.push('next action date')
  return missing
}

export function getMissingRequiredDocuments(projectLike) {
  return REQUIRED_DOCUMENTS.filter(doc => !projectLike?.[doc.key])
}

export function shouldRequireWorkflowOwnership(status) {
  return Boolean(status) && status !== 'handed_over'
}

export function shouldRequireApprovalDocuments(statuses, status) {
  if (!Array.isArray(statuses) || !status) return false
  const currentIndex = statuses.findIndex(s => s.value === status)
  const thresholdIndex = statuses.findIndex(s => s.value === 'for_delivery')
  return currentIndex >= 0 && thresholdIndex >= 0 && currentIndex >= thresholdIndex
}

export function isEscalated(projectLike) {
  if (!projectLike?.next_action_date) return false
  return Math.floor((Date.now() - new Date(projectLike.next_action_date)) / 86400000) > 3
}

export function isNextActionOverdue(projectLike) {
  if (!projectLike?.next_action_date) return false
  return new Date(projectLike.next_action_date) <= new Date()
}

export function projectNeedsApprovals(projectLike) {
  return shouldRequireApprovalDocuments(
    OPS_STATUS_SEQUENCE.map(value => ({ value })),
    projectLike?.status
  ) && getMissingRequiredDocuments(projectLike).length > 0
}

export function isMovingForward(statuses, currentStatus, nextStatus) {
  const currentIndex = statuses.findIndex(s => s.value === currentStatus)
  const nextIndex = statuses.findIndex(s => s.value === nextStatus)
  return currentIndex >= 0 && nextIndex > currentIndex
}

export function canViewFinancials(role) {
  return role === 'admin'
}

export function formatMissingList(items) {
  if (!items.length) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}
