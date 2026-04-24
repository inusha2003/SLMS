describe("Exam results journey", () => {
  it("shows the student exam result summary and reviewed answers", () => {
    cy.intercept("GET", "**/api/assessment/exams/exam-123/result", {
      statusCode: 200,
      body: {
        performance: {
          score: 42,
          totalMarks: 50,
          submittedAt: "2026-04-24T08:30:00.000Z",
          exam: {
            title: "Database Midterm",
            subject: "Database Systems",
            semester: 1,
          },
          reviewedAnswers: [
            {
              questionIndex: 0,
              question: "What does SQL stand for?",
              selectedOption: "Structured Query Language",
              correctAnswer: "Structured Query Language",
              isCorrect: true,
              explanation: "SQL is the standard language used to manage relational databases.",
            },
            {
              questionIndex: 1,
              question: "Which normal form removes partial dependency?",
              selectedOption: "1NF",
              correctAnswer: "2NF",
              isCorrect: false,
              explanation: "Second Normal Form removes partial dependency from candidate keys.",
            },
          ],
        },
      },
    }).as("examResult");

    cy.visitAsRole("/exam/exam-123/result", "Student");
    cy.wait("@examResult");

    cy.contains("Exam Result").should("be.visible");
    cy.contains("Database Midterm").scrollIntoView().should("exist");
    cy.contains("42").scrollIntoView().should("exist");
    cy.contains("/ 50").should("exist");
    cy.contains("Database Systems").scrollIntoView().should("exist");
    cy.contains("Question 1").scrollIntoView().should("exist");
    cy.contains("What does SQL stand for?").should("exist");
    cy.contains("Your Answer:").should("exist");
    cy.contains("Structured Query Language").should("exist");
    cy.contains("Correct Answer:").should("exist");
    cy.contains("Which normal form removes partial dependency?").scrollIntoView().should("exist");
    cy.contains("2NF").should("exist");
  });
});
