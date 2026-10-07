# AI setup (resume review and profile autofill)

CareerConnect has two Generative AI features, both on the **Resumes** page for job seekers:

- **Review**: written feedback on a resume, optionally tailored to one of the job postings.
- **Fill profile**: reads a resume and offers to add its experience, education, skills and contact details to your profile.

They are optional. If the three `AI_*` settings in `.env` are empty, the buttons don't appear and the rest of the app works as usual.

The app talks to any "OpenAI-compatible" AI service, so which model it uses is only a matter of what you put in `.env`. Pick **one** of the options below. Restart the dev server (`pnpm run dev`) after changing `.env`.

| Model | Option A: Ollama (local) | Option B: Google Gemini |
|---|---|---|
| Account or key needed | No | Yes (Google account) |
| Speed | 1–2 minutes per request on a laptop | A few seconds |
| Needs | About 9 GB of disk, 16 GB of RAM recommended | Internet | 
| Works on a deployed site | No (only where Ollama runs) | Yes |

Free tiers have daily and per-minute limits that change over time; check the provider's page if requests start being refused.

## Option A: Ollama on your own computer

1. Install Ollama from <https://ollama.com/download> (or `brew install ollama` on macOS).
2. Download a model. This is the one the features were tested with:
   ```bash
   ollama pull qwen3.5:9b-mlx
   ```
   Any Ollama chat model works. Smaller models answer faster but make more mistakes.
3. Make sure Ollama is running: open the Ollama app, or run `ollama serve` in a terminal and leave it open.
4. In `.env`:
   ```
   AI_BASE_URL="http://localhost:11434/v1"
   AI_MODEL="qwen3.5:9b-mlx"
   AI_API_KEY=""
   ```

`AI_MODEL` must match a name from `ollama list` exactly.

## Option B: Google Gemini (free tier)

1. Go to <https://aistudio.google.com/apikey>, sign in, and create an API key.
2. In `.env`:
   ```
   AI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/"
   AI_MODEL="gemini-3.8-flash"
   AI_API_KEY="<your key>"
   ```

Model names change. If the one above is refused, use a current "Flash" model name from <https://ai.google.dev/gemini-api/docs/models>.



## Try it

1. Log in as a job seeker and open **Resumes**.
2. Upload a PDF. **Review** and **Fill profile** appear next to it when AI is configured.
3. Open **Review** and click **Review my resume**. With Ollama, wait a minute or two with the page open.

## If something goes wrong

| What you see | Likely cause | Fix |
|---|---|---|
| No Review or Fill profile buttons | `AI_BASE_URL` or `AI_MODEL` is empty | Fill them in and restart the dev server |
| "The AI model isn't responding. Check that Ollama is running" | Ollama isn't started, or the request took over 4 minutes | Start Ollama; try a smaller model if it's too slow |
| "The AI service refused the request" | Wrong model name, wrong key, or the free quota is used up | Check `AI_MODEL` and `AI_API_KEY`; the exact reason is printed in the dev server terminal |
| "This PDF has no readable text" | The PDF is a scan or an image | Export the resume from Word or Google Docs as a PDF |
| "The AI couldn't produce a usable answer" | The model returned something malformed | Try again; small local models do this occasionally |

## How it works

1. The server reads the text out of the stored PDF (`unpdf`).
2. It sends that text and instructions to the configured model and asks for an answer in a fixed data format (`src/lib/server/llm.ts`, `src/lib/server/resume-ai.ts`).
3. The answer is cleaned up and checked before anything is shown or saved:
   - Autofill items go through the same validation as the profile forms, so a wrong date from the model is dropped instead of saved. Nothing is added to a profile until the user ticks it and confirms.
   - Reviews are saved with the resume, so reopening the page doesn't run the model again.
4. The prompts tell the model to treat the resume as data and to never invent facts. AI output can still be wrong, which is why both pages say so.

The pipeline (PDF → text → model → structured data → feedback) follows the approach of the open-source [interviewstreet/hiring-agent](https://github.com/interviewstreet/hiring-agent) project, reimplemented inside this app. Unlike that tool, the review gives written feedback and no numeric score, because model scores vary from run to run.
