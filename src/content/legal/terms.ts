import { product } from '@/content/product';
import type { LegalDocument } from './types';

export const terms: LegalDocument = {
  path: '/terms',
  label: 'Terms of Use',
  title: 'Terms of Use',
  subtitle: 'End-User License Agreement',
  lead: 'The license and terms that apply when you download, subscribe to, or use DynamicLand on your Mac.',
  officialTitle: 'DynamicLand Terms of Use and End-User License Agreement',
  effective: '2026-06-25',
  preamble: [
    'These Terms of Use and End-User License Agreement (“**Terms**” or “**EULA**”) govern your use of the DynamicLand macOS application (“**DynamicLand**” or the “**App**”), developed and provided by Amro Alghamdi (“**Developer**,” “**we**,” “**us**,” or “**our**”).',
    'By downloading, installing, purchasing, subscribing to, or using DynamicLand, you acknowledge that you have read, understood, and agreed to these Terms. If you do not agree to these Terms, do not download, install, or use the App.',
    'If you use the App on behalf of an organization, you represent that you have authority to accept these Terms on behalf of that organization.',
  ],
  highlights: [
    {
      icon: 'agreement',
      title: 'An agreement with the Developer',
      text: 'This EULA is between you and Amro Alghamdi, not Apple, who is solely responsible for DynamicLand.',
      section: 'acknowledgment',
    },
    {
      icon: 'renew',
      title: 'Pro renews automatically',
      text: 'Cancel at least 24 hours before the end of your billing period from your Apple Account.',
      section: 'subscriptions',
    },
    {
      icon: 'device',
      title: 'Your data stays on your Mac',
      text: 'Clipboard history, settings, staged files, and chats are generally stored and processed locally.',
      section: 'privacy',
    },
    {
      icon: 'review',
      title: 'Check generated answers',
      text: 'Review Apple Intelligence and web results before relying on them.',
      section: 'apple-intelligence',
    },
  ],
  sections: [
    {
      id: 'acknowledgment',
      number: 1,
      title: 'Acknowledgment',
      body: [
        'This EULA is concluded between you and Amro Alghamdi only, and not with Apple Inc. (“Apple”). The Developer, not Apple, is solely responsible for DynamicLand and its content.',
        'This EULA must not be interpreted as providing usage rules that conflict with the Apple Media Services Terms and Conditions or other applicable Apple usage rules.',
      ],
    },
    {
      id: 'license',
      number: 2,
      title: 'License Grant and Scope',
      body: [
        'Subject to your compliance with these Terms, the Developer grants you a personal, limited, non-exclusive, non-transferable, non-sublicensable, and revocable license to download, install, and use DynamicLand on Apple-branded products that you own or control, as permitted by the Usage Rules set forth in the Apple Media Services Terms and Conditions.',
        'The App may also be accessed and used by other accounts associated with the purchaser where permitted by Apple, including through Family Sharing, volume purchasing, or Legacy Contacts.',
        'No ownership interest in the App is transferred to you under this EULA.',
      ],
    },
    {
      id: 'restrictions',
      number: 3,
      title: 'Restrictions',
      body: [
        'Except where expressly permitted by applicable law or an applicable open-source license, you must not:',
        {
          list: [
            '(a) copy, reproduce, distribute, sell, lease, sublicense, rent, publish, or commercially exploit the App or any part of it;',
            '(b) reverse engineer, decompile, disassemble, attempt to derive the source code of, or modify the App;',
            '(c) remove or alter any copyright, trademark, attribution, or proprietary notice;',
            '(d) interfere with, disrupt, damage, or misuse the App, its features, or any connected device, network, or service;',
            '(e) use the App to transmit malicious software or illegal, infringing, harmful, or unauthorized content;',
            '(f) use the App in violation of applicable laws, regulations, third-party rights, or third-party terms of service; or',
            '(g) use the App for any unlawful, fraudulent, abusive, or harmful purpose.',
          ],
        },
        'Nothing in this section restricts rights that cannot lawfully be restricted under applicable law.',
      ],
    },
    {
      id: 'app-features',
      number: 4,
      title: 'App Features and User Responsibility',
      body: [
        'DynamicLand provides macOS productivity features that may include clipboard history, file staging and conversion, local-network file transfer, media information and controls, device information, visualizations, and Apple Intelligence-assisted features.',
        'You are responsible for your use of these features and for all content, files, commands, searches, and actions you initiate through the App.',
      ],
      subsections: [
        {
          number: '4.1',
          title: 'Clipboard',
          body: [
            'Clipboard history is stored locally on your Mac. Features such as clipboard search and optional paste actions may use macOS permissions, including Accessibility permission.',
            'You are responsible for the information you copy, store, search, paste, or otherwise process using the clipboard features. You should not store sensitive information in clipboard history unless you understand and accept the associated risks.',
          ],
        },
        {
          number: '4.2',
          title: 'Files and LocalSend',
          body: [
            'Files placed in the file tray or transferred using the LocalSend protocol remain under your control.',
            'LocalSend transfers occur directly over the local network between your Mac and a device selected or approved by you. The Developer does not operate a file-transfer cloud service and does not monitor or route the contents of LocalSend transfers.',
            'You are responsible for ensuring that you have the right to access, copy, convert, send, receive, and store any file processed using the App.',
          ],
        },
        {
          number: '4.3',
          title: 'Music and Media Features',
          body: [
            'DynamicLand may interact with Apple Music or Spotify through supported macOS automation, Apple frameworks, APIs, or other permitted mechanisms to display media information or provide playback controls.',
            'You are responsible for maintaining any third-party account, subscription, permission, or software required to use those services.',
          ],
        },
      ],
    },
    {
      id: 'apple-intelligence',
      number: 5,
      title: 'Apple Intelligence, Web Search, and Generated Output',
      subsections: [
        {
          number: '5.1',
          title: 'Apple Intelligence',
          body: [
            'DynamicLand may provide assistant or generated-content features using Apple Intelligence.',
            'Where supported and selected, processing may occur on your device. If you enable an eligible cloud-processing option, relevant requests and associated information may be processed by Apple’s Private Cloud Compute service in accordance with Apple’s applicable terms and privacy practices.',
            'Availability and behavior depend on your Mac model, operating-system version, language, region, Apple Intelligence settings, network connection, and Apple’s services.',
          ],
        },
        {
          number: '5.2',
          title: 'Web Search',
          body: [
            'If you enable or request web-search functionality, the App may send your search query to DuckDuckGo and may retrieve content from third-party websites. Those requests are subject to the applicable third party’s terms and privacy practices.',
            'Do not include confidential, personal, or sensitive information in a web-search request unless you are comfortable transmitting that information to the relevant third party.',
          ],
        },
        {
          number: '5.3',
          title: 'Generated Output',
          body: [
            'Responses generated using Apple Intelligence or information retrieved from the web may be incomplete, inaccurate, outdated, misleading, or unsuitable for your circumstances.',
            'You must independently review and verify generated output before relying on it. DynamicLand must not be used as a substitute for professional medical, legal, financial, safety, or other expert advice.',
            'You remain responsible for decisions and actions taken based on generated or retrieved output.',
          ],
        },
      ],
    },
    {
      id: 'third-party-services',
      number: 6,
      title: 'Third-Party Services and Terms',
      body: [
        'DynamicLand is an independent application. It is not affiliated with, sponsored by, or endorsed by Apple, Spotify, DuckDuckGo, RevenueCat, or the LocalSend project, except that it is distributed through Apple’s App Store and may use services or technologies provided by those parties.',
        'Apple, Apple Music, MusicKit, macOS, and related marks are trademarks of Apple Inc. Spotify is a trademark of Spotify AB. Other trademarks, service marks, project names, and trade names belong to their respective owners.',
        'The App may interact with or depend on third-party services and technologies, including:',
        {
          list: [
            '(a) Apple and Apple Music for App Store distribution, purchases, media functionality, Apple Intelligence, and Private Cloud Compute where applicable;',
            '(b) Spotify for supported media information or playback controls;',
            '(c) RevenueCat for subscription entitlement and purchase-status management;',
            '(d) DuckDuckGo and third-party websites when web search is enabled or requested; and',
            '(e) the open LocalSend protocol for user-initiated local-network file transfers.',
          ],
        },
        'You must comply with all applicable third-party terms when using the App. Third-party services may change, become unavailable, impose restrictions, or stop working with the App without notice. The Developer does not control and is not responsible for third-party services, content, availability, security, or privacy practices.',
      ],
    },
    {
      id: 'subscriptions',
      number: 7,
      title: 'Auto-Renewable Subscriptions',
      body: [
        'DynamicLand may offer DynamicLand Pro through monthly and annual auto-renewable subscription plans. The exact subscription title, duration, price, currency, included features, and any introductory offer or trial will be displayed in the App Store purchase interface before you confirm your purchase.',
        'Prices may vary by country or region and may include applicable taxes.',
        'Payment will be charged to your Apple Account when the purchase is confirmed.',
        'Your subscription automatically renews for the same subscription period unless you cancel it at least 24 hours before the end of the current billing period. Your Apple Account may be charged for renewal within 24 hours before the end of the current period at the applicable renewal price.',
        'You can view, manage, change, or cancel your subscription through your Apple Account or App Store subscription settings. Deleting DynamicLand does not automatically cancel an active subscription.',
        'Unless required by applicable law or Apple’s policies, payments are non-refundable. Apple is responsible for processing App Store payments, renewals, cancellations, and eligible refunds.',
        'If a free trial or introductory offer is provided, any unused portion may be forfeited when you purchase a subscription, where permitted by Apple and applicable law.',
        'The features included in DynamicLand Pro may evolve over time. We will not materially reduce paid access during an already-paid subscription period except where reasonably required for legal, security, technical, or third-party-service reasons.',
        {
          link: 'Subscription management',
          href: 'https://apps.apple.com/account/subscriptions',
        },
      ],
    },
    {
      id: 'privacy',
      number: 8,
      title: 'Privacy and Data Processing',
      body: [
        'DynamicLand is designed so that its core productivity data, including clipboard history, settings, staged files, and assistant chat history, is generally stored and processed locally on your Mac.',
        'However, not every feature operates exclusively on-device.',
        'Depending on the features you use:',
        {
          list: [
            '(a) Apple may process App Store purchases, Apple Music requests, Apple Intelligence requests, or Private Cloud Compute requests;',
            '(b) RevenueCat may process purchase history, subscription-entitlement information, and an anonymous app user identifier for subscription functionality;',
            '(c) DuckDuckGo and third-party websites may receive search queries or web requests when web-search features are enabled or requested;',
            '(d) a peer device selected by you receives files transferred using LocalSend; and',
            '(e) macOS may maintain local diagnostic or system logs generated during use of the App.',
          ],
        },
        'DynamicLand does not contain advertising technology and does not use third-party advertising trackers. The Developer does not operate a developer-owned analytics or advertising server for the App.',
        'For more information, review the DynamicLand Privacy Policy:',
        {
          link: 'Privacy Policy',
          href: '/privacy',
        },
        'Your use of third-party services is also subject to their respective privacy policies.',
      ],
    },
    {
      id: 'permissions',
      number: 9,
      title: 'Permissions and Device Access',
      body: [
        'Some DynamicLand features require macOS permissions, which may include Accessibility, Automation, Apple Music or media access, Bluetooth, audio capture, local-network access, notifications, or access to user-selected files and folders.',
        'The App will only be able to use a permission after it is granted through macOS or otherwise authorized by you. You can review or revoke permissions through macOS System Settings, although doing so may prevent related features from functioning.',
        'Audio used for supported real-time visualizations is processed for that feature and is not intended to be recorded or retained by DynamicLand.',
      ],
    },
    {
      id: 'intellectual-property',
      number: 10,
      title: 'Intellectual Property',
      body: [
        'The Developer owns all rights, title, and interest in DynamicLand, including its original source code, design, interface, graphics, and other proprietary elements, excluding third-party software, content, trademarks, and open-source components.',
        'The App includes or depends on open-source components governed by their respective licenses. Applicable acknowledgments and licenses are available in the App’s Acknowledgments section.',
        'No right to use the Developer’s or any third party’s trademarks is granted except as necessary to identify the App or applicable service.',
      ],
    },
    {
      id: 'maintenance-and-support',
      number: 11,
      title: 'Maintenance and Support',
      body: [
        'The Developer, not Apple, is solely responsible for providing maintenance and support services for DynamicLand, to the extent required by applicable law or expressly promised by the Developer.',
        'Apple has no obligation whatsoever to furnish maintenance or support services for the App.',
        'Support requests may be sent using the contact information in [Section 19](#contact).',
      ],
    },
    {
      id: 'updates',
      number: 12,
      title: 'Updates and Availability',
      body: [
        'The Developer may provide updates, patches, modifications, or new versions of DynamicLand. Updates may be required to maintain compatibility, security, functionality, or access to certain features.',
        'Some features may depend on compatible Apple hardware, macOS versions, permissions, network availability, geographic availability, Apple Intelligence availability, subscriptions, or third-party services.',
        'The Developer does not guarantee that every feature will remain available indefinitely or work on every device or operating-system version.',
      ],
    },
    {
      id: 'warranty',
      number: 13,
      title: 'Warranty and Apple’s Role',
      body: [
        'DynamicLand is provided on an “AS IS” and “AS AVAILABLE” basis, with all faults and without warranties except to the extent a warranty cannot lawfully be excluded.',
        'To the maximum extent permitted by applicable law, the Developer disclaims all express, implied, and statutory warranties, including warranties of merchantability, satisfactory quality, fitness for a particular purpose, accuracy, quiet enjoyment, and non-infringement.',
        'The Developer does not warrant that the App will always be available, uninterrupted, secure, accurate, error-free, or compatible with every device, operating-system version, application, network, or third-party service.',
        'If the App fails to conform to an applicable warranty, you may notify Apple, and Apple may refund the purchase price paid for the App, if any, as provided by Apple’s applicable policies.',
        'To the maximum extent permitted by applicable law, Apple will have no other warranty obligation regarding the App. Any other losses, claims, damages, costs, or expenses attributable to a failure to conform to a warranty are the Developer’s responsibility to the extent required by applicable law.',
        'Nothing in these Terms excludes or limits mandatory consumer rights that cannot lawfully be excluded or limited.',
      ],
    },
    {
      id: 'product-claims',
      number: 14,
      title: 'Product Claims',
      body: [
        'The Developer, not Apple, is responsible for addressing claims by you or a third party relating to DynamicLand or your possession or use of the App, including:',
        {
          list: [
            '(a) product-liability claims;',
            '(b) claims that the App fails to conform to an applicable legal or regulatory requirement; and',
            '(c) claims arising under consumer-protection, privacy, or similar legislation.',
          ],
        },
        'This section does not limit rights or obligations that cannot lawfully be limited.',
      ],
    },
    {
      id: 'intellectual-property-claims',
      number: 15,
      title: 'Intellectual-Property Claims',
      body: [
        'If a third party claims that DynamicLand or your possession or use of it infringes that party’s intellectual-property rights, the Developer, not Apple, will be responsible for the investigation, defense, settlement, and discharge of that claim to the extent required by applicable law.',
      ],
    },
    {
      id: 'limitation-of-liability',
      number: 16,
      title: 'Limitation of Liability',
      body: [
        'To the maximum extent permitted by applicable law, the Developer will not be liable for indirect, incidental, special, exemplary, consequential, or punitive damages, or for loss of profits, revenue, business opportunity, data, goodwill, or use, arising from or relating to the App or these Terms.',
        'To the maximum extent permitted by applicable law, the Developer’s aggregate liability arising from or relating to the App or these Terms will not exceed the greater of:',
        {
          list: [
            '(a) the amount you paid for DynamicLand during the twelve months immediately preceding the event giving rise to the claim; or',
            '(b) the minimum amount of liability that applicable law does not permit the Developer to exclude.',
          ],
        },
        'These limitations do not apply to liability that cannot lawfully be excluded or limited, including liability for fraud, willful misconduct, or other liability protected by mandatory law.',
      ],
    },
    {
      id: 'termination',
      number: 17,
      title: 'Termination',
      body: [
        'You may terminate this EULA by ceasing all use of DynamicLand and deleting the App from your devices. Deleting the App does not automatically cancel an active subscription; subscriptions must be cancelled through your Apple Account or App Store settings.',
        'The Developer may suspend or terminate your license if you materially violate these Terms, subject to applicable law.',
        'Upon termination, you must cease using and delete all copies of the App under your control. Provisions that by their nature should survive termination will survive, including provisions concerning intellectual property, disclaimers, limitations of liability, applicable law, and third-party beneficiaries.',
        'Termination of this EULA does not remove payment obligations already incurred and does not limit rights or remedies available under applicable law.',
      ],
    },
    {
      id: 'changes',
      number: 18,
      title: 'Changes to These Terms',
      body: [
        'The Developer may update these Terms to reflect changes to the App, subscriptions, third-party services, legal requirements, or business practices.',
        'The updated Terms will identify a revised effective date. Where required by applicable law, material changes will be communicated through the App, the App Store listing, or another reasonable method.',
        'Changes will not retroactively reduce mandatory rights or alter already-completed purchases where prohibited by applicable law.',
        'Your continued use of the App after updated Terms become effective constitutes acceptance of the updated Terms, to the extent permitted by law.',
      ],
    },
    {
      id: 'contact',
      number: 19,
      title: 'Developer Information and Contact',
      body: [
        { contact: product.publisher, email: product.supportEmail },
        'Questions, complaints, support requests, and claims concerning DynamicLand should be directed to the contact information above.',
      ],
    },
    {
      id: 'legal-compliance',
      number: 20,
      title: 'Legal Compliance',
      body: [
        'You represent and warrant that:',
        {
          list: [
            '(a) you are not located in a country or region subject to a United States Government embargo or designated by the United States Government as a “terrorist supporting” country or region; and',
            '(b) you are not listed on any United States Government list of prohibited or restricted parties.',
          ],
        },
        'You must use the App in compliance with all applicable local, national, and international laws and regulations.',
      ],
    },
    {
      id: 'governing-law',
      number: 21,
      title: 'Governing Law and Consumer Rights',
      body: [
        'These Terms are governed by the laws of the Kingdom of Saudi Arabia, without regard to conflict-of-law principles.',
        'Any dispute arising from or relating to these Terms will be submitted to the competent courts of the Kingdom of Saudi Arabia, except where the mandatory consumer-protection laws of your country or region provide you with the right to bring a claim in another jurisdiction or require the application of different law.',
        'Nothing in these Terms limits any mandatory consumer rights available to you under applicable law.',
      ],
    },
    {
      id: 'severability',
      number: 22,
      title: 'Severability and Entire Agreement',
      body: [
        'If any provision of these Terms is found to be invalid, illegal, or unenforceable, that provision will be enforced to the maximum extent permitted, and the remaining provisions will remain in effect.',
        'These Terms, together with the [Privacy Policy](/privacy) and any applicable App Store purchase terms, constitute the agreement between you and the Developer concerning your use of DynamicLand.',
        'A failure to enforce any provision is not a waiver of the right to enforce it later.',
      ],
    },
    {
      id: 'third-party-beneficiary',
      number: 23,
      title: 'Apple as Third-Party Beneficiary',
      body: [
        'You and the Developer acknowledge and agree that Apple and Apple’s subsidiaries are third-party beneficiaries of this EULA.',
        'Upon your acceptance of these Terms, Apple will have the right, and will be deemed to have accepted the right, to enforce this EULA against you as a third-party beneficiary.',
      ],
    },
  ],
};
