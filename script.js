// Browser-side key is visible to anyone who visits the deployed site.
const GEMINI_API_KEY = "AQ.Ab8RN6Lu8UDLXdlZdiZM-36B8mXPezwn81ADG9jwVllyj8aUcA";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_MODEL = "gemini-3.8-flash";

const heroesData = [
  {
    id: "karvat",
    name: "КАРВАТ",
    fullName: "Владимир Николаевич Карват",
    title: "Первый Герой Беларуси (1996 г.)",
    desc: "Военный лётчик, подполковник. 23 мая 1996 года при выполнении ночного учебного полёта ценой собственной жизни увёл горящий самолёт Су-27УБ от населённых пунктов Арабовщина и Гатище Барановичского района.",
    photo: "assets/karvat.png",
    qrLink: "https://be.wikipedia.org/wiki/Уладзімір_Мікалаевіч_Карват"
  },
  {
    id: "dubko",
    name: "ДУБКО",
    fullName: "Александр Иосифович Дубко",
    title: "Герой Беларуси (2001 г.)",
    desc: "Белорусский государственный и сельскохозяйственный деятель. Внёс выдающийся вклад в развитие агропромышленного комплекса и социально-экономическое развитие Гродненской области.",
    photo: "assets/dubko.png",
    qrLink: "https://ru.wikipedia.org/wiki/Дубко,_Александр_Иосифович"
  },
  {
    id: "karchmit",
    name: "КАРЧМИТ",
    fullName: "Михаил Александрович Карчмит",
    title: "Герой Беларуси (2001 г.)",
    desc: "Белорусский аграрий и руководитель сельскохозяйственного предприятия. Получил звание за вклад в развитие сельского хозяйства и социально-экономическое развитие региона.",
    photo: "assets/karchmit.png",
    qrLink: "https://ru.wikipedia.org/wiki/Михаил_Александрович_Карчмит"
  },
  {
    id: "kremko",
    name: "КРЕМКО",
    fullName: "Виталий Ильич Кремко",
    title: "Герой Беларуси (2001 г.)",
    desc: "Белорусский руководитель сельскохозяйственного предприятия. Удостоен звания за значительный вклад в развитие аграрного производства.",
    photo: "assets/kremko.png",
    qrLink: "https://ru.wikipedia.org/wiki/Виталий_Ильич_Кремко"
  },
  {
    id: "mariev",
    name: "МАРИЕВ",
    fullName: "Павел Лукьянович Мариев",
    title: "Герой Беларуси (2001 г.)",
    desc: "Белорусский инженер и промышленный руководитель, внёсший большой вклад в развитие автомобилестроения и отечественной промышленности.",
    photo: "assets/mariev.png",
    qrLink: "https://ru.wikipedia.org/wiki/Павел_Лукьянович_Мариев"
  },
  {
    id: "vysotsky",
    name: "ВЫСОЦКИЙ",
    fullName: "Михаил Степанович Высоцкий",
    title: "Герой Беларуси (2006 г.)",
    desc: "Белорусский учёный в области машиностроения, один из создателей отечественных грузовых автомобилей и организатор научных исследований.",
    photo: "assets/vysotsky.png",
    qrLink: "https://ru.wikipedia.org/wiki/Михаил_Степанович_Высоцкий"
  },
  {
    id: "prokopovich",
    name: "ПРОКОПОВИЧ",
    fullName: "Пётр Петрович Прокопович",
    title: "Герой Беларуси (2006 г.)",
    desc: "Белорусский государственный деятель и инженер-строитель. Удостоен высшего государственного звания за многолетний труд и заслуги перед страной.",
    photo: "assets/prokopovich.png",
    qrLink: "https://ru.wikipedia.org/wiki/Пётр_Петрович_Прокопович"
  },
  {
    id: "revyako",
    name: "РЕВЯКО",
    fullName: "Василий Афанасьевич Ревяко",
    title: "Герой Беларуси (2006 г.)",
    desc: "Белорусский аграрий и руководитель сельскохозяйственного предприятия. Отмечен за вклад в развитие сельского хозяйства.",
    photo: "assets/revyako.png",
    qrLink: "https://ru.wikipedia.org/wiki/Василий_Афанасьевич_Ревяко"
  },
  {
    id: "savitsky",
    name: "САВИЦКИЙ",
    fullName: "Михаил Андреевич Савицкий",
    title: "Герой Беларуси (2006 г.)",
    desc: "Белорусский художник, педагог и общественный деятель. Его произведения, посвящённые истории и судьбе народа, получили широкое признание.",
    photo: "assets/savitsky.png",
    qrLink: "https://ru.wikipedia.org/wiki/Михаил_Андреевич_Савицкий"
  },
  {
    id: "filaret",
    name: "ФИЛАРЕТ",
    fullName: "Филарет (Кирилл Вахромеев)",
    title: "Герой Беларуси (2006 г.)",
    desc: "Митрополит Филарет — православный религиозный деятель, много лет возглавлявший Белорусскую православную церковь и содействовавший межконфессиональному диалогу.",
    photo: "assets/filaret.png",
    qrLink: "https://ru.wikipedia.org/wiki/Филарет_(Вахромеев)"
  },
  {
    id: "domracheva",
    name: "ДОМРАЧЕВА",
    fullName: "Дарья Владимировна Домрачева",
    title: "Герой Беларуси (2014 г.)",
    desc: "Белорусская биатлонистка, четырёхкратная олимпийская чемпионка. Стала первой женщиной, удостоенной звания Герой Беларуси.",
    photo: "assets/domracheva.png",
    qrLink: "https://ru.wikipedia.org/wiki/Дарья_Владимировна_Домрачева"
  },
  {
    id: "kukonenko",
    name: "КУКОНЕНКО",
    fullName: "Никита Борисович Куконенко",
    title: "Герой Беларуси (2021 г.)",
    desc: "Военный лётчик Вооружённых Сил Беларуси. Посмертно удостоен звания за мужество и героизм, проявленные при исполнении воинского долга.",
    photo: "assets/kukonenko.png",
    qrLink: "https://ru.wikipedia.org/wiki/Никита_Борисович_Куконенко"
  },
  {
    id: "nichiporchik",
    name: "НИЧИПОРЧИК",
    fullName: "Андрей Владимирович Ничипорчик",
    title: "Герой Беларуси (2021 г.)",
    desc: "Военный лётчик Вооружённых Сил Беларуси. Посмертно удостоен звания за мужество и героизм, проявленные при исполнении воинского долга.",
    photo: "assets/nichiporchik.png",
    qrLink: "https://ru.wikipedia.org/wiki/Андрей_Владимирович_Ничипорчик"
  },
  {
    id: "vasilevskaya",
    name: "ВАСИЛЕВСКАЯ",
    fullName: "Марина Витальевна Василевская",
    title: "Герой Беларуси (2024 г.)",
    desc: "Белорусская космонавтка, первая гражданка Беларуси, совершившая космический полёт. Удостоена звания Герой Беларуси в 2024 году.",
    photo: "assets/vasilevskaya.png",
    qrLink: "https://ru.wikipedia.org/wiki/Василевская,_Марина_Витальевна"
  }
];

let currentHero = null;
let currentTaskIndex = 0;
let unlockedLetters = [];
let currentTasks = [];
let heroLoadRequest = 0;

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("heroSelect");
  if (!select) return;

  heroesData.forEach((_, index) => {
    const opt = document.createElement("option");
    opt.value = String(index);
    opt.textContent = `Квест ${index + 1}`;
    select.appendChild(opt);
  });

  loadHero();
});

// Загрузка выбранного героя
async function loadHero() {
  const select = document.getElementById("heroSelect");
  if (!select) return;

  const index = Number(select.value);
  currentHero = heroesData[index];

  if (!currentHero) return;

  const requestId = ++heroLoadRequest;
  currentTaskIndex = 0;
  unlockedLetters = new Array(currentHero.name.length).fill(false);
  currentTasks = [];

  const heroCard = document.getElementById("heroCard");
  if (heroCard) heroCard.classList.add("hidden");

  const gameCard = document.querySelector(".game-card");
  if (gameCard) gameCard.classList.remove("hidden");

  renderWordGrid();

  const taskStep = document.getElementById("taskStep");
  const taskQuestion = document.getElementById("taskQuestion");
  const feedbackMsg = document.getElementById("feedbackMsg");
  const answerInput = document.getElementById("answerInput");
  const submitButton = document.getElementById("submitBtn");
  const hintButton = document.getElementById("hintBtn");
  const hintBox = document.getElementById("aiHintText");

  if (taskStep) taskStep.textContent = "Создание заданий";
  if (taskQuestion) taskQuestion.textContent = "Gemini подбирает математические примеры...";
  if (feedbackMsg) {
    feedbackMsg.className = "feedback-msg";
    feedbackMsg.textContent = "";
  }
  if (answerInput) answerInput.disabled = true;
  if (submitButton) submitButton.disabled = true;
  if (hintButton) hintButton.disabled = true;
  if (hintBox) hintBox.classList.add("hidden");

  try {
    if (GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
      throw new Error("Добавьте API-ключ Gemini в GEMINI_API_KEY в script.js.");
    }

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input: `Составь ровно ${currentHero.name.length} разных математических заданий для школьника 5 класса на выполнение арифметических действий с натуральными числами. Не используй фамилии, имена, буквы алфавита или пояснения о том, какая буква откроется. Не добавляй к заданиям названия тем или метки вроде «Д — Делимость» и «Буква Д». Каждое условие должно сразу начинаться с самостоятельной математической задачи, без буквенных заголовков и подсказок, связанных с буквами. Ответ — короткое однозначное натуральное число; проверь вычисления. Для каждой задачи дай краткую наводящую подсказку, не сообщающую ответ напрямую. Верни только JSON без Markdown в формате {"tasks":[{"question":"условие","answer":"ответ","hint":"подсказка"}]}.`,
        store: false,
        generation_config: { thinking_level: "low" }
      })
    });
    const responseBody = await response.json();

    if (!response.ok) {
      const errorMessage = responseBody.error?.message || `Ошибка Gemini API (${response.status})`;
      throw new Error(errorMessage);
    }

    const generatedText = responseBody.output_text ||
      responseBody.output
        ?.flatMap(step => step.content || [])
        .filter(item => item.type === "text" || item.type === "output_text")
        .map(item => item.text || "")
        .join("") ||
      responseBody.steps
        ?.flatMap(step => step.content || [])
        .filter(item => item.type === "text" || item.type === "output_text")
        .map(item => item.text || "")
        .join("");
    if (!generatedText) {
      throw new Error("Gemini не вернул текст заданий. Попробуйте ещё раз.");
    }
    const result = JSON.parse(generatedText);

    if (
      !Array.isArray(result.tasks) ||
      result.tasks.length !== currentHero.name.length ||
      result.tasks.some(task =>
        !task ||
        typeof task.question !== "string" ||
        typeof task.answer !== "string" ||
        typeof task.hint !== "string"
      )
    ) {
      throw new Error("Gemini вернул задания в неверном формате. Попробуйте выбрать героя ещё раз.");
    }

    if (result.tasks.some(task => /^\s*(?:буква\s+)?[А-ЯЁ]\s*[—–:-]/i.test(task.question))) {
      throw new Error("Gemini добавил букву в условие задачи. Выберите героя ещё раз, чтобы сгенерировать задания без подсказки.");
    }

    if (requestId !== heroLoadRequest) return;
    currentTasks = result.tasks;
    if (answerInput) answerInput.disabled = false;
    if (submitButton) submitButton.disabled = false;
    if (hintButton) hintButton.disabled = false;
    loadTask();
  } catch (error) {
    if (requestId !== heroLoadRequest) return;
    if (taskStep) taskStep.textContent = "Не удалось создать задания";
    if (taskQuestion) taskQuestion.textContent = "Проверьте подключение к интернету и настройки Gemini API.";
    if (feedbackMsg) {
      feedbackMsg.className = "feedback-msg incorrect";
      feedbackMsg.textContent = error.message;
    }
  }
}

// Отображение сетки букв
function renderWordGrid() {
  const container = document.getElementById("wordContainer");
  if (!container || !currentHero) return;

  container.innerHTML = "";

  for (let i = 0; i < currentHero.name.length; i++) {
    const box = document.createElement("div");
    box.className = `letter-box ${unlockedLetters[i] ? "" : "locked"}`;
    box.textContent = unlockedLetters[i] ? currentHero.name[i] : "?";
    container.appendChild(box);
  }
}

// Загрузка текущей задачи
function loadTask() {
  const taskStep = document.getElementById("taskStep");
  const taskQuestion = document.getElementById("taskQuestion");
  const answerInput = document.getElementById("answerInput");
  const feedbackMsg = document.getElementById("feedbackMsg");
  const aiHintText = document.getElementById("aiHintText");

  if (!currentHero || !currentTasks.length || !taskStep || !taskQuestion || !answerInput || !feedbackMsg || !aiHintText) return;

  taskStep.textContent = `Буква ${currentTaskIndex + 1} из ${currentHero.name.length}`;
  taskQuestion.textContent = currentTasks[currentTaskIndex].question;
  answerInput.value = "";
  feedbackMsg.textContent = "";
  aiHintText.classList.add("hidden");
}

// Проверка ответа
function checkAnswer() {
  if (!currentHero || currentTaskIndex >= currentTasks.length) return;

  const userAns = document.getElementById("answerInput").value.trim();
  const correctAns = currentTasks[currentTaskIndex].answer;
  const feedback = document.getElementById("feedbackMsg");

  if (userAns === correctAns) {
    feedback.className = "feedback-msg correct";
    feedback.textContent = "Правильно! Открыта новая буква.";

    unlockedLetters[currentTaskIndex] = true;
    renderWordGrid();
    currentTaskIndex++;

    if (currentTaskIndex < currentTasks.length) {
      setTimeout(loadTask, 1200);
    } else {
      setTimeout(finishQuest, 1200);
    }
  } else {
    feedback.className = "feedback-msg incorrect";
    feedback.textContent = "Неверно. Попробуйте ещё раз или воспользуйтесь ИИ-подсказкой.";
  }
}

// Имитация Сократовского ИИ-тьютора (выдача наводящей подсказки)
function getAIHint() {
  const hintBox = document.getElementById("aiHintText");
  if (!hintBox || !currentHero || !currentTasks[currentTaskIndex]) return;

  const hint = currentTasks[currentTaskIndex].hint;
  hintBox.textContent = `💡 ИИ-Тьютор: ${hint}`;
  hintBox.classList.remove("hidden");
}

// Завершение квеста и отгадывание слова
function finishQuest() {
  const gameCard = document.querySelector(".game-card");
  if (gameCard) gameCard.classList.add("hidden");

  const card = document.getElementById("heroCard");
  if (card) card.classList.remove("hidden");

  const heroPhoto = document.getElementById("heroPhoto");
  if (heroPhoto) {
    heroPhoto.classList.toggle("hidden", !currentHero.photo);
    if (currentHero.photo) heroPhoto.src = currentHero.photo;
  }

  const heroName = document.getElementById("heroName");
  if (heroName) heroName.textContent = currentHero.fullName;

  const heroTitle = document.getElementById("heroTitle");
  if (heroTitle) heroTitle.textContent = currentHero.title;

  const heroDesc = document.getElementById("heroDesc");
  if (heroDesc) heroDesc.textContent = currentHero.desc;

  const qrContainer = document.getElementById("qrcode");
  if (qrContainer) {
    qrContainer.innerHTML = "";
    const qrText = encodeURI(currentHero.qrLink);

    new QRCode(qrContainer, {
      text: qrText,
      width: 140,
      height: 140,
      correctLevel: QRCode.CorrectLevel.H,
      margin: 2
    });
  }
}

// Перезапуск
function restartQuest() {
  loadHero();
}
