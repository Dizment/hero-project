const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 10000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();

const DEFAULT_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-pro",
  "google/gemma-3-27b-it"
];

const MODELS = process.env.GEMINI_MODEL || process.env.OPENROUTER_MODEL
  ? (process.env.GEMINI_MODEL || process.env.OPENROUTER_MODEL).split(",").map(m => m.trim()).filter(Boolean)
  : DEFAULT_MODELS;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_BODY_BYTES = 4096;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimits = new Map();
const TASK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const taskCache = new Map();
const pendingTasks = new Map();

const heroes = new Map([
  ["karvat", "КАРВАТ"],
  ["dubko", "ДУБКО"],
  ["karchmit", "КАРЧМИТ"],
  ["kremko", "КРЕМКО"],
  ["mariev", "МАРИЕВ"],
  ["vysotsky", "ВЫСОЦКИЙ"],
  ["prokopovich", "ПРОКОПОВИЧ"],
  ["revyako", "РЕВЯКО"],
  ["savitsky", "САВИЦКИЙ"],
  ["filaret", "ФИЛАРЕТ"],
  ["domracheva", "ДОМРАЧЕВА"],
  ["kukonenko", "КУКОНЕНКО"],
  ["nichiporchik", "НИЧИПОРЧИК"],
  ["vasilevskaya", "ВАСИЛЕВСКАЯ"]
]);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function sendJson(response, status, data) {
  const body = JSON.stringify(data);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(body);
}

function clientIp(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.socket.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  if (rateLimits.size > 1000) {
    for (const [knownIp, entry] of rateLimits) {
      if (now - entry.startedAt >= RATE_LIMIT_WINDOW_MS) rateLimits.delete(knownIp);
    }
  }
  const entry = rateLimits.get(ip);
  if (!entry || now - entry.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    request.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Запрос слишком большой."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Некорректный JSON в запросе."));
      }
    });
    request.on("error", reject);
  });
}

function extractText(data) {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) {
    return content;
  }
  throw new Error("OpenRouter не вернул текст заданий.");
}

function parseTasks(text, count) {
  const cleanedText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const result = JSON.parse(cleanedText);
  if (!Array.isArray(result.tasks) || result.tasks.length !== count) {
    throw new Error(`Модель должна вернуть ровно ${count} заданий.`);
  }
  for (const task of result.tasks) {
    if (
      !task ||
      typeof task.question !== "string" ||
      typeof task.answer !== "string" ||
      typeof task.hint !== "string" ||
      !task.question.trim() ||
      !task.answer.trim() ||
      !task.hint.trim()
    ) {
      throw new Error("Модель вернула задание в неверном формате.");
    }
    if (/^\s*(?:буква\s+)?[А-ЯЁ]\s*[—–:-]/i.test(task.question)) {
      throw new Error("Модель добавила букву в условие задания.");
    }
  }
  return result.tasks.map(({ question, answer, hint }) => ({
    question: question.trim(),
    answer: answer.trim(),
    hint: hint.trim()
  }));
}

async function generateTasks(request, response) {
  if (!OPENROUTER_API_KEY) {
    sendJson(response, 503, { error: "Сервер не настроен: добавьте OPENROUTER_API_KEY в Render Environment." });
    return;
  }

  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    if (!response.headersSent && !response.destroyed) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  const name = payload && heroes.get(payload.heroId);
  if (!name) {
    sendJson(response, 400, { error: "Выбран неизвестный квест." });
    return;
  }

  const cached = taskCache.get(payload.heroId);
  if (cached && cached.expiresAt > Date.now()) {
    sendJson(response, 200, { tasks: cached.tasks });
    return;
  }

  if (isRateLimited(clientIp(request))) {
    sendJson(response, 429, { error: "Слишком много запросов. Попробуйте через минуту." });
    return;
  }

  let taskRequest = pendingTasks.get(payload.heroId);
  if (!taskRequest) {
    taskRequest = generateTasksForHero(payload.heroId, name)
      .then(tasks => {
        taskCache.set(payload.heroId, { tasks, expiresAt: Date.now() + TASK_CACHE_TTL_MS });
        return tasks;
      })
      .finally(() => pendingTasks.delete(payload.heroId));
    pendingTasks.set(payload.heroId, taskRequest);
  }

  try {
    sendJson(response, 200, { tasks: await taskRequest });
  } catch (error) {
    sendJson(response, 502, { error: error.message });
  }
}

async function generateTasksForHero(heroId, name) {
  const prompt = `Составь ровно ${name.length} разных математических заданий для школьника 5 класса на выполнение арифметических действий с натуральными числами. Не используй фамилии, имена, буквы алфавита или пояснения о том, какая буква откроется. Не добавляй к заданиям названия тем или метки вроде «Д — Делимость» и «Буква Д». Каждое условие должно сразу начинаться с самостоятельной математической задачи, без буквенных заголовков и подсказок, связанных с буквами. Ответ — короткое однозначное натуральное число; проверь вычисления. Для каждой задачи дай краткую наводящую подсказку, не сообщающую ответ напрямую. Верни только JSON без Markdown в формате {"tasks":[{"question":"условие","answer":"ответ","hint":"подсказка"}]}.`;

  const MAX_RETRIES = 3;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const routerResponse = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.RENDER_EXTERNAL_URL || "http://localhost",
            "X-Title": "Hero Quest Server"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1500
          }),
          signal: AbortSignal.timeout(60_000)
        });

        let responseData;
        try {
          responseData = await routerResponse.json();
        } catch {
          throw new Error(`Модель ${model}: вернула некорректный HTTP/JSON ответ.`);
        }

        if (!routerResponse.ok) {
          const details = responseData.error?.message || `HTTP ${routerResponse.status}`;
          if (routerResponse.status === 401 || routerResponse.status === 403) {
            throw new Error("OpenRouter отклонил API-ключ. Проверьте OPENROUTER_API_KEY.");
          }

          if ((routerResponse.status === 503 || routerResponse.status === 429 || routerResponse.status >= 500) && attempt < MAX_RETRIES) {
            const delayMs = attempt * 1500;
            console.warn(`[${model}] Временная ошибка HTTP ${routerResponse.status}. Повтор (${attempt}/${MAX_RETRIES}) через ${delayMs}мс...`);
            await sleep(delayMs);
            continue;
          }

          throw new Error(`Модель ${model} завершилась с ошибкой HTTP ${routerResponse.status}: ${details}`);
        }

        const tasksText = extractText(responseData);
        const tasks = parseTasks(tasksText, name.length);

        return tasks;

      } catch (error) {
        if (error.message.includes("OPENROUTER_API_KEY")) {
          throw error;
        }

        if (attempt === MAX_RETRIES) {
          console.warn(`Ошибка при работе с моделью ${model} после ${MAX_RETRIES} попыток: ${error.message}`);
        }
      }
    }
  }

  console.error(`Все модели из списка [${MODELS.join(", ")}] завершились с ошибками для ${heroId}.`);
  throw new Error("Не удалось сгенерировать задания ни с одной из доступных моделей OpenRouter. Повторите попытку позже.");
}

function serveStatic(request, response) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(ROOT, relativePath);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": stats.size,
      "X-Content-Type-Options": "nosniff"
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      fs.createReadStream(filePath).pipe(response);
    }
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/generate-tasks") {
    generateTasks(request, response);
    return;
  }
  if ((request.method === "GET" || request.method === "HEAD") && request.url.startsWith("/")) {
    serveStatic(request, response);
    return;
  }
  response.writeHead(405, { Allow: "GET, HEAD, POST" });
  response.end("Method not allowed");
});

const SELF_URL = process.env.RENDER_EXTERNAL_URL || "https://hero-project-ce4p.onrender.com";
const PING_INTERVAL_MS = 10 * 60 * 1000;

function startSelfPing() {
  setInterval(() => {
    fetch(SELF_URL)
      .then(res => console.log(`[Self-Ping] Статус: ${res.status} (${new Date().toLocaleTimeString()})`))
      .catch(err => console.warn(`[Self-Ping] Ошибка: ${err.message}`));
  }, PING_INTERVAL_MS);
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Hero quest server listening on port ${PORT}`);
  startSelfPing();
});