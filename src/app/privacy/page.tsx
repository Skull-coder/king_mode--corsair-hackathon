export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-[#e5e7eb]">
      <h1 className="text-4xl font-bold mb-6 text-white">Privacy Policy</h1>
      <p className="mb-4 text-sm text-[#8b949e]">Last updated: June 23, 2026</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">1. Information We Access</h2>
        <p className="mb-4">
          King Mode requests access to specific Google user data only after explicit user consent. We access the following Google user data:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#8b949e]">
          <li><strong>Gmail Data:</strong> Read, write, and send access to emails to provide core email management functionality, AI-assisted drafting, and organization.</li>
          <li><strong>Google Calendar Data:</strong> Read and write access to calendar events for scheduling and reminders.</li>
          <li><strong>Basic Profile Information:</strong> Email address and basic profile info for account identification.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">2. How We Use Google User Data</h2>
        <p className="mb-4 text-[#8b949e]">
          We use Gmail and Google Calendar data solely to provide the features requested by the user, including email management, scheduling, reminders, and AI-assisted productivity workflows. We do not use this data for any other purpose, and we never sell user data to third parties or use it for advertising.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">3. Data Protection Mechanisms for Sensitive Data</h2>
        <p className="mb-4 text-[#8b949e]">
          Protecting your sensitive data is our highest priority. We implement the following data protection mechanisms:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#8b949e]">
          <li><strong>Encryption:</strong> All data transmitted between your browser, our servers, and Google&apos;s APIs is encrypted in transit using industry-standard TLS. Any cached data is encrypted at rest using AES-256 encryption.</li>
          <li><strong>Minimal Access:</strong> We strictly adhere to the principle of least privilege. Tokens and data are accessed only as needed to perform immediate user-requested actions.</li>
          <li><strong>Secure Infrastructure:</strong> Our infrastructure is continuously monitored for vulnerabilities. Access to production environments is strictly limited to authorized personnel with multi-factor authentication.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Retention and Deletion</h2>
        <p className="mb-4 text-[#8b949e]">
          We believe in keeping your data only for as long as it is necessary to provide you with our services:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#8b949e]">
          <li><strong>Retention:</strong> We only store metadata and temporary caches of emails and calendar events required for performance. We do not permanently store the body of your emails.</li>
          <li><strong>Deletion:</strong> You can request the deletion of your account and all associated data at any time from your account settings. Upon account deletion, all cached data, tokens, and personally identifiable information are immediately and permanently erased from our servers.</li>
          <li><strong>Revoking Access:</strong> Users may revoke King Mode&apos;s access to Google services at any time through their Google Account permissions settings. If access is revoked, we automatically delete any associated tokens and cached data on our end.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">5. Contact Us</h2>
        <p className="text-[#8b949e]">
          If you have any questions regarding this policy or our data practices, please contact us at krishvarma030@gmail.com.
        </p>
      </section>
    </main>
  );
}