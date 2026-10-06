const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash"
];

const MODELS = process.env.GEMINI_MODEL
  ? process.env.GEMINI_MODEL.split(",").map(m => m.trim()).filter(Boolean)
  : DEFAULT_MODELS;

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
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

function extractText(interaction) {
  if (typeof interaction.output_text === "string" && interaction.output_text.trim()) {
    return interaction.output_text;
  }

  const parts = (interaction.steps || [])
    .flatMap(step => Array.isArray(step.content) ? step.content : [])
    .filter(part => part.type === "text" || part.type === "output_text")
    .map(part => part.text || "");
  if (parts.length === 0) {
    throw new Error("Gemini не вернул текст заданий.");
  }
  return parts.join("");
}

function parseTasks(text, count) {
  const result = JSON.parse(text);
  if (!Array.isArray(result.tasks) || result.tasks.length !== count) {
    throw new Error(`Gemini должен вернуть ровно ${count} заданий.`);
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
      throw new Error("Gemini вернул задание в неверном формате.");
    }
    if (/^\s*(?:буква\s+)?[А-ЯЁ]\s*[—–:-]/i.test(task.question)) {
      throw new Error("Gemini добавил букву в условие задания.");
    }
  }
  return result.tasks.map(({ question, answer, hint }) => ({
    question: question.trim(),
    answer: answer.trim(),
    hint: hint.trim()
  }));
}

async function generateTasks(request, response) {
  if (!GEMINI_API_KEY) {
    sendJson(response, 503, { error: "Сервер не настроен: добавьте GEMINI_API_KEY в Render Environment." });
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

  let lastError = null;

  for (const model of MODELS) {
    try {
      const geminiResponse = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          model: model,
          input: prompt,
          store: false,
          generation_config: { thinking_level: "low" }
        }),
        signal: AbortSignal.timeout(60_000)
      });

      let interaction;
      try {
        interaction = await geminiResponse.json();
      } catch {
        throw new Error(`Модель ${model}: вернула некорректный HTTP/JSON ответ.`);
      }

      if (!geminiResponse.ok) {
        const details = interaction.error?.message || `HTTP ${geminiResponse.status}`;
        if (geminiResponse.status === 401 || geminiResponse.status === 403) {
          // Если API-ключ невалиден, перебор моделей не поможет
          throw new Error("Gemini отклонил API-ключ. Проверьте GEMINI_API_KEY.");
        }
        throw new Error(`Модель ${model} завершилась с ошибкой HTTP ${geminiResponse.status}: ${details}`);
      }

      const tasksText = extractText(interaction);
      const tasks = parseTasks(tasksText, name.length);

      return tasks;

    } catch (error) {
      console.warn(`Ошибка при работе с моделью ${model}: ${error.message}`);
      lastError = error;
      
      if (error.message.includes("GEMINI_API_KEY")) {
        throw error;
      }
    }
  }

  console.error(`Все модели из списка [${MODELS.join(", ")}] завершились с ошибками для ${heroId}.`);
  throw new Error("Не удалось сгенерировать задания ни с одной из доступных моделей Gemini. Повторите попытку позже.");
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Hero quest server listening on port ${PORT}`);
});