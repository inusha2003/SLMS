function mockStudentApis() {
  cy.intercept("GET", "**/api/notes/my*", {
    statusCode: 200,
    body: {
      data: [
        {
          _id: "507f1f77bcf86cd799439021",
          title: "Intro to Databases",
          subject: "Database Systems",
          moduleCode: "IT2010",
          status: "approved",
          createdAt: "2026-04-20T08:00:00.000Z",
          visibility: "public",
        },
      ],
    },
  }).as("studentNotes");

  cy.intercept("GET", "**/api/notes/pending*", {
    statusCode: 200,
    body: { data: [] },
  });

  cy.intercept("GET", "**/api/notes?*", {
    statusCode: 200,
    body: {
      data: {
        notes: [
          {
            _id: "507f1f77bcf86cd799439022",
            title: "Network Security Basics",
            subject: "Computer Networks",
            moduleCode: "IT3030",
            description: "Foundational security concepts and threats.",
            status: "approved",
            visibility: "public",
            tags: ["security", "networks"],
            createdAt: "2026-04-18T08:00:00.000Z",
          },
        ],
        pages: 1,
      },
    },
  }).as("browseNotes");

  cy.intercept("POST", "**/api/notes", {
    statusCode: 201,
    body: { message: "Created" },
  }).as("createNote");

  cy.intercept("GET", "**/api/qa/questions*", {
    statusCode: 200,
    body: {
      data: {
        questions: [
          {
            _id: "507f1f77bcf86cd799439023",
            title: "What is normalization in databases?",
            body: "Can someone explain 1NF and 2NF simply?",
            subject: "Database Systems",
            tags: ["database", "normalization"],
            upvotes: [],
            answersCount: 1,
            viewCount: 12,
            authorName: "Student User",
            createdAt: "2026-04-18T08:00:00.000Z",
          },
        ],
        pages: 1,
        total: 1,
      },
    },
  }).as("studentQuestions");
}

describe("Student portal journeys", () => {
  it("covers the main student tabs and note submission journey", () => {
    cy.viewport(1440, 900);
    mockStudentApis();
    cy.visitAsRole("/student/dashboard", "Student");

    cy.contains("Welcome, Student User!").should("be.visible");
    cy.contains("Browse Notes").should("exist");
    cy.contains("My Notes").should("exist");
    cy.contains("Upload Note").should("exist");
    cy.contains("Q&A Forum").should("exist");

    cy.contains("a", "Browse Notes").click({ force: true });
    cy.url().should("include", "/student/browse-notes");
    cy.wait("@browseNotes");
    cy.get("main").contains("h1", /^Browse Notes$/).should("exist");
    cy.contains("Network Security Basics").should("be.visible");

    cy.contains("a", "My Notes").click({ force: true });
    cy.url().should("include", "/student/my-notes");
    cy.wait("@studentNotes");
    cy.get("main").contains("h1", /^My Notes$/).should("exist");
    cy.contains("Intro to Databases").should("be.visible");
    cy.contains("approved").click();
    cy.wait("@studentNotes");

    cy.contains("a", "Upload Note").click({ force: true });
    cy.url().should("include", "/student/upload-note");
    cy.get("main").contains("h1", /^Upload Note$/).should("exist");

    cy.get('input[placeholder="Note title"]').type("Cypress Uploaded Note");
    cy.get('input[placeholder="e.g. Mathematics"]').type("Software Engineering");
    cy.get('input[placeholder="e.g. CS101"]').type("SE2020");
    cy.get('textarea[placeholder="Brief description of the note content..."]').type(
      "Testing the upload-note journey with Cypress.",
    );
    cy.get('input[placeholder="e.g. algebra, calculus, exam"]').type("cypress,testing");
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("dummy pdf content"),
        fileName: "sample-note.pdf",
        mimeType: "application/pdf",
      },
      { force: true },
    );
    cy.contains("Submit for Review").click();
    cy.wait("@createNote");
    cy.contains("Note Submitted!").should("be.visible");

    cy.visitAsRole("/student/qa-forum", "Student");
    cy.wait("@studentQuestions");
    cy.get("main").contains("button", /^Ask Question$/).should("exist");
    cy.contains("What is normalization in databases?").should("be.visible");
  });
});
