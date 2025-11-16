import { useState } from 'react';
import { ArrowLeft, Scale, Shield, FileText, AlertTriangle, Globe, Mail, Lock, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TermsViewProps {
  onBack: () => void;
  onShowSeasonalTest?: () => void;
  onShowDevPlayground?: () => void;
}

export function TermsView({ onBack, onShowSeasonalTest, onShowDevPlayground }: TermsViewProps) {
  const { effectiveTheme } = useTheme();
  const [clickCount, setClickCount] = useState(0);
  const [privacyClicks, setPrivacyClicks] = useState(0);

  function handleWarningClick() {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5 && onShowSeasonalTest) {
      onShowSeasonalTest();
      setClickCount(0);
    }
  }

  function handlePrivacyClick() {
    const newCount = privacyClicks + 1;
    setPrivacyClicks(newCount);
    if (newCount === 5 && onShowDevPlayground) {
      onShowDevPlayground();
      setPrivacyClicks(0);
    }
  }

  const bgClass = effectiveTheme === 'dark' ? 'bg-black' : 'bg-gray-50';
  const textClass = effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900';
  const cardClass = effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white border border-gray-200';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <div className={`fixed top-0 left-0 right-0 z-50 ${effectiveTheme === 'dark' ? 'glass-header' : 'glass-header-light'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 ${textClass} hover:text-blue-400 transition-colors`}
          >
            <ArrowLeft size={24} />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="pt-24 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scale size={40} className="text-blue-500" />
              <h1 className={`text-5xl font-bold ${textClass}`}>Terms and Conditions</h1>
            </div>
            <p className={`text-xl ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Effective Date: October 2025
            </p>
          </div>

          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <FileText size={28} className="text-blue-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>1. Introduction</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  Welcome to SimplStream ("we," "us," "our," "the Service"). By accessing or using this website, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use the Service.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  SimplStream is a free streaming platform that aggregates content from various third-party sources. We do not host any content ourselves and are not responsible for the availability, quality, or legality of content provided by external sources.
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Shield size={28} className="text-green-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>2. Ownership and Intellectual Property</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-4`}>
                  All visual design, branding, user interface, features, and website code are the exclusive property of Andy and SimplStream. This includes but is not limited to:
                </p>
                <ul className={`list-disc ml-6 mb-4 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
                  <li>User interface design and layout</li>
                  <li>Logo, branding, and color schemes</li>
                  <li>Source code and software architecture</li>
                  <li>Feature implementations and user experience flows</li>
                </ul>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  SimplStream does not host, upload, store, or control any of the media streams. All movies, TV shows, live TV channels, and videos are streamed directly from external, third-party servers. We merely provide links and embed functionality.
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <button onClick={handleWarningClick} className="flex-shrink-0">
                <AlertTriangle size={28} className="text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors" />
              </button>
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>3. Content Disclaimer</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  SimplStream operates as a content aggregator and search engine for publicly available streaming links. If legal, we will not back down and we won't remove shit from our service. We will comply with applicable laws when legally required. We do not:
                </p>
                <ul className={`list-disc ml-6 mb-4 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
                  <li>Host any video, audio, or image files on our servers</li>
                  <li>Upload or distribute copyrighted material</li>
                  <li>Have control over the content provided by third-party sources</li>
                  <li>Verify the legality of content from external sources</li>
                </ul>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  Users are responsible for ensuring their use of third-party content complies with applicable laws in their jurisdiction. SimplStream assumes no liability for how users access or use external content.
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Lock size={28} className="text-purple-500 flex-shrink-0 cursor-pointer" onClick={handlePrivacyClick} />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>4. Privacy and Data Protection</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  Your privacy is important to us. SimplStream stores profile data locally on your device using browser localStorage:
                </p>
                <ul className={`list-disc ml-6 mb-4 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
                  <li>Profile names, avatars, and preferences</li>
                  <li>Watch history and watchlist data</li>
                  <li>Optional profile PINs (stored with XOR encryption)</li>
                  <li>User ratings and viewing progress</li>
                </ul>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  We do not collect, transmit, or store your personal data on any external servers. All data remains on your local device. Clearing your browser data will delete all stored information.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  Profile export files (.ssp) are encrypted using XOR cipher with key rotation for basic security. However, users should treat exported profile files as sensitive data and store them securely.
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <UserCheck size={28} className="text-cyan-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>5. User Responsibilities</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  By using SimplStream, you agree to:
                </p>
                <ul className={`list-disc ml-6 mb-4 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
                  <li>Use the service at your own risk and discretion</li>
                  <li>Comply with all applicable local, state, national, and international laws</li>
                  <li>Not attempt to reverse-engineer, decompile, or extract source code</li>
                  <li>Not use the service for commercial purposes without permission</li>
                  <li>Not interfere with or disrupt the service or servers</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Globe size={28} className="text-indigo-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>6. DMCA and Copyright Infringement</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  SimplStream respects intellectual property rights. Since we do not host any content, we cannot directly remove infringing material. However, we will:
                </p>
                <ul className={`list-disc ml-6 mb-4 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
                  <li>Remove links to infringing content upon valid DMCA notice</li>
                  <li>Cooperate with copyright holders to address legitimate concerns</li>
                  <li>Take reasonable steps to prevent repeat infringement</li>
                </ul>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  SimplStream uses the following secure third-party embedding services: VidSRC, VidLink Pro, 111Movies, Videasy, and VidFast. All video server links are protected and secure. We are not affiliated with these services and do not control their content.
                </p>
                <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                  To file a DMCA takedown notice, contact us with detailed information including specific URLs and proof of copyright ownership.
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <AlertTriangle size={28} className="text-red-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>7. Disclaimer of Warranties</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  SimplStream is provided "as is" and "as available" without any warranties of any kind, either express or implied, including but not limited to:
                </p>
                <ul className={`list-disc ml-6 mb-3 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
                  <li>Accuracy, reliability, or availability of content</li>
                  <li>Uninterrupted or error-free operation</li>
                  <li>Security or privacy of data transmission</li>
                  <li>Legality of third-party content sources</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Shield size={28} className="text-orange-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>8. Limitation of Liability</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  To the maximum extent permitted by law, SimplStream and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the service.
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <FileText size={28} className="text-pink-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>9. Changes to Terms</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting. Your continued use of SimplStream after any changes constitutes acceptance of the new terms.
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-lg p-8 text-center shadow-lg`}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Mail size={28} className="text-blue-500" />
              <h2 className={`text-2xl font-bold ${textClass}`}>Contact Information</h2>
            </div>
            <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
              For questions, legal requests, DMCA notices, or other inquiries, please contact:
            </p>
            <a
              href="mailto:admin.simplstream@protonmail.com"
              className="text-blue-500 hover:text-blue-600 text-xl font-semibold"
            >
              admin.simplstream@protonmail.com
            </a>
          </div>

          {/* Footer */}
          <footer className={`mt-16 pt-8 border-t ${effectiveTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="text-center space-y-4">
              <div>
                <h3 className={`text-3xl font-bold mb-2`}>
                  <span className="text-blue-500">Simpl</span>
                  <span className={textClass}>Stream</span>
                </h3>
                <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  It's not just streaming - It's SimplStream.
                </p>
              </div>
              <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                © {new Date().getFullYear()} SimplStream. All rights reserved.
              </p>
              <p className={`text-xs ${effectiveTheme === 'dark' ? 'text-gray-600' : 'text-gray-500'}`}>
                Owner: Andy "Churro"
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
