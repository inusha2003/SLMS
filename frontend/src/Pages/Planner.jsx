import StudyPlanner from '../components/StudyPlanner';

const Planner = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          Personal Study Planner
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Add, update, and manage your daily study tasks.
        </p>
      </div>

      <StudyPlanner />
    </div>
  );
};

export default Planner;