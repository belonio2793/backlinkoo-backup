export default function PrivacyPolicy() {
  const currentYear = new Date().getFullYear();
  const lastUpdated = new Date().toLocaleDateString();

  const policySections = [
    {
      id: 1,
      title: "Information We Collect",
      text: "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.",
    },
    {
      id: 2,
      title: "How We Use Your Information",
      text: "We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.",
    },
    {
      id: 3,
      title: "Information Sharing",
      text: "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.",
    },
    {
      id: 4,
      title: "Data Security",
      text: "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
    },
    {
      id: 5,
      title: "Cookies",
      text: "We use cookies to enhance your experience on our website. You can choose to disable cookies in your browser settings.",
    },
    {
      id: 6,
      title: "Your Rights",
      text: "You have the right to access, update, or delete your personal information. Contact us if you wish to exercise these rights.",
    },
    {
      id: 7,
      title: "Changes to This Policy",
      text: "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.",
    },
    {
      id: 8,
      title: "Contact Us",
      text: "If you have any questions about this Privacy Policy, please contact us at privacy@backlinkoo.com",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-100 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-xl font-bold text-gray-900">
            Backlinkoo
          </a>
          <nav className="space-x-4">
            <a href="/" className="text-gray-700 hover:text-black">Home</a>
            <a href="/privacy" className="text-gray-700 hover:text-black font-semibold">Privacy Policy</a>
            {/* Add more nav links here */}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-6">Last updated: {lastUpdated}</p>

        <div className="prose prose-lg max-w-none">
          {policySections.map((section) => (
            <section key={section.id} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {section.id}. {section.title}
              </h2>
              <p className="text-gray-700">{section.text}</p>
            </section>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <nav className="mb-2 space-x-4">
            <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
            <a href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</a>
            {/* Add terms, contact, etc. */}
          </nav>
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Backlink ∞. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}