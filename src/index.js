import * as core from "@actions/core";

const openaiKey = core.getInput("openai_api_key", { required: true });
const model = core.getInput("model");
const reviewFile = core.getInput("review_file");
const maxFiles = Number(core.getInput("max_files"));

const { GITHUB_REPOSITORY, GITHUB_EVENT_PATH } = process.env;

const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, "utf8"));
const prNumber = event.pull_request?.number;
if (!prNumber) {
  throw new Error("This action only works on pull_request events");
}
