document.addEventListener("DOMContentLoaded", function () {
  const screens = {
    start: document.getElementById("screen-start"),
    questions: document.getElementById("screen-questions"),
    processing: document.getElementById("screen-processing"),
    result: document.getElementById("screen-result"),
  };

  const questionSlides = document.querySelectorAll(".question-slide");
  const progressFill = document.getElementById("progress-fill");
  const currentQuestionSpan = document.getElementById("current-question");
  const prevButton = document.getElementById("prev-question");
  const nextButton = document.getElementById("next-question");
  const conhecerPlanoBtn = document.getElementById("conhecer-plano");

  const resultEssencialCorrida = document.getElementById("result-essencial-corrida");
  const resultEssencialTriathlon = document.getElementById("result-essencial-triathlon");
  const essencialColumn = document.getElementById("essencial-column");

  let currentQuestion = 1;
  const totalQuestions = questionSlides.length;
  let selectedModalidade = "";

  function showScreen(screenName) {
    Object.values(screens).forEach((screen) => screen.classList.remove("active"));
    screens[screenName].classList.add("active");
  }

  function showQuestion(questionNumber) {
    questionSlides.forEach((slide) => slide.classList.remove("active"));
    document.getElementById(`question-${questionNumber}`).classList.add("active");
    currentQuestionSpan.textContent = questionNumber;
    progressFill.style.width = `${(questionNumber / totalQuestions) * 100}%`;
    currentQuestion = questionNumber;
    prevButton.disabled = currentQuestion === 1;
  }

  function goToNextQuestion() {
    const selected = document.querySelector(`#question-${currentQuestion} .option.selected`);
    if (!selected) return;
    if (currentQuestion === totalQuestions) return processResult();
    showQuestion(currentQuestion + 1);
  }

  function processResult() {
    showScreen("processing");
    setTimeout(showResult, 1000);
  }

  function showResult() {
    if (resultEssencialCorrida) resultEssencialCorrida.classList.remove("active");
    if (resultEssencialTriathlon) resultEssencialTriathlon.classList.remove("active");

    if (selectedModalidade === "corrida") {
      if (resultEssencialCorrida) resultEssencialCorrida.classList.add("active");
      conhecerPlanoBtn.textContent = "CONHECER O PLANO ESSENCIAL DE CORRIDA";
    } else {
      if (resultEssencialTriathlon) resultEssencialTriathlon.classList.add("active");
      conhecerPlanoBtn.textContent = "CONHECER O PLANO ESSENCIAL DE TRIATHLON";
    }

    if (essencialColumn) essencialColumn.classList.add("highlighted");
    conhecerPlanoBtn.href = "../index.html#modalidades";
    showScreen("result");
  }

  document.getElementById("start-quiz")?.addEventListener("click", () => showScreen("questions"));

  document.querySelectorAll(".option").forEach((option) => {
    option.addEventListener("click", function () {
      const parent = this.closest(".question-slide");
      parent.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
      this.classList.add("selected");
      if (currentQuestion === 1) selectedModalidade = this.dataset.value;
      setTimeout(goToNextQuestion, 250);
    });
  });

  prevButton?.addEventListener("click", () => {
    if (currentQuestion > 1) showQuestion(currentQuestion - 1);
  });

  nextButton?.addEventListener("click", goToNextQuestion);

  document.getElementById("refazer-teste")?.addEventListener("click", function () {
    document.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
    if (essencialColumn) essencialColumn.classList.remove("highlighted");
    currentQuestion = 1;
    selectedModalidade = "";
    showQuestion(1);
    showScreen("questions");
  });

  showScreen("start");
  showQuestion(1);
});
