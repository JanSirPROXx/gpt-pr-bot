
# GPT PR Bot
This is a small github action script, which can make automatic Reviews. 

## How to use it.
Pretty simple just add a github action like this:
`name: AI Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: AI PR Review
        uses: JanSirPROXx/gpt-pr-bot@master
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      # optional:
      # model: gpt-4.1-mini
      # review_file: Review.md
      # max_files: "20"
`

Important: 
- make sure you add your OpenAI API key as repo secret to you repository
- also make sure uses: refers to this repository, you can use @v1 ... for stable versions. 