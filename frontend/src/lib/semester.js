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
  const userSemester = Number(userSemesterValue);
  const optionSemester = Number(optionSemesterValue);

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
