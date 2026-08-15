export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">About TaskAnt</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
        <p className="text-lg">
          TaskAnt is a location-based task and service marketplace designed to connect people who need tasks completed with trusted local helpers who can perform them.
        </p>
        <p>
          Inspired by the teamwork and efficiency of ants, TaskAnt represents people helping other people complete important tasks when they cannot physically be present — whether due to study, work, business, or family responsibilities.
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">Our Mission</h2>
        <p>
          To create a trusted platform where anyone can post location-based tasks and find reliable, verified helpers in their target area — making distance no longer a barrier to getting things done.
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">The Problem We Solve</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Collecting documents from another district</li>
          <li>Receiving parcels when nobody is available</li>
          <li>Purchasing local products from specific areas</li>
          <li>Submitting or collecting official documents</li>
          <li>Visiting offices on someone's behalf</li>
        </ul>
        <p className="text-brand-600 font-medium italic mt-8">"Your Task. Our Ant."</p>
      </div>
    </div>
  );
}
