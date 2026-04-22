export function parseSemesterValue(value) {
  if (value == null) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const direct = Number(raw);
  if (Number.isFinite(direct) && direct >= 1) {
    return Math.min(8, Math.floor(direct));
  }

  const lower = raw.toLowerCase();
  const yearMatch = lower.match(/(\d+)\s*(st|nd|rd|th)?\s*year/);
  const semMatch = lower.match(/(\d+)\s*(st|nd|rd|th)?\s*semester/);

  if (yearMatch && semMatch) {
    const year = Number(yearMatch[1]);
    const semOfYear = Number(semMatch[1]);
    if (Number.isFinite(year) && Number.isFinite(semOfYear) && year >= 1 && semOfYear >= 1 && semOfYear <= 2) {
      const overall = (year - 1) * 2 + semOfYear;
      return Math.min(8, overall);
    }
  }

  if (semMatch) {
    const semNumber = Number(semMatch[1]);
    if (Number.isFinite(semNumber) && semNumber >= 1) {
      return Math.min(8, semNumber);
    }
  }

  return null;
}

export function formatSemesterLabel(value) {
  const semesterNumber = Number(value);
  if (!Number.isFinite(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
    return "Unknown Semester";
  }

  const year = Math.ceil(semesterNumber / 2);
  const semester = semesterNumber % 2 === 0 ? 2 : 1;
  return `Year ${year} Semester ${semester}`;
}

export function normalizeSemesterLimit(value) {
  const semesterNumber = Number(value);
  if (!Number.isFinite(semesterNumber) || semesterNumber < 1) {
    return 8;
  }

  return Math.min(8, Math.floor(semesterNumber));
}

export function getSemesterOptions(maxSemesterValue = 8) {
  const maxSemester = normalizeSemesterLimit(maxSemesterValue);
  return Array.from({ length: maxSemester }, (_, index) => {
    const value = String(index + 1);
    return {
      value,
      label: formatSemesterLabel(value),
    };
  });
}

export function canAccessSemesterOption(userSemesterValue, optionSemesterValue) {
  const userSemester = parseSemesterValue(userSemesterValue);
  const optionSemester = parseSemesterValue(optionSemesterValue);

  if (!Number.isFinite(userSemester) || !Number.isFinite(optionSemester)) {
    return false;
  }

  if (userSemester >= 7) {
    return true;
  }

  return optionSemester <= userSemester;
}

export function toSemesterNumber(yearValue, semesterOfYearValue) {
  const year = Number(yearValue);
  const semesterOfYear = Number(semesterOfYearValue);

  if (!Number.isFinite(year) || year < 1 || year > 4) return null;
  if (!Number.isFinite(semesterOfYear) || ![1, 2].includes(semesterOfYear)) return null;

  return (year - 1) * 2 + semesterOfYear;
}

export function getAcademicYearOptions() {
  return Array.from({ length: 4 }, (_, index) => ({
    value: String(index + 1),
    label: `Year ${index + 1}`,
  }));
}

export function getSemesterOfYearOptions() {
  return [
    { value: "1", label: "Semester 1" },
    { value: "2", label: "Semester 2" },
  ];
}
