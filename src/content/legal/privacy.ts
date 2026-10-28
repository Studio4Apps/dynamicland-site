import { product } from '@/content/product';
import type { LegalDocument } from './types';

export const privacy: LegalDocument = {
  path: '/privacy',
  label: 'Privacy Policy',
  title: 'Privacy Policy',
  officialTitle: 'DynamicLand Privacy Policy',
  effective: '2026-07-04',
  lead: 'This policy explains what DynamicLand processes locally on your Mac and what may be shared with Apple, RevenueCat, DuckDuckGo, third-party websites, or devices you choose (e.g., LocalSend).',
  preamble: [],
  highlights: [
    {
      icon: 'account',
      title: 'No account needed',
      text: 'DynamicLand does not require a user account.',
      section: 'advertising-and-tracking',
    },
    {
      icon: 'ads',
      title: 'No ads or tracking',
      text: 'No advertisements, advertising identifiers, or cross-app tracking.',
      section: 'advertising-and-tracking',
    },
    {
      icon: 'device',
      title: 'Kept on your Mac',
      text: 'Clipboard history, staged files, and Assistant chats are not uploaded to a developer-owned server.',
      section: 'stored-locally',
    },
    {
      icon: 'sell',
      title: 'Never sold',
      text: 'The Developer does not sell or rent your personal information.',
      section: 'data-sharing',
    },
  ],
  sections: [
    {
      id: 'introduction',
      number: 1,
      title: 'Introduction',
      body: [
        'This Privacy Policy explains how Amro Alghamdi (“we,” “us,” or “our”) handles information when you use the DynamicLand macOS application (“DynamicLand” or the “App”).',
        'DynamicLand is designed with a privacy-first approach. Most of its core features process and store information locally on your Mac. However, certain optional features and subscription services communicate with Apple, RevenueCat, DuckDuckGo, third-party websites, or devices selected by you, as described below.',
      ],
    },
    {
      id: 'advertising-and-tracking',
      number: 2,
      title: 'Information We Do Not Use for Advertising or Tracking',
      body: [
        'DynamicLand:',
        {
          list: [
            'Does not require a user account.',
            'Does not display advertisements.',
            'Does not use advertising identifiers.',
            'Does not use your information for cross-app or cross-website tracking.',
            'Does not sell or rent personal information.',
            'Does not operate a developer-owned advertising, analytics, or cloud-storage server.',
            'Does not upload your clipboard history, staged files, or assistant chat history to a developer-owned server.',
          ],
          style: 'checks',
        },
        'DynamicLand uses RevenueCat to manage subscription status. RevenueCat processes purchase information and an anonymous App User ID as described in this Policy.',
      ],
    },
    {
      id: 'stored-locally',
      number: 3,
      title: 'Information Stored Locally',
      subsections: [
        {
          title: 'Clipboard Manager',
          body: [
            'If you enable clipboard capture, DynamicLand monitors changes to the macOS clipboard and stores clipboard history locally in the App’s Application Support folder.',
            'Clipboard history may include text, links, images, rich text, code, or file references that you copy.',
            'You can:',
            {
              list: [
                'Disable clipboard capture.',
                'Configure history limits and automatic expiration.',
                'Delete individual clipboard items.',
                'Clear clipboard history.',
              ],
            },
            'Clipboard content is not sent to the Developer.',
            'If you explicitly ask the DynamicLand Assistant to search or analyze clipboard content, relevant clipboard information may be provided to the selected Apple Intelligence model as part of that request. If Private Cloud Compute is enabled and used, Apple may process that request as explained in [Section 5](#apple-intelligence).',
          ],
        },
        {
          title: 'Assistant Conversations',
          body: [
            'DynamicLand stores Assistant conversations locally in the App’s Application Support folder.',
            'You can delete:',
            {
              list: [
                'The current conversation.',
                'Individual conversations.',
                'All Assistant conversations.',
              ],
            },
            'You can also configure automatic chat-retention periods.',
            'Assistant conversations are not uploaded to a developer-owned server. When Apple Private Cloud Compute is enabled and used, the information required to answer a request may be processed by Apple.',
          ],
        },
        {
          title: 'File Tray and File Processing',
          body: [
            'Files placed in DynamicLand’s file tray are staged or referenced locally. File conversion and other supported file operations are performed locally unless a feature expressly requires an external service.',
            'You control which files are selected, staged, processed, transferred, or deleted.',
          ],
        },
        {
          title: 'Settings and Diagnostic Information',
          body: [
            'App settings and preferences are stored locally on your Mac.',
            'DynamicLand and macOS may generate local operational or system logs. DynamicLand does not intentionally include the contents of your messages, clipboard items, files, URLs, or generated answers in developer-operated analytics.',
            'The Developer does not receive these local logs automatically.',
          ],
        },
      ],
    },
    {
      id: 'feature-processing',
      number: 4,
      title: 'Feature-Specific Processing',
      subsections: [
        {
          title: 'Now Playing, Apple Music, and Spotify',
          body: [
            'DynamicLand may read track titles, artists, albums, playback state, and artwork from Apple Music or Spotify using supported macOS automation and system frameworks.',
            'DynamicLand may use MusicKit to access your Apple Music library and retrieve higher-resolution artwork. Requests made through MusicKit are processed by Apple according to Apple’s privacy practices.',
            'Spotify integration communicates with the Spotify desktop application through macOS automation. Your use of Spotify remains subject to Spotify’s terms and privacy policy.',
            'Media information is displayed and processed locally by DynamicLand and is not transmitted to the Developer.',
          ],
        },
        {
          title: 'Audio Visualization',
          body: [
            'DynamicLand may access authorized real-time audio streams to produce visualizer animations.',
            'Audio used for visualization is processed transiently on your Mac. DynamicLand does not intentionally record, retain, upload, or transmit this audio to the Developer.',
          ],
        },
        {
          title: 'Battery Information',
          body: [
            'DynamicLand may read locally available battery information for your Mac and supported connected devices, such as AirPods.',
            'This information is processed locally and is not transmitted to the Developer.',
          ],
        },
        {
          title: 'LocalSend File Transfers',
          body: [
            'DynamicLand implements the open LocalSend protocol to discover compatible devices and perform user-initiated file transfers over your local network.',
            'Files are sent directly to the device you select. The Developer does not operate a relay server and does not receive your files or transfer contents.',
            'DynamicLand prefers TLS-encrypted connections with certificate verification when supported. Some compatible or legacy LocalSend devices may offer an unencrypted connection. DynamicLand displays a warning and requires your confirmation before sending files over an unencrypted connection.',
            'The receiving device and its operator are responsible for information received through a transfer.',
          ],
        },
      ],
    },
    {
      id: 'apple-intelligence',
      number: 5,
      title: 'Apple Intelligence and Private Cloud Compute',
      body: [
        'DynamicLand includes Assistant features powered by Apple Intelligence.',
        'Depending on your device, operating-system version, settings, availability, and selected mode, processing may occur:',
        {
          list: [
            'Entirely on your Mac using Apple’s on-device model; or',
            'Through Apple’s Private Cloud Compute service when you enable an eligible cloud-processing option.',
          ],
        },
        'When Private Cloud Compute is used, Apple may process the text of your request and relevant context required to generate a response. This may include information you explicitly ask the Assistant to use, such as relevant clipboard content, app settings, file information, or web-search results.',
        'DynamicLand does not send Assistant requests to a developer-owned AI server.',
        'Processing performed by Apple is governed by Apple’s applicable terms and privacy practices.',
        'You can disable eligible cloud-processing features through DynamicLand’s Apple Intelligence settings. When cloud processing is disabled or unavailable, the App uses the supported on-device model where available.',
        'Generated responses may be inaccurate or incomplete. Avoid providing sensitive information unless it is necessary for your request and you are comfortable with the applicable processing.',
      ],
    },
    {
      id: 'web-search',
      number: 6,
      title: 'Web Search and Third-Party Websites',
      body: [
        'If you enable web-search functionality and make a request requiring current web information, DynamicLand may:',
        {
          list: [
            'Send the search query to DuckDuckGo.',
            'Retrieve search-result pages from DuckDuckGo.',
            'Fetch content from a third-party webpage included in the results.',
          ],
        },
        'DuckDuckGo and the operators of visited websites may receive technical information normally associated with web requests, such as the search query, IP address, request headers, and connection information.',
        'Search queries and retrieved webpage content are not sent to the Developer.',
        'Do not include confidential, personal, or sensitive information in web-search requests unless you are comfortable transmitting it to the applicable search provider or website.',
        'You can disable web-search functionality in the App’s settings.',
      ],
    },
    {
      id: 'subscriptions',
      number: 7,
      title: 'Subscriptions and RevenueCat',
      body: [
        'DynamicLand uses Apple’s App Store purchasing system and RevenueCat to offer and manage DynamicLand Pro subscriptions.',
        'When the App initializes or checks subscription status, RevenueCat may process:',
        {
          list: [
            'An automatically generated anonymous App User ID.',
            'App and device information required for the subscription service.',
            'Purchase history.',
            'Subscription status.',
            'Product identifiers.',
            'Transaction and entitlement information.',
            'Purchase and restore events.',
          ],
        },
        'DynamicLand does not provide RevenueCat with your name or email address and does not maintain an App account linked to the anonymous RevenueCat identifier.',
        'RevenueCat uses this information to:',
        {
          list: [
            'Validate purchases.',
            'Determine whether Pro features should be unlocked.',
            'Restore purchases.',
            'Prevent purchase fraud.',
            'Provide subscription and purchase analytics to the Developer through the RevenueCat dashboard.',
          ],
        },
        'Apple separately processes App Store payments and transaction information under Apple’s terms and privacy policy.',
        'RevenueCat’s privacy practices are described at:',
        {
          link: 'RevenueCat Privacy Policy',
          href: 'https://www.revenuecat.com/privacy',
        },
      ],
    },
    {
      id: 'permissions',
      number: 8,
      title: 'Permissions',
      body: [
        'DynamicLand may request the following macOS permissions depending on the features you choose to use:',
        {
          list: [
            '**Automation / Apple Events:** To read media information and control supported Apple Music or Spotify playback.',
            '**Media & Apple Music:** To access authorized Apple Music library information and artwork using MusicKit.',
            '**System Audio or Audio Capture:** To process real-time audio for visualizer animations.',
            '**Local Network:** To discover compatible devices and perform LocalSend transfers.',
            '**Accessibility:** Optional; used for features such as clipboard auto-paste.',
            '**Bluetooth:** To access locally available information for supported connected devices.',
            '**Files and Folders:** To access files or folders that you select.',
            '**Notifications:** To display App notifications where enabled.',
            '**Launch at Login:** Optional; allows DynamicLand to launch when you sign in to your Mac.',
          ],
        },
        'Permissions are controlled by macOS. You can review or revoke them through System Settings. Revoking a permission may prevent the associated feature from working.',
      ],
    },
    {
      id: 'third-party-services',
      number: 9,
      title: 'Third-Party Services',
      body: [
        'Depending on the features you use, DynamicLand may interact with:',
        {
          list: [
            'Apple App Store and StoreKit.',
            'Apple Music and MusicKit.',
            'Apple Intelligence and Private Cloud Compute.',
            'Spotify.',
            'RevenueCat.',
            'DuckDuckGo.',
            'Third-party websites retrieved through web search.',
            'LocalSend-compatible devices selected by you.',
          ],
          style: 'grid',
        },
        'These services operate under their own terms and privacy policies. We encourage you to review those policies before using the relevant features.',
        'We require service providers acting on our behalf to handle information consistently with applicable law and the purposes described in this Policy.',
      ],
    },
    {
      id: 'data-sharing',
      number: 10,
      title: 'Data Sharing',
      body: [
        'The Developer does not sell or rent your personal information.',
        'Information is disclosed or transmitted only as necessary for features you choose to use, including:',
        {
          list: [
            'Purchase and entitlement information sent to Apple and RevenueCat.',
            'Apple Music and MusicKit requests sent to Apple.',
            'Assistant requests processed by Apple Private Cloud Compute when enabled and used.',
            'Search queries sent to DuckDuckGo.',
            'Web requests sent to third-party websites.',
            'Files sent to a LocalSend device selected by you.',
          ],
        },
        'We may also disclose information if required by applicable law, a valid legal process, or to protect legal rights and safety. Because the Developer does not operate an App content server, we generally do not possess your locally stored clipboard, files, chats, or audio.',
      ],
    },
    {
      id: 'data-retention',
      number: 11,
      title: 'Data Retention and Deletion',
      body: [
        'Clipboard history, Assistant conversations, settings, and staged App data remain locally on your Mac according to your settings and actions.',
        'You can delete local information using DynamicLand’s available deletion controls. You may also remove remaining local data by uninstalling DynamicLand and deleting its Application Support data.',
        'Deleting the App does not necessarily delete information independently retained by Apple, RevenueCat, DuckDuckGo, visited websites, or LocalSend recipient devices.',
        'Purchase records may be retained by Apple and RevenueCat as required for subscription administration, fraud prevention, accounting, legal compliance, and dispute resolution.',
        'For deletion or privacy requests concerning subscription information processed through RevenueCat, contact us using the email address in [Section 16](#contact). We may need your anonymous RevenueCat App User ID or transaction information to locate the relevant record.',
      ],
    },
    {
      id: 'security',
      number: 12,
      title: 'Security',
      body: [
        'DynamicLand uses macOS security mechanisms and App Sandbox protections where applicable.',
        'Locally stored information is protected by your Mac’s security configuration. Disk encryption depends on whether FileVault or another encryption mechanism is enabled on your Mac.',
        'LocalSend transfers use TLS encryption and certificate verification when supported. If a recipient offers only an unencrypted connection, DynamicLand displays a warning before allowing you to continue.',
        'No method of storage or transmission is completely secure. You are responsible for protecting access to your Mac and for deciding which devices, files, searches, and services to use.',
      ],
    },
    {
      id: 'childrens-privacy',
      number: 13,
      title: 'Children’s Privacy',
      body: [
        'DynamicLand is a general-audience productivity application and is not specifically directed to children under the age of 13 or the minimum applicable age in their country.',
        'We do not knowingly request that children provide personal information directly to the Developer.',
        'If you believe a child has provided information to us, contact us using the information below.',
      ],
    },
    {
      id: 'your-privacy-rights',
      number: 14,
      title: 'Your Privacy Rights',
      body: [
        'Depending on where you live, you may have rights relating to personal information processed on our behalf, including rights to request access, correction, deletion, restriction, or information about processing.',
        'Most DynamicLand content is stored only on your Mac and can be managed directly through the App or macOS.',
        'For information processed by Apple, RevenueCat, DuckDuckGo, Spotify, or another third party, you may also need to contact that provider directly.',
        'To submit a privacy request concerning information handled on our behalf, contact us at the email address below. We may need information sufficient to verify and process the request.',
      ],
    },
    {
      id: 'international-processing',
      number: 15,
      title: 'International Processing',
      body: [
        'Third-party services used by DynamicLand may process information in countries other than the country where you live.',
        'For example, RevenueCat may process subscription information using infrastructure located outside Saudi Arabia. Apple and other providers process information according to their respective infrastructure, contractual terms, and privacy policies.',
        'Where required, applicable safeguards are provided by the relevant service provider.',
      ],
    },
    {
      id: 'contact',
      number: 16,
      title: 'Contact Information',
      body: [
        'The data controller and developer responsible for this Privacy Policy is:',
        { contact: product.publisher, email: product.supportEmail },
        'Contact us if you have questions, complaints, or requests concerning this Privacy Policy.',
      ],
    },
    {
      id: 'changes',
      number: 17,
      title: 'Changes to This Policy',
      body: [
        'We may update this Privacy Policy when DynamicLand’s features, third-party services, or legal obligations change.',
        'When the Policy changes, we will update the Effective Date at the top of this page. Where required by applicable law, we will provide additional notice of material changes.',
      ],
    },
  ],
};
