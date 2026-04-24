const ACTIVE_EXAM_ID = "507f1f77bcf86cd799439041";
const COMPLETED_EXAM_ID = "507f1f77bcf86cd799439042";
const MCQ_BANK_ID = "507f1f77bcf86cd799439043";
const FLASHCARD_DECK_ID = "507f1f77bcf86cd799439044";

const activeExam = {
  _id: ACTIVE_EXAM_ID,
  kind: "exam",
  title: "Database Midterm",
  subject: "Database Systems",
  semester: 1,
  duration: 45,
  totalMarks: 50,
  status: "Upcoming",
  viewerHasSubmitted: false,
  scheduledAt: "2026-04-01T09:00:00.000Z",
  startTime: "09:00",
  questions: [
    {
      question: "Which language is commonly used to query relational databases?",
      options: ["HTML", "SQL", "CSS", "JPEG"],
      correctAnswer: "SQL",
      explanation: "SQL is the standard language used to query relational databases.",
    },
  ],
};

const completedExam = {
  _id: COMPLETED_EXAM_ID,
  kind: "exam",
  title: "Networks Quiz",
  subject: "Computer Networks",
  semester: 1,
  duration: 30,
  totalMarks: 25,
  status: "Completed",
  viewerHasSubmitted: true,
  scheduledAt: "2026-04-10T09:00:00.000Z",
  startTime: "09:00",
  attemptCount: 8,
  questions: [
    {
      question: "What does DNS resolve?",
      options: ["Ports", "Domain names", "Passwords", "Pixels"],
      correctAnswer: "Domain names",
      explanation: "DNS maps domain names to IP addresses.",
    },
  ],
};

const mcqBankSet = {
  _id: MCQ_BANK_ID,
  id: MCQ_BANK_ID,
  kind: "mcq_bank",
  title: "Networking Fundamentals",
  subject: "Computer Networks",
  semester: 1,
  duration: 20,
  totalMarks: 10,
  questionCount: 1,
  questions: [
    {
      question: "Which protocol is used to load secure websites?",
      options: ["HTTP", "HTTPS", "FTP", "SMTP"],
      correctAnswer: "HTTPS",
      explanation: "HTTPS encrypts web traffic using TLS.",
    },
  ],
};

const flashcardDeck = {
  _id: FLASHCARD_DECK_ID,
  id: FLASHCARD_DECK_ID,
  title: "SQL Revision Deck",
  subject: "Database Systems",
  semester: 1,
  cardCount: 2,
  isAiGenerated: true,
  cards: [
    {
      question: "What does SQL stand for?",
      answer: "Structured Query Language.",
    },
    {
      question: "What does SELECT do?",
      answer: "It retrieves rows from one or more tables.",
    },
  ],
};

function dashboardPerformance() {
  return {
    overall: { avgPercentage: 78, attemptCount: 2 },
    summary: {
      totalAttempts: 2,
      uniqueExamCount: 2,
      bestPercentage: 88,
      lastSubmittedAt: "2026-04-20T08:00:00.000Z",
      strongestSubject: { subject: "Database Systems", avgPercentage: 88 },
      weakestSubject: { subject: "Computer Networks", avgPercentage: 68 },
    },
    bySemester: [{ semester: 1, avgPercentage: 78, attemptCount: 2 }],
    subjectPerformance: [
      { subject: "Database Systems", avgPercentage: 88, attemptCount: 1 },
      { subject: "Computer Networks", avgPercentage: 68, attemptCount: 1 },
    ],
    skillRadar: [
      { name: "Database Systems", value: 88 },
      { name: "Computer Networks", value: 68 },
    ],
    recentAttempts: [
      {
        id: "attempt-1",
        title: "Networks Quiz",
        subject: "Computer Networks",
        semester: 1,
        score: 17,
        totalMarks: 25,
        percentage: 68,
        submittedAt: "2026-04-20T08:00:00.000Z",
      },
    ],
  };
}

function examResult(exam = activeExam) {
  return {
    performance: {
      score: exam.totalMarks,
      totalMarks: exam.totalMarks,
      submittedAt: "2026-04-24T08:00:00.000Z",
      exam: {
        title: exam.title,
        subject: exam.subject,
        semester: exam.semester,
      },
      reviewedAnswers: [
        {
          questionIndex: 0,
          question: exam.questions[0].question,
          selectedOption: exam.questions[0].correctAnswer,
          correctAnswer: exam.questions[0].correctAnswer,
          isCorrect: true,
          explanation: exam.questions[0].explanation,
        },
      ],
    },
  };
}

function futureDateValue() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function mockSmartLearningSystemApis() {
  cy.intercept("GET", /\/api\/assessment\/exams(\?.*)?$/, {
    statusCode: 200,
    body: { exams: [activeExam, completedExam] },
  }).as("examList");

  cy.intercept("GET", `**/api/assessment/exams/${ACTIVE_EXAM_ID}`, {
    statusCode: 200,
    body: { exam: activeExam, viewerHasSubmitted: false },
  }).as("activeExam");

  cy.intercept("GET", `**/api/assessment/exams/${COMPLETED_EXAM_ID}`, {
    statusCode: 200,
    body: { exam: completedExam, viewerHasSubmitted: true },
  }).as("completedExam");

  cy.intercept("GET", `**/api/assessment/exams/${MCQ_BANK_ID}`, {
    statusCode: 200,
    body: { exam: mcqBankSet, viewerHasSubmitted: false },
  }).as("mcqAssessment");

  cy.intercept("GET", `**/api/assessment/exams/${ACTIVE_EXAM_ID}/result`, {
    statusCode: 200,
    body: examResult(activeExam),
  }).as("activeExamResult");

  cy.intercept("GET", `**/api/assessment/exams/${COMPLETED_EXAM_ID}/result`, {
    statusCode: 200,
    body: examResult(completedExam),
  }).as("completedExamResult");

  cy.intercept("POST", `**/api/assessment/exams/${ACTIVE_EXAM_ID}/submit`, {
    statusCode: 200,
    body: { message: "Exam submitted successfully." },
  }).as("submitExam");

  cy.intercept("POST", /\/api\/assessment\/exams$/, (req) => {
    req.reply({
      statusCode: 201,
      body: {
        exam: {
          _id: req.body?.kind === "mcq_bank" ? MCQ_BANK_ID : ACTIVE_EXAM_ID,
          ...req.body,
        },
      },
    });
  }).as("saveAssessment");

  cy.intercept("PATCH", /\/api\/assessment\/exams\/[a-f0-9]{24}$/, (req) => {
    req.reply({
      statusCode: 200,
      body: {
        exam: {
          _id: req.url.includes(MCQ_BANK_ID) ? MCQ_BANK_ID : ACTIVE_EXAM_ID,
          ...req.body,
        },
      },
    });
  }).as("updateAssessment");

  cy.intercept("DELETE", /\/api\/assessment\/exams\/[a-f0-9]{24}$/, {
    statusCode: 200,
    body: { message: "Deleted successfully." },
  }).as("deleteAssessment");

  cy.intercept("GET", /\/api\/assessment\/performance\/dashboard(\?.*)?$/, {
    statusCode: 200,
    body: dashboardPerformance(),
  }).as("performance");

  cy.intercept("GET", /\/api\/flashcards(\?.*)?$/, {
    statusCode: 200,
    body: { decks: [flashcardDeck] },
  }).as("flashcardDecks");

  cy.intercept("GET", `**/api/flashcards/${FLASHCARD_DECK_ID}`, {
    statusCode: 200,
    body: { deck: flashcardDeck },
  }).as("flashcardDeck");

  cy.intercept("DELETE", `**/api/flashcards/${FLASHCARD_DECK_ID}`, {
    statusCode: 200,
    body: { message: "Deck deleted successfully." },
  }).as("deleteFlashcardDeck");

  cy.intercept("GET", /\/api\/mcq-bank(\?.*)?$/, {
    statusCode: 200,
    body: {
      sets: [mcqBankSet],
      filters: { subjects: ["Computer Networks"] },
    },
  }).as("mcqBankSets");

  cy.intercept("GET", `**/api/mcq-bank/${MCQ_BANK_ID}`, {
    statusCode: 200,
    body: { set: mcqBankSet },
  }).as("mcqBankSet");

  cy.intercept("POST", /\/api\/content\/generate$/, (req) => {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const meta = {
      topic: body.topic || "Binary Search Trees",
      subject: body.subject || "Data Structures",
      semester: Number(body.semester || 1),
    };

    if (body.type === "mcq") {
      req.reply({
        statusCode: 200,
        body: {
          kind: "mcq",
          meta,
          data: {
            questions: [
              {
                question: "What is the root node in a binary search tree?",
                options: ["Top node", "Leaf node", "Null node", "Duplicate node"],
                correctAnswer: "Top node",
                explanation: "The root is the first node in the tree.",
              },
            ],
          },
        },
      });
      return;
    }

    if (body.type === "flashcards") {
      req.reply({
        statusCode: 200,
        body: {
          kind: "flashcards",
          meta,
          data: {
            cards: [
              {
                question: "What ordering rule does a BST follow?",
                answer: "Left children are smaller and right children are larger.",
              },
            ],
          },
        },
      });
      return;
    }

    req.reply({
      statusCode: 200,
      body: {
        kind: "notes",
        meta,
        data: {
          markdown:
            "# Binary Search Trees\n\n## Core idea\n\n- Root: The top node starts the tree.\n- Ordering: Smaller values go left and larger values go right.",
        },
      },
    });
  }).as("generateContent");

  cy.intercept("POST", /\/api\/content\/flashcard-decks$/, {
    statusCode: 201,
    body: { deck: flashcardDeck },
  }).as("saveFlashcardDeck");
}

function openAiTab(label) {
  cy.contains("a", label).click({ force: true });
}

function fillAssessmentQuestion(correctAnswer) {
  cy.get('textarea[placeholder="Enter the question"]')
    .first()
    .clear()
    .type("Which language is used for relational database queries?");
  cy.get('input[placeholder="Enter option A"]').clear().type("Structured Query Language");
  cy.get('input[placeholder="Enter option B"]').clear().type("Hyper Text Markup Language");
  cy.get('input[placeholder="Enter option C"]').clear().type("Cascading Style Sheets");
  cy.get('input[placeholder="Enter option D"]').clear().type("File Transfer Protocol");
  cy.get("select").last().select(correctAnswer);
  cy.get('textarea[placeholder="Add a short explanation for the correct answer"]')
    .first()
    .clear()
    .type("SQL is used to query and manage relational databases.");
}

describe("SmartLearningSystem journeys", () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    mockSmartLearningSystemApis();
  });

  it("covers student dashboard, AI Assistant, Performance, MCQ Bank, Flashcards, Exams, and results", () => {
    cy.visitAsRole("/ai-tools", "Student", { semester: 1 });

    cy.wait("@examList");
    cy.wait("@performance");
    cy.wait("@flashcardDecks");
    cy.contains("Dashboard Overview").should("exist");
    cy.contains("Database Midterm").should("exist");
    cy.contains("SQL Revision Deck").should("exist");

    openAiTab("AI Assistant");
    cy.url().should("include", "/ai-tools/assistant");
    cy.get('input[placeholder="e.g. Binary Search Trees, TCP/IP, SQL Joins..."]')
      .clear()
      .type("Binary Search Trees");
    cy.get('input[placeholder="e.g. Data Structures"]').clear().type("Data Structures");
    cy.get("select").select("1");

    cy.contains("button", "Generate AI Smart Notes").click({ force: true });
    cy.wait("@generateContent");
    cy.contains("AI Smart Notes: Binary Search Trees").should("exist");
    cy.contains("Core idea").should("exist");

    cy.contains("button", "Generate MCQ").click({ force: true });
    cy.contains("button", "Generate Generate MCQ").click({ force: true });
    cy.wait("@generateContent");
    cy.contains("Generated MCQ: Binary Search Trees").should("exist");
    cy.contains("What is the root node in a binary search tree?").should("exist");

    cy.contains("button", "AI Flashcards").click({ force: true });
    cy.contains("button", "Generate AI Flashcards").click({ force: true });
    cy.wait("@generateContent");
    cy.contains("AI Flashcards: Binary Search Trees").should("exist");
    cy.contains("Save to My Decks").click({ force: true });
    cy.wait("@saveFlashcardDeck");
    cy.contains("Saved to My Decks successfully.").should("exist");

    openAiTab("Performance");
    cy.url().should("include", "/ai-tools/performance");
    cy.wait("@performance");
    cy.contains("Performance by Semester").scrollIntoView().should("exist");
    cy.contains("Subject Performance").scrollIntoView().should("exist");
    cy.contains("Networks Quiz").scrollIntoView().should("exist");

    openAiTab("MCQ Bank");
    cy.url().should("include", "/ai-tools/mcq-bank");
    cy.wait("@mcqBankSets");
    cy.get('input[placeholder="Search by subject or set name..."]').type("Networks");
    cy.get("main").contains("Networking Fundamentals").scrollIntoView().should("exist");
    cy.contains("a", "Open MCQ Set").click({ force: true });
    cy.wait("@mcqBankSet");
    cy.contains("Which protocol is used to load secure websites?").should("exist");
    cy.contains("Correct Answer:").should("exist");
    cy.contains("HTTPS").should("exist");

    openAiTab("Flashcards");
    cy.url().should("include", "/ai-tools/flashcards");
    cy.wait("@flashcardDecks");
    cy.get('input[placeholder="Search decks..."]').type("SQL");
    cy.get("main").contains("SQL Revision Deck").scrollIntoView().should("exist");
    cy.contains("a", "Study Now").click({ force: true });
    cy.wait("@flashcardDeck");
    cy.contains("What does SQL stand for?").should("exist");
    cy.contains("button", "Reveal Answer").click({ force: true });
    cy.contains("Structured Query Language.").should("exist");

    openAiTab("Exams");
    cy.url().should("include", "/ai-tools/exams");
    cy.wait("@examList");
    cy.get("main").contains("Database Midterm").scrollIntoView().should("exist");
    cy.contains("a", "Take Exam").click({ force: true });
    cy.wait("@activeExam");
    cy.contains("Which language is commonly used to query relational databases?").should("exist");
    cy.contains("button", "SQL").click({ force: true });
    cy.contains("button", "Finish Exam").click({ force: true });
    cy.wait("@submitExam");
    cy.wait("@activeExamResult");
    cy.contains("Exam Result").should("exist");
    cy.contains("Correct Answer:").should("exist");
  });

  it("covers admin create, update, and delete flows for Exams and MCQ Bank", () => {
    cy.visitAsRole("/ai-tools/exams/create", "Admin");

    cy.contains("Exam Details").should("exist");
    cy.get('input[placeholder="e.g. Data Structures Midterm"]').clear().type("SQL Practice Exam");
    cy.get('input[placeholder="e.g. Data Structures"]').clear().type("Database Systems");
    cy.get("select").first().select("1");
    cy.get('input[type="number"]').first().clear().type("30");
    cy.get('input[type="number"]').eq(1).clear().type("20");
    cy.get('input[type="date"]').clear().type(futureDateValue());
    cy.get('input[type="time"]').clear().type("10:30");
    fillAssessmentQuestion("Structured Query Language");
    cy.contains("button", "Create Timed Exam").click({ force: true });
    cy.wait("@saveAssessment").its("request.body.kind").should("eq", "exam");
    cy.contains("Timed exam created successfully.").should("exist");

    cy.visitAsRole(`/ai-tools/exams/${ACTIVE_EXAM_ID}/edit`, "Admin");
    cy.wait("@activeExam");
    cy.contains("Update Exam").should("exist");
    cy.get('input[placeholder="e.g. Data Structures Midterm"]')
      .clear()
      .type("Updated Database Midterm");
    cy.get('input[type="date"]').clear().type(futureDateValue());
    cy.contains("button", "Update Exam").click({ force: true });
    cy.wait("@updateAssessment").its("request.body.title").should("eq", "Updated Database Midterm");
    cy.contains("Exam updated successfully.").should("exist");

    cy.visitAsRole("/ai-tools/mcq-bank/create", "Admin");
    cy.contains("MCQ Bank Details").should("exist");
    cy.get('input[placeholder="e.g. Data Structures Practice Set"]')
      .clear()
      .type("SQL MCQ Practice Set");
    cy.get('input[placeholder="e.g. Data Structures"]').clear().type("Database Systems");
    cy.get("select").first().select("1");
    fillAssessmentQuestion("Structured Query Language");
    cy.contains("button", "Create MCQ Bank Set").click({ force: true });
    cy.wait("@saveAssessment").its("request.body.kind").should("eq", "mcq_bank");
    cy.contains("MCQ Bank set created successfully.").should("exist");

    cy.visitAsRole(`/ai-tools/mcq-bank/${MCQ_BANK_ID}/edit`, "Admin");
    cy.wait("@mcqAssessment");
    cy.contains("Update MCQ Bank Set").should("exist");
    cy.get('input[placeholder="e.g. Data Structures Practice Set"]')
      .clear()
      .type("Updated Networking MCQ Set");
    cy.contains("button", "Update MCQ Bank Set").click({ force: true });
    cy.wait("@updateAssessment").its("request.body.title").should("eq", "Updated Networking MCQ Set");
    cy.contains("MCQ Bank set updated successfully.").should("exist");

    cy.visitAsRole("/ai-tools/exams", "Admin");
    cy.wait("@examList");
    cy.get("main").contains("Database Midterm").scrollIntoView().should("exist");
    cy.contains("button", "Delete").click({ force: true });
    cy.contains("button", "Yes, Delete").click({ force: true });
    cy.wait("@deleteAssessment");
    cy.contains("Exam deleted successfully.").should("exist");

    cy.visitAsRole("/ai-tools/mcq-bank", "Admin");
    cy.wait("@mcqBankSets");
    cy.get("main").contains("Networking Fundamentals").scrollIntoView().should("exist");
    cy.contains("button", "Delete").click({ force: true });
    cy.contains("button", "Yes, Delete").click({ force: true });
    cy.wait("@deleteAssessment");
    cy.contains("MCQ Bank set deleted successfully.").should("exist");
  });
});
