// GitHub Contents API — read and write data files without touching the command line.
// All writes trigger a Cloudflare Pages auto-deploy (~40s to live).

const OWNER  = 'gngengwe';
const REPO   = 'cup-radar';
const BRANCH = 'master';
const API    = 'https://api.github.com';

function headers(token) {
  return {
    Authorization:  `Bearer ${token}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

// Safe base64 for Unicode content (emoji flags, accented characters)
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

/** Verify token has repo read access. Returns true/false. */
export async function verifyToken(token) {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}`, { headers: headers(token) });
  return res.ok;
}

/** Read a file from the repo. Returns { content (parsed JSON), sha, rawContent }. */
export async function fetchFile(token, path) {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: headers(token), cache: 'no-cache' }
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${res.statusText}`);
  const data = await res.json();
  const rawContent = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
  return {
    content:    JSON.parse(rawContent),
    sha:        data.sha,
    rawContent,
  };
}

/** Write (update) a file in the repo. Returns the commit response. */
export async function saveFile(token, path, content, sha, message) {
  const jsonStr = JSON.stringify(content, null, 2) + '\n';
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method:  'PUT',
    headers: headers(token),
    body:    JSON.stringify({
      message,
      content: toBase64(jsonStr),
      sha,
      branch:  BRANCH,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/** Trigger a workflow_dispatch event. */
export async function dispatchWorkflow(token, workflowFile, inputs = {}) {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/actions/workflows/${workflowFile}/dispatches`,
    {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ ref: BRANCH, inputs }),
    }
  );
  if (res.status === 404) throw new Error('Workflow not found — push refresh.yml first');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub ${res.status}`);
  }
  return true;
}

/** Get recent runs for a workflow. */
export async function getWorkflowRuns(token, workflowFile, perPage = 5) {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/actions/workflows/${workflowFile}/runs?per_page=${perPage}`,
    { headers: headers(token) }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.workflow_runs || []).map(r => ({
    id:         r.id,
    status:     r.status,       // queued | in_progress | completed
    conclusion: r.conclusion,   // success | failure | cancelled | null
    createdAt:  r.created_at,
    updatedAt:  r.updated_at,
    url:        r.html_url,
    inputs:     r.inputs || {},
  }));
}

/** Get the latest commit SHA and message for display. */
export async function getLatestCommit(token) {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/commits/${BRANCH}`,
    { headers: headers(token) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    sha:     data.sha?.slice(0, 7),
    message: data.commit?.message?.split('\n')[0],
    date:    data.commit?.committer?.date,
  };
}
