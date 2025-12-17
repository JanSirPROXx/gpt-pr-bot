const fs = require("node:fs");
const path = require("node:path");

const core = require("@actions/core");
const { Octokit } = require("@octokit/rest");
const OpenAI = require("openai").default;

function readOptionalFile(filePath) {
  try {
    return fs.readFileSync(path.resolve(process.cwd(), filePath), "utf8");
  } catch {
    return null;
  }
}

function redactSecrets(text) {
  if (!text) return text;
  return text
    .replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_KEY]")
    .replace(
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
      "[REDACTED_PRIVATE_KEY]"
    )
    .replace(
      /(api_key|token|secret|password)\s*[:=]\s*["']?[^"'\n]+["']?/gi,
      "$1: [REDACTED]"
    );
}

async function listPrFilesWithPatches(octokit, owner, repo, prNumber, maxFiles) {
  const out = [];
  let page = 1;

  while (out.length < maxFiles) {
    const res = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
      page,
    });

    if (!res.data.length) break;

    for (const f of res.data) {
      if (out.length >= maxFiles) break;
      if (!f.patch) continue; // patch fehlt bei riesigen Dateien
      if (f.status === "removed") continue;
      if (f.filename.includes("package-lock.json")) continue;
      if (f.filename.includes("yarn.lock")) continue;

      out.push({ filename: f.filename, patch: f.patch });
    }

    page += 1;
  }

  return out;
}

function buildPrompt({ rules, files }) {
  const rulesText = rules
    ? `Repository Review Rules (from Review.md):\n${rules}\n`
    : `Repository Review Rules: (none provided)\n`;

  const diffs = files
    .map(
      (f) => `FILE: ${f.filename}\nDIFF:\n${f.patch}\n`
    )
    .join("\n---\n");

  return `
Du bist ein erfahrener Code-Reviewer. Reviewe die Änderungen in diesem Pull Request.

Fokussiere auf:
- Bugs, Edge Cases, Fehlerbehandlung
- Security & Secrets
- API/Library Misuse
- Tests (was fehlt?)
- Verständlichkeit und Wartbarkeit gemäss Repo-Regeln

Antworte als Markdown mit:
1) Summary (2-5 bullets)
2) High priority issues (Datei + Begründung + Fix)
3) Medium/Low priority
4) Test suggestions

${rulesText}

PR DIFFS:
${diffs}
`.trim();
}

async function postPrComment(octokit, owner, repo, prNumber, body) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}

async function run() {
  const openaiKey = core.getInput("openai_api_key", { required: true });
  const model = core.getInput("model") || "gpt-4.1-mini";
  const reviewFile = core.getInput("review_file") || "Review.md";
  const maxFiles = Number(core.getInput("max_files") || "20");

  const { GITHUB_REPOSITORY, GITHUB_EVENT_PATH, GITHUB_TOKEN } = process.env;

  if (!GITHUB_REPOSITORY) throw new Error("Missing GITHUB_REPOSITORY");
  if (!GITHUB_EVENT_PATH) throw new Error("Missing GITHUB_EVENT_PATH");
  if (!GITHUB_TOKEN) throw new Error("Missing GITHUB_TOKEN (permissions?)");

  const [owner, repo] = GITHUB_REPOSITORY.split("/");

  const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, "utf8"));
  const prNumber = event.pull_request?.number;
  if (!prNumber) throw new Error("This action only works on pull_request events");

  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const openai = new OpenAI({ apiKey: openaiKey });

  const rulesRaw = readOptionalFile(reviewFile);
  const rules = rulesRaw ? redactSecrets(rulesRaw) : null;

  const filesRaw = await listPrFilesWithPatches(octokit, owner, repo, prNumber, maxFiles);

  if (filesRaw.length === 0) {
    await postPrComment(
      octokit,
      owner,
      repo,
      prNumber,
      "AI Review: Keine reviewbaren Diffs gefunden (evtl. nur Lockfiles/removed/zu grosse Dateien ohne Patch)."
    );
    return;
  }

  const files = filesRaw.map((f) => ({
    filename: f.filename,
    patch: redactSecrets(f.patch),
  }));

  core.info(`Reviewing ${files.length} file(s): ${files.map((f) => f.filename).join(", ")}`);

  const prompt = buildPrompt({ rules, files });

  const resp = await openai.responses.create({
    model,
    input: prompt,
  });

  const reviewText = resp.output_text?.trim() || "(No output from model)";

  const body =
    `${reviewText}\n\n---\n` +
    `_Automated review. Model: ${model}. Files: ${files.length}._`;

  await postPrComment(octokit, owner, repo, prNumber, body);
}

run().catch((err) => {
  core.setFailed(err?.stack || String(err));
});
