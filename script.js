const heroesData = [
  {
    id: "karvat",
    name: "КАРВАТ",
    fullName: "Владимир Николаевич Карват",
    title: "Первый Герой Беларуси (1996 г.)",
    desc: "Военный лётчик, подполковник. 23 мая 1996 года при выполнении ночного учебного полёта ценой собственной жизни увёл горящий самолёт Су-27УБ от населённых пунктов Арабовщина и Гатище Барановичского района.",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Vladimir_Karvat.jpg/400px-Vladimir_Karvat.jpg",
    qrLink: "https://be.wikipedia.org/wiki/Уладзімір_Мікалаевіч_Карват",
    tasks: [
      { q: "Решите уравнение: 2x + 10 = 26", a: "8", hint: "Вычтите 10 из обеих частей уравнения, а затем разделите результат на 2." },
      { q: "Вычислите: 15 × 4 - 18", a: "42", hint: "Сначала выполните умножение (15 × 4), а затем вычитание." },
      { q: "Найдите 25% от числа 120", a: "30", hint: "25% — это четвертая часть числа. Разделите 120 на 4." },
      { q: "Чему равен квадратный корень из 144 (√144)?", a: "12", hint: "Какое положительное число при умножении само на себя дает 144?" },
      { q: "Вычислите значение выражения: 3³ + 5", a: "32", hint: "3³ = 3 × 3 × 3 = 27. Затем прибавьте 5." },
      { q: "Найдите наибольший общий делитель (НОД) чисел 24 и 36", a: "12", hint: "Какое самое большое число делит и 24, и 36 без остатка?" }
    ]
  },
  {
    id: "dubko",
    name: "ДУБКО",
    fullName: "Александр Иосифович Дубко",
    title: "Герой Беларуси (2001 г.)",
    desc: "Белорусский государственный и сельскохозяйственный деятель. Внёс выдающийся вклад в развитие агропромышленного комплекса и социально-экономическое развитие Гродненской области.",
    photo: "https://upload.wikimedia.org/wikipedia/ru/8/87/Александр_Иосифович_Дубко.jpg",
    qrLink: "https://ru.wikipedia.org/wiki/Дубко,_Александр_Иосифович",
    tasks: [
      { q: "Площадь прямоугольного участка 48 м², а его длина 8 м. Найдите ширину.", a: "6", hint: "Площадь прямоугольника равна произведению длины на ширину (S = a × b)." },
      { q: "Найдите неизвестный член пропорции: 3 / 4 = x / 20", a: "15", hint: "Используйте основное свойство пропорции: произведение крайних членов равно произведению средних." },
      { q: "Вычислите: -15 + 28", a: "13", hint: "Из большего модуля вычтите меньший и поставьте знак большего по модулю числа." },
      { q: "Найдите 10% от 150 и прибавьте 7", a: "22", hint: "10% от 150 — это 15. Теперь прибавьте 7." },
      { q: "Решите уравнение: x / 5 = 7", a: "35", hint: "Умножьте обе части уравнения на 5." }
    ]
  }
];

let currentHero = null;
let currentTaskIndex = 0;
let unlockedLetters = [];

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("heroSelect");
  if (!select) return;

  heroesData.forEach((hero, index) => {
    const opt = document.createElement("option");
    opt.value = String(index);
    opt.textContent = `${hero.fullName} (${hero.name.length} букв)`;
    select.appendChild(opt);
  });

  loadHero();
});

// Загрузка выбранного героя
function loadHero() {
  const select = document.getElementById("heroSelect");
  if (!select) return;

  const index = Number(select.value);
  currentHero = heroesData[index];

  if (!currentHero) return;

  currentTaskIndex = 0;
  unlockedLetters = new Array(currentHero.name.length).fill(false);

  const heroCard = document.getElementById("heroCard");
  if (heroCard) heroCard.classList.add("hidden");

  const gameCard = document.querySelector(".game-card");
  if (gameCard) gameCard.classList.remove("hidden");

  renderWordGrid();
  loadTask();
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

  if (!currentHero || !taskStep || !taskQuestion || !answerInput || !feedbackMsg || !aiHintText) return;

  taskStep.textContent = `Буква ${currentTaskIndex + 1} из ${currentHero.name.length}`;
  taskQuestion.textContent = currentHero.tasks[currentTaskIndex].q;
  answerInput.value = "";
  feedbackMsg.textContent = "";
  aiHintText.classList.add("hidden");
}

// Проверка ответа
function checkAnswer() {
  if (!currentHero || currentTaskIndex >= currentHero.tasks.length) return;

  const userAns = document.getElementById("answerInput").value.trim();
  const correctAns = currentHero.tasks[currentTaskIndex].a;
  const feedback = document.getElementById("feedbackMsg");

  if (userAns === correctAns) {
    feedback.className = "feedback-msg correct";
    feedback.textContent = "Правильно! Открыта новая буква.";

    unlockedLetters[currentTaskIndex] = true;
    renderWordGrid();
    currentTaskIndex++;

    if (currentTaskIndex < currentHero.name.length) {
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
  if (!hintBox || !currentHero) return;

  const hint = currentHero.tasks[currentTaskIndex].hint;
  hintBox.innerHTML = `<strong>💡 ИИ-Тьютор:</strong> ${hint}`;
  hintBox.classList.remove("hidden");
}

// Завершение квеста и отгадывание слова
function finishQuest() {
  const gameCard = document.querySelector(".game-card");
  if (gameCard) gameCard.classList.add("hidden");

  const card = document.getElementById("heroCard");
  if (card) card.classList.remove("hidden");

  const heroPhoto = document.getElementById("heroPhoto");
  if (heroPhoto) heroPhoto.src = currentHero.photo;

  const heroName = document.getElementById("heroName");
  if (heroName) heroName.textContent = currentHero.fullName;

  const heroTitle = document.getElementById("heroTitle");
  if (heroTitle) heroTitle.textContent = currentHero.title;

  const heroDesc = document.getElementById("heroDesc");
  if (heroDesc) heroDesc.textContent = currentHero.desc;

  const qrContainer = document.getElementById("qrcode");
  if (qrContainer) {
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: currentHero.qrLink,
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
