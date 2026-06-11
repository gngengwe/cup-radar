// Builds a markdown ops digest from refresh-task summaries.
// Returns null if there's nothing worth reporting (keeps the schedule quiet).

export function buildDigest(results) {
  const applied = results.flatMap(r => (r.applied || []).map(a => `- **[${r.vertical}]** ${a}`));
  const pending = results.flatMap(r => (r.pending || []).map(p => `- [ ] **[${r.vertical}]** ${p}`));
  const flags   = results.flatMap(r => (r.flags   || []).map(f => `- ⚠️ **[${r.vertical}]** ${f}`));
  const errors  = results.filter(r => r.error).map(r => `- ❌ **[${r.vertical}]** ${r.error}`);

  if (!applied.length && !pending.length && !flags.length && !errors.length) return null;

  const lines = [];

  if (applied.length) {
    lines.push('## ✅ Auto-applied', '', ...applied, '');
  }
  if (pending.length) {
    lines.push(
      '## 📝 Needs your review (drafts)', '',
      ...pending, '',
      '> Review and publish/discard these in the [Admin Panel](https://wc.ngengwe.com/admin) before they go live.', ''
    );
  }
  if (flags.length) {
    lines.push('## ⚠️ Close calls — worth a manual look', '', ...flags, '');
  }
  if (errors.length) {
    lines.push('## ❌ Errors', '', ...errors, '');
  }

  lines.push('---', `_Automated run: ${new Date().toISOString()}_`);
  return lines.join('\n');
}
