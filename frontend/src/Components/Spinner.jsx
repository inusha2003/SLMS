const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-14 h-14' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-4 border-lms-muted border-t-lms-accent rounded-full animate-spin`}
      />
    </div>
  );
};

export const FullPageSpinner = () => (
  <div className="fixed inset-0 bg-lms-darkest flex items-center justify-center z-50">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-lms-muted text-sm tracking-wide">Loading...</p>
    </div>
  </div>
);

export default Spinner;