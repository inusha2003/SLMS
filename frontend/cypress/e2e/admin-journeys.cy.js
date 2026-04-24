function mockAdminApis() {
  cy.intercept("GET", "**/api/moderation/stats", {
    statusCode: 200,
    body: {
      data: {
        totalNotes: 12,
        pendingNotes: 2,
        approvedNotes: 8,
        rejectedNotes: 2,
        totalQuestions: 6,
        pendingReports: 1,
      },
    },
  }).as("moderationStats");

  cy.intercept("GET", "**/api/notes/pending*", {
    statusCode: 200,
    body: {
      data: [
        {
          _id: "507f1f77bcf86cd799439031",
          title: "Pending Java Notes",
          subject: "Java",
          moduleCode: "IT2050",
          description: "Collections and streams.",
          createdAt: "2026-04-18T08:00:00.000Z",
          tags: ["java"],
        },
      ],
    },
  }).as("pendingNotes");

  cy.intercept("PATCH", "**/api/notes/*/review", {
    statusCode: 200,
    body: { message: "Reviewed" },
  }).as("reviewNote");

  cy.intercept("GET", "**/api/notes?*", {
    statusCode: 200,
    body: {
      data: {
        notes: [
          {
            _id: "507f1f77bcf86cd799439032",
            title: "Approved OOP Notes",
            subject: "OOP",
            moduleCode: "IT2070",
            status: "approved",
            createdAt: "2026-04-16T08:00:00.000Z",
            visibility: "public",
          },
        ],
        pages: 1,
      },
    },
  }).as("adminNotes");

  cy.intercept("GET", "**/api/notes/*/comments", {
    statusCode: 200,
    body: {
      data: [
        {
          _id: "507f1f77bcf86cd799439033",
          authorName: "Student User",
          content: "This note helped a lot, thanks!",
          createdAt: "2026-04-18T10:00:00.000Z",
        },
      ],
    },
  }).as("noteComments");

  cy.intercept("GET", "**/api/qa/questions*", {
    statusCode: 200,
    body: {
      data: {
        questions: [
          {
            _id: "507f1f77bcf86cd799439034",
            title: "How do linked lists work?",
            body: "I need a simple explanation for insert and delete.",
            subject: "Data Structures",
            tags: ["linked-list"],
            upvotes: [],
            answersCount: 2,
            viewCount: 9,
            authorName: "Student User",
            createdAt: "2026-04-18T08:00:00.000Z",
          },
        ],
        pages: 1,
        total: 1,
      },
    },
  }).as("adminQuestions");

  cy.intercept("GET", "**/api/moderation/reports*", {
    statusCode: 200,
    body: {
      data: [
        {
          _id: "507f1f77bcf86cd799439035",
          contentType: "answer",
          contentId: "507f1f77bcf86cd799439036",
          reason: "Spam",
          reporterName: "Student User",
          status: "pending",
          createdAt: "2026-04-18T08:00:00.000Z",
        },
      ],
    },
  }).as("reports");

  cy.intercept("GET", "**/api/moderation/flagged-notes*", {
    statusCode: 200,
    body: {
      data: [
        {
          _id: "507f1f77bcf86cd799439037",
          title: "Flagged Security Note",
          subject: "Security",
          moduleCode: "IT3050",
          flagReason: "Incorrect content",
        },
      ],
    },
  }).as("flaggedNotes");

  cy.intercept("GET", "**/api/moderation/logs*", {
    statusCode: 200,
    body: {
      data: {
        logs: [
          {
            _id: "507f1f77bcf86cd799439038",
            action: "approve_note",
            adminName: "Admin User",
            targetType: "note",
            details: "Approved Pending Java Notes",
            createdAt: "2026-04-18T08:00:00.000Z",
          },
        ],
      },
    },
  }).as("moderationLogs");
}

describe("Admin portal journeys", () => {
  it("covers the main admin tabs and moderation actions", () => {
    cy.viewport(1440, 900);
    mockAdminApis();
    cy.visitAsRole("/admin/dashboard", "Admin");

    cy.wait("@moderationStats");
    cy.contains("Admin Dashboard").should("be.visible");
    cy.contains("Manage Notes").should("exist");
    cy.contains("Pending Approvals").should("exist");
    cy.contains("Discussions").should("exist");
    cy.contains("Q&A Forum").should("exist");
    cy.contains("Moderation Panel").should("exist");

    cy.contains("a", "Manage Notes").click({ force: true });
    cy.url().should("include", "/admin/manage-notes");
    cy.wait("@adminNotes");
    cy.get("main").contains("h1", /^Manage Notes$/).should("exist");
    cy.contains("New Note").should("be.visible");

    cy.contains("a", "Pending Approvals").click({ force: true });
    cy.url().should("include", "/admin/pending");
    cy.wait("@pendingNotes");
    cy.get("main").contains("h1", /^Pending Approvals$/).should("exist");
    cy.contains("Pending Java Notes").should("be.visible");
    cy.contains("Approve").click();
    cy.wait("@reviewNote");

    cy.contains("a", "Discussions").click({ force: true });
    cy.url().should("include", "/admin/discussions");
    cy.wait("@adminNotes");
    cy.get("main").contains("h1", /^Discussions$/).should("exist");
    cy.contains("Approved OOP Notes").click();
    cy.wait("@noteComments");
    cy.contains("This note helped a lot, thanks!").should("be.visible");

    cy.contains("a", "Q&A Forum").click({ force: true });
    cy.url().should("include", "/admin/qa-forum");
    cy.wait("@adminQuestions");
    cy.contains("Q&A Forum Moderation").should("be.visible");
    cy.contains("View & Reply").should("be.visible");

    cy.contains("a", "Moderation Panel").click({ force: true });
    cy.url().should("include", "/admin/moderation");
    cy.wait("@reports");
    cy.get("main").contains("h1", /^Moderation Panel$/).should("exist");
    cy.contains("Reports").should("be.visible");
    cy.contains("Flagged Notes").click();
    cy.wait("@flaggedNotes");
    cy.contains("Flagged Security Note").should("be.visible");
    cy.contains("Audit Logs").click();
    cy.wait("@moderationLogs");
    cy.contains("Approved Pending Java Notes").should("be.visible");
  });
});
