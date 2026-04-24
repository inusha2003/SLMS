function mockAiApis() {
  cy.intercept("GET", "**/api/assessment/exams*", {
    statusCode: 200,
    body: {
      exams: [
        {
          _id: "507f1f77bcf86cd799439041",
          title: "Database Midterm",
          subject: "Database Systems",
          semester: 1,
          duration: 45,
          totalMarks: 50,
          status: "Upcoming",
          viewerHasSubmitted: false,
          scheduledAt: "2026-05-01T09:00:00.000Z",
        },
        {
          _id: "507f1f77bcf86cd799439042",
          title: "Networks Quiz",
          subject: "Computer Networks",
          semester: 1,
          duration: 30,
          totalMarks: 25,
          status: "Completed",
          viewerHasSubmitted: true,
          scheduledAt: "2026-04-10T09:00:00.000Z",
        },
      ],
    },
  }).as("examSchedule");

  cy.intercept("GET", "**/api/assessment/performance/dashboard*", {
    statusCode: 200,
    body: {
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
    },
  }).as("performance");

  cy.intercept("GET", "**/api/flashcards*", {
    statusCode: 200,
    body: {
      decks: [
        {
          id: "deck-1",
          title: "SQL Revision Deck",
          subject: "Database Systems",
          semester: 1,
          cardCount: 12,
          isAiGenerated: true,
        },
      ],
    },
  }).as("flashcards");

  cy.intercept("GET", "**/api/mcq-bank*", {
    statusCode: 200,
    body: {
      sets: [
        {
          id: "mcq-1",
          title: "Networking Fundamentals",
          subject: "Computer Networks",
          semester: 1,
          questionCount: 10,
          duration: 20,
        },
      ],
      filters: {
        subjects: ["Computer Networks"],
      },
    },
  }).as("mcqBank");
}

describe("AI workspace journeys", () => {
  it("covers the SmartLearningSystem AI workspace tabs", () => {
    cy.viewport(1440, 900);
    mockAiApis();
    cy.visitAsRole("/ai-tools", "Student");

    cy.wait("@examSchedule");
    cy.wait("@performance");
    cy.wait("@flashcards");
    cy.contains("Dashboard Overview").should("exist");
    cy.contains("AI Assistant").should("exist");
    cy.contains("Performance").should("exist");
    cy.contains("MCQ Bank").should("exist");
    cy.contains("Flashcards").should("exist");
    cy.contains("Exams").should("exist");

    cy.contains("a", "AI Assistant").click({ force: true });
    cy.url().should("include", "/ai-tools/assistant");
    cy.contains("AI Study Studio").should("exist");

    cy.contains("a", "Performance").click({ force: true });
    cy.url().should("include", "/ai-tools/performance");
    cy.wait("@performance");
    cy.contains("Performance by Semester").scrollIntoView().should("exist");
    cy.contains("Subject Performance").scrollIntoView().should("exist");

    cy.contains("a", "MCQ Bank").click({ force: true });
    cy.url().should("include", "/ai-tools/mcq-bank");
    cy.wait("@mcqBank");
    cy.get("main").contains(/^Networking Fundamentals$/).scrollIntoView().should("exist");

    cy.contains("a", "Flashcards").click({ force: true });
    cy.url().should("include", "/ai-tools/flashcards");
    cy.wait("@flashcards");
    cy.get("main").contains(/^SQL Revision Deck$/).scrollIntoView().should("exist");
    cy.get('input[placeholder="Search decks..."]').type("SQL");

    cy.contains("a", "Exams").click({ force: true });
    cy.url().should("include", "/ai-tools/exams");
    cy.wait("@examSchedule");
    cy.get("main").contains(/^Database Midterm$/).scrollIntoView().should("exist");
    cy.contains("button", "Completed").click({ force: true });
    cy.get("main").contains(/^Networks Quiz$/).scrollIntoView().should("exist");
  });
});
