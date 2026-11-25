import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/api";
import { getCurrentUser, updatePreferredLanguage } from "@/lib/adapters/authAdapter";
import { useApp } from "@/lib/store";

export const interfaceLanguages = [
  { code: "en", nativeName: "English", locale: "en-IN" },
  { code: "hi", nativeName: "हिन्दी", locale: "hi-IN" },
  { code: "ta", nativeName: "தமிழ்", locale: "ta-IN" },
  { code: "te", nativeName: "తెలుగు", locale: "te-IN" },
  { code: "ml", nativeName: "മലയാളം", locale: "ml-IN" },
  { code: "kn", nativeName: "ಕನ್ನಡ", locale: "kn-IN" },
  { code: "bn", nativeName: "বাংলা", locale: "bn-IN" },
  { code: "mr", nativeName: "मराठी", locale: "mr-IN" },
  { code: "gu", nativeName: "ગુજરાતી", locale: "gu-IN" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ", locale: "pa-IN" },
  { code: "or", nativeName: "ଓଡ଼ିଆ", locale: "or-IN" },
  { code: "as", nativeName: "অসমীয়া", locale: "as-IN" },
  { code: "ur", nativeName: "اردو", locale: "ur-IN" },
] as const;

export type InterfaceLanguage = typeof interfaceLanguages[number]["code"];
const LANGUAGE_KEY = "fale-interface-language";

const translations: Partial<Record<InterfaceLanguage, Record<string, string>>> = {
  hi: {
    Home: "होम", Jobs: "नौकरियाँ", Shifts: "शिफ़्ट", Applications: "आवेदन", Earnings: "कमाई", Learning: "सीखें", Huddle: "चर्चा", Dashboard: "डैशबोर्ड", "Jobs & Shifts": "नौकरियाँ और शिफ़्ट", Candidates: "उम्मीदवार", "Post Opening": "रिक्ति पोस्ट करें", "Wallet & Escrow": "वॉलेट और एस्क्रो", Overview: "अवलोकन", "Candidate KYC": "उम्मीदवार सत्यापन", "Hospital Verification": "अस्पताल सत्यापन", "Job Approvals": "नौकरी अनुमोदन", Shortlisting: "शॉर्टलिस्टिंग", "Huddle Moderation": "चर्चा मॉडरेशन", "Support Tickets": "सहायता अनुरोध", Profile: "प्रोफ़ाइल", Language: "भाषा", Appearance: "दिखावट", Light: "लाइट", Dark: "डार्क", System: "सिस्टम", "Sign out of session": "साइन आउट", "Clinical shifts": "क्लिनिकल शिफ़्ट", "Earnings & Payouts": "कमाई और भुगतान", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "ग्रेजुएशन, पेशेवर पंजीकरण और FALE सत्यापन के बाद क्लिनिकल शिफ़्ट का भुगतान उपलब्ध होगा।",
  },
  ta: {
    Home: "முகப்பு", Jobs: "வேலைகள்", Shifts: "பணிநேரங்கள்", Applications: "விண்ணப்பங்கள்", Earnings: "வருமானம்", Learning: "கற்றல்", Huddle: "கலந்துரையாடல்", Dashboard: "டாஷ்போர்டு", "Jobs & Shifts": "வேலைகள் மற்றும் பணிநேரங்கள்", Candidates: "விண்ணப்பதாரர்கள்", "Post Opening": "வேலைவாய்ப்பை வெளியிடு", "Wallet & Escrow": "பணப்பை மற்றும் எஸ்க்ரோ", Overview: "கண்ணோட்டம்", "Candidate KYC": "விண்ணப்பதாரர் சரிபார்ப்பு", "Hospital Verification": "மருத்துவமனை சரிபார்ப்பு", "Job Approvals": "வேலை ஒப்புதல்கள்", Shortlisting: "தேர்வுப் பட்டியல்", "Huddle Moderation": "கலந்துரையாடல் கண்காணிப்பு", "Support Tickets": "உதவி கோரிக்கைகள்", Profile: "சுயவிவரம்", Language: "மொழி", Appearance: "தோற்றம்", Light: "ஒளி", Dark: "இருள்", System: "சாதன அமைப்பு", "Sign out of session": "வெளியேறு", "Clinical shifts": "மருத்துவப் பணிநேரங்கள்", "Earnings & Payouts": "வருமானம் மற்றும் பணப்பரிமாற்றங்கள்", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "பட்டம், தொழில்முறை பதிவு மற்றும் FALE சரிபார்ப்பை முடித்த பிறகு மருத்துவப் பணிநேர வருமானம் கிடைக்கும்.",
  },
  te: {
    Home: "హోమ్", Jobs: "ఉద్యోగాలు", Shifts: "షిఫ్ట్‌లు", Applications: "దరఖాస్తులు", Earnings: "ఆదాయం", Learning: "నేర్చుకోండి", Huddle: "చర్చ", Dashboard: "డ్యాష్‌బోర్డ్", "Jobs & Shifts": "ఉద్యోగాలు & షిఫ్ట్‌లు", Candidates: "అభ్యర్థులు", "Post Opening": "ఉద్యోగాన్ని పోస్ట్ చేయండి", "Wallet & Escrow": "వాలెట్ & ఎస్క్రో", Overview: "అవలోకనం", "Candidate KYC": "అభ్యర్థి ధృవీకరణ", "Hospital Verification": "ఆసుపత్రి ధృవీకరణ", "Job Approvals": "ఉద్యోగ ఆమోదాలు", Shortlisting: "షార్ట్‌లిస్టింగ్", "Huddle Moderation": "చర్చ నిర్వహణ", "Support Tickets": "సహాయ అభ్యర్థనలు", Profile: "ప్రొఫైల్", Language: "భాష", Appearance: "రూపం", Light: "లైట్", Dark: "డార్క్", System: "సిస్టమ్", "Sign out of session": "సైన్ అవుట్", "Clinical shifts": "క్లినికల్ షిఫ్ట్‌లు", "Earnings & Payouts": "ఆదాయం & చెల్లింపులు", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "గ్రాడ్యుయేషన్, ప్రొఫెషనల్ రిజిస్ట్రేషన్ మరియు FALE ధృవీకరణ తర్వాత క్లినికల్ షిఫ్ట్ చెల్లింపులు అందుబాటులోకి వస్తాయి.",
  },
  ml: {
    Home: "ഹോം", Jobs: "ജോലികൾ", Shifts: "ഷിഫ്റ്റുകൾ", Applications: "അപേക്ഷകൾ", Earnings: "വരുമാനം", Learning: "പഠനം", Huddle: "ചർച്ച", Dashboard: "ഡാഷ്ബോർഡ്", "Jobs & Shifts": "ജോലികളും ഷിഫ്റ്റുകളും", Candidates: "സ്ഥാനാർത്ഥികൾ", "Post Opening": "ജോലി പ്രസിദ്ധീകരിക്കുക", "Wallet & Escrow": "വാലറ്റും എസ്ക്രോയും", Overview: "അവലോകനം", "Candidate KYC": "സ്ഥാനാർത്ഥി പരിശോധന", "Hospital Verification": "ആശുപത്രി പരിശോധന", "Job Approvals": "ജോലി അംഗീകാരങ്ങൾ", Shortlisting: "ഷോർട്ട്‌ലിസ്റ്റ്", "Huddle Moderation": "ചർച്ച നിയന്ത്രണം", "Support Tickets": "സഹായ അഭ്യർത്ഥനകൾ", Profile: "പ്രൊഫൈൽ", Language: "ഭാഷ", Appearance: "രൂപം", Light: "ലൈറ്റ്", Dark: "ഡാർക്ക്", System: "സിസ്റ്റം", "Sign out of session": "സൈൻ ഔട്ട്", "Clinical shifts": "ക്ലിനിക്കൽ ഷിഫ്റ്റുകൾ", "Earnings & Payouts": "വരുമാനവും പണമടക്കവും", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "ബിരുദം, പ്രൊഫഷണൽ രജിസ്ട്രേഷൻ, FALE പരിശോധന എന്നിവ പൂർത്തിയാക്കിയ ശേഷം ക്ലിനിക്കൽ ഷിഫ്റ്റ് വരുമാനം ലഭ്യമാകും.",
  },
  kn: {
    Home: "ಮುಖಪುಟ", Jobs: "ಉದ್ಯೋಗಗಳು", Shifts: "ಶಿಫ್ಟ್‌ಗಳು", Applications: "ಅರ್ಜಿಗಳು", Earnings: "ಗಳಿಕೆ", Learning: "ಕಲಿಕೆ", Huddle: "ಚರ್ಚೆ", Dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "Jobs & Shifts": "ಉದ್ಯೋಗಗಳು ಮತ್ತು ಶಿಫ್ಟ್‌ಗಳು", Candidates: "ಅಭ್ಯರ್ಥಿಗಳು", "Post Opening": "ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ", "Wallet & Escrow": "ವಾಲೆಟ್ ಮತ್ತು ಎಸ್ಕ್ರೋ", Overview: "ಅವಲೋಕನ", "Candidate KYC": "ಅಭ್ಯರ್ಥಿ ಪರಿಶೀಲನೆ", "Hospital Verification": "ಆಸ್ಪತ್ರೆ ಪರಿಶೀಲನೆ", "Job Approvals": "ಉದ್ಯೋಗ ಅನುಮೋದನೆಗಳು", Shortlisting: "ಕಿರುಪಟ್ಟಿ", "Huddle Moderation": "ಚರ್ಚೆ ನಿರ್ವಹಣೆ", "Support Tickets": "ಸಹಾಯ ವಿನಂತಿಗಳು", Profile: "ಪ್ರೊಫೈಲ್", Language: "ಭಾಷೆ", Appearance: "ರೂಪ", Light: "ಲೈಟ್", Dark: "ಡಾರ್ಕ್", System: "ಸಿಸ್ಟಮ್", "Sign out of session": "ಸೈನ್ ಔಟ್", "Clinical shifts": "ಕ್ಲಿನಿಕಲ್ ಶಿಫ್ಟ್‌ಗಳು", "Earnings & Payouts": "ಗಳಿಕೆ ಮತ್ತು ಪಾವತಿಗಳು", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "ಪದವಿ, ವೃತ್ತಿಪರ ನೋಂದಣಿ ಮತ್ತು FALE ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡ ನಂತರ ಕ್ಲಿನಿಕಲ್ ಶಿಫ್ಟ್ ಪಾವತಿಗಳು ಲಭ್ಯವಾಗುತ್ತವೆ.",
  },
  bn: {
    Home: "হোম", Jobs: "চাকরি", Shifts: "শিফট", Applications: "আবেদন", Earnings: "আয়", Learning: "শেখা", Huddle: "আলোচনা", Dashboard: "ড্যাশবোর্ড", "Jobs & Shifts": "চাকরি ও শিফট", Candidates: "প্রার্থী", "Post Opening": "চাকরির বিজ্ঞপ্তি দিন", "Wallet & Escrow": "ওয়ালেট ও এসক্রো", Overview: "সংক্ষিপ্ত বিবরণ", "Candidate KYC": "প্রার্থী যাচাইকরণ", "Hospital Verification": "হাসপাতাল যাচাইকরণ", "Job Approvals": "চাকরি অনুমোদন", Shortlisting: "সংক্ষিপ্ত তালিকা", "Huddle Moderation": "আলোচনা পরিচালনা", "Support Tickets": "সহায়তার অনুরোধ", Profile: "প্রোফাইল", Language: "ভাষা", Appearance: "চেহারা", Light: "লাইট", Dark: "ডার্ক", System: "সিস্টেম", "Sign out of session": "সাইন আউট", "Clinical shifts": "ক্লিনিক্যাল শিফট", "Earnings & Payouts": "আয় ও পেমেন্ট", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "স্নাতক, পেশাগত নিবন্ধন এবং FALE যাচাইকরণ সম্পন্ন হলে ক্লিনিক্যাল শিফটের অর্থপ্রদান চালু হবে।",
  },
  mr: {
    Home: "मुख्यपृष्ठ", Jobs: "नोकऱ्या", Shifts: "शिफ्ट", Applications: "अर्ज", Earnings: "कमाई", Learning: "शिका", Huddle: "चर्चा", Dashboard: "डॅशबोर्ड", "Jobs & Shifts": "नोकऱ्या आणि शिफ्ट", Candidates: "उमेदवार", "Post Opening": "नोकरी पोस्ट करा", "Wallet & Escrow": "वॉलेट आणि एस्क्रो", Overview: "आढावा", "Candidate KYC": "उमेदवार पडताळणी", "Hospital Verification": "रुग्णालय पडताळणी", "Job Approvals": "नोकरी मंजुरी", Shortlisting: "निवड यादी", "Huddle Moderation": "चर्चा नियंत्रण", "Support Tickets": "मदत विनंत्या", Profile: "प्रोफाइल", Language: "भाषा", Appearance: "दिसणे", Light: "लाइट", Dark: "डार्क", System: "सिस्टम", "Sign out of session": "साइन आउट", "Clinical shifts": "क्लिनिकल शिफ्ट", "Earnings & Payouts": "कमाई आणि पेमेंट", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "पदवी, व्यावसायिक नोंदणी आणि FALE पडताळणी पूर्ण झाल्यानंतर क्लिनिकल शिफ्टचे पेमेंट उपलब्ध होईल.",
  },
  gu: {
    Home: "હોમ", Jobs: "નોકરીઓ", Shifts: "શિફ્ટ", Applications: "અરજીઓ", Earnings: "આવક", Learning: "શીખવું", Huddle: "ચર્ચા", Dashboard: "ડેશબોર્ડ", "Jobs & Shifts": "નોકરીઓ અને શિફ્ટ", Candidates: "ઉમેદવારો", "Post Opening": "નોકરી પોસ્ટ કરો", "Wallet & Escrow": "વૉલેટ અને એસ્ક્રો", Overview: "ઝાંખી", "Candidate KYC": "ઉમેદવાર ચકાસણી", "Hospital Verification": "હોસ્પિટલ ચકાસણી", "Job Approvals": "નોકરી મંજૂરીઓ", Shortlisting: "શૉર્ટલિસ્ટિંગ", "Huddle Moderation": "ચર્ચા સંચાલન", "Support Tickets": "સહાય વિનંતીઓ", Profile: "પ્રોફાઇલ", Language: "ભાષા", Appearance: "દેખાવ", Light: "લાઇટ", Dark: "ડાર્ક", System: "સિસ્ટમ", "Sign out of session": "સાઇન આઉટ", "Clinical shifts": "ક્લિનિકલ શિફ્ટ", "Earnings & Payouts": "આવક અને ચુકવણી", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "ગ્રેજ્યુએશન, વ્યાવસાયિક નોંધણી અને FALE ચકાસણી પછી ક્લિનિકલ શિફ્ટની ચુકવણી ઉપલબ્ધ થશે.",
  },
  pa: {
    Home: "ਮੁੱਖ ਪੰਨਾ", Jobs: "ਨੌਕਰੀਆਂ", Shifts: "ਸ਼ਿਫ਼ਟਾਂ", Applications: "ਅਰਜ਼ੀਆਂ", Earnings: "ਕਮਾਈ", Learning: "ਸਿੱਖੋ", Huddle: "ਚਰਚਾ", Dashboard: "ਡੈਸ਼ਬੋਰਡ", "Jobs & Shifts": "ਨੌਕਰੀਆਂ ਅਤੇ ਸ਼ਿਫ਼ਟਾਂ", Candidates: "ਉਮੀਦਵਾਰ", "Post Opening": "ਨੌਕਰੀ ਪੋਸਟ ਕਰੋ", "Wallet & Escrow": "ਵਾਲਿਟ ਅਤੇ ਐਸਕ੍ਰੋ", Overview: "ਸੰਖੇਪ ਜਾਣਕਾਰੀ", "Candidate KYC": "ਉਮੀਦਵਾਰ ਦੀ ਜਾਂਚ", "Hospital Verification": "ਹਸਪਤਾਲ ਦੀ ਜਾਂਚ", "Job Approvals": "ਨੌਕਰੀ ਮਨਜ਼ੂਰੀਆਂ", Shortlisting: "ਚੁਣੀ ਸੂਚੀ", "Huddle Moderation": "ਚਰਚਾ ਪ੍ਰਬੰਧਨ", "Support Tickets": "ਮਦਦ ਦੀਆਂ ਬੇਨਤੀਆਂ", Profile: "ਪ੍ਰੋਫ਼ਾਈਲ", Language: "ਭਾਸ਼ਾ", Appearance: "ਦਿੱਖ", Light: "ਲਾਈਟ", Dark: "ਡਾਰਕ", System: "ਸਿਸਟਮ", "Sign out of session": "ਸਾਈਨ ਆਉਟ", "Clinical shifts": "ਕਲੀਨਿਕਲ ਸ਼ਿਫ਼ਟਾਂ", "Earnings & Payouts": "ਕਮਾਈ ਅਤੇ ਭੁਗਤਾਨ", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "ਗ੍ਰੈਜੂਏਸ਼ਨ, ਪੇਸ਼ੇਵਰ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਅਤੇ FALE ਜਾਂਚ ਤੋਂ ਬਾਅਦ ਕਲੀਨਿਕਲ ਸ਼ਿਫ਼ਟ ਭੁਗਤਾਨ ਉਪਲਬਧ ਹੋਣਗੇ।",
  },
  or: {
    Home: "ମୂଳପୃଷ୍ଠା", Jobs: "ଚାକିରି", Shifts: "ସିଫ୍ଟ", Applications: "ଆବେଦନ", Earnings: "ଆୟ", Learning: "ଶିକ୍ଷା", Huddle: "ଆଲୋଚନା", Dashboard: "ଡ୍ୟାସବୋର୍ଡ", "Jobs & Shifts": "ଚାକିରି ଓ ସିଫ୍ଟ", Candidates: "ପ୍ରାର୍ଥୀ", "Post Opening": "ଚାକିରି ପୋଷ୍ଟ କରନ୍ତୁ", "Wallet & Escrow": "ୱାଲେଟ୍ ଓ ଏସ୍କ୍ରୋ", Overview: "ସାରାଂଶ", "Candidate KYC": "ପ୍ରାର୍ଥୀ ଯାଞ୍ଚ", "Hospital Verification": "ହସ୍ପିଟାଲ୍ ଯାଞ୍ଚ", "Job Approvals": "ଚାକିରି ଅନୁମୋଦନ", Shortlisting: "ସଂକ୍ଷିପ୍ତ ତାଲିକା", "Huddle Moderation": "ଆଲୋଚନା ପରିଚାଳନା", "Support Tickets": "ସହାୟତା ଅନୁରୋଧ", Profile: "ପ୍ରୋଫାଇଲ୍", Language: "ଭାଷା", Appearance: "ଦୃଶ୍ୟ", Light: "ଲାଇଟ୍", Dark: "ଡାର୍କ", System: "ସିଷ୍ଟମ୍", "Sign out of session": "ସାଇନ୍ ଆଉଟ୍", "Clinical shifts": "କ୍ଲିନିକାଲ୍ ସିଫ୍ଟ", "Earnings & Payouts": "ଆୟ ଓ ଦେୟ", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "ସ୍ନାତକ, ବୃତ୍ତିଗତ ପଞ୍ଜୀକରଣ ଏବଂ FALE ଯାଞ୍ଚ ପରେ କ୍ଲିନିକାଲ୍ ସିଫ୍ଟ ଦେୟ ଉପଲବ୍ଧ ହେବ।",
  },
  as: {
    Home: "মুখ্য পৃষ্ঠা", Jobs: "চাকৰি", Shifts: "শ্বিফ্ট", Applications: "আবেদন", Earnings: "উপাৰ্জন", Learning: "শিক্ষা", Huddle: "আলোচনা", Dashboard: "ডেশ্বব'ৰ্ড", "Jobs & Shifts": "চাকৰি আৰু শ্বিফ্ট", Candidates: "প্ৰাৰ্থী", "Post Opening": "চাকৰি প্ৰকাশ কৰক", "Wallet & Escrow": "ৱালেট আৰু এস্ক্ৰো", Overview: "সাৰাংশ", "Candidate KYC": "প্ৰাৰ্থী পৰীক্ষা", "Hospital Verification": "হাস্পতাল পৰীক্ষা", "Job Approvals": "চাকৰি অনুমোদন", Shortlisting: "চমু তালিকা", "Huddle Moderation": "আলোচনা পৰিচালনা", "Support Tickets": "সহায়ৰ অনুৰোধ", Profile: "প্ৰ'ফাইল", Language: "ভাষা", Appearance: "ৰূপ", Light: "লাইট", Dark: "ডাৰ্ক", System: "ছিষ্টেম", "Sign out of session": "ছাইন আউট", "Clinical shifts": "ক্লিনিকেল শ্বিফ্ট", "Earnings & Payouts": "উপাৰ্জন আৰু পৰিশোধ", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "স্নাতক, পেছাগত পঞ্জীয়ন আৰু FALE পৰীক্ষা সম্পূৰ্ণ হোৱাৰ পিছত ক্লিনিকেল শ্বিফ্টৰ ধন উপলব্ধ হ'ব।",
  },
  ur: {
    Home: "ہوم", Jobs: "ملازمتیں", Shifts: "شفٹیں", Applications: "درخواستیں", Earnings: "آمدنی", Learning: "سیکھیں", Huddle: "گفتگو", Dashboard: "ڈیش بورڈ", "Jobs & Shifts": "ملازمتیں اور شفٹیں", Candidates: "امیدوار", "Post Opening": "ملازمت شائع کریں", "Wallet & Escrow": "والٹ اور ایسکرو", Overview: "جائزہ", "Candidate KYC": "امیدوار کی تصدیق", "Hospital Verification": "ہسپتال کی تصدیق", "Job Approvals": "ملازمت کی منظوری", Shortlisting: "مختصر فہرست", "Huddle Moderation": "گفتگو کی نگرانی", "Support Tickets": "مدد کی درخواستیں", Profile: "پروفائل", Language: "زبان", Appearance: "ظاہری شکل", Light: "روشن", Dark: "تاریک", System: "سسٹم", "Sign out of session": "سائن آؤٹ", "Clinical shifts": "طبی شفٹیں", "Earnings & Payouts": "آمدنی اور ادائیگیاں", "Clinical shift payouts become available after graduation, professional registration, and FALE verification.": "گریجویشن، پیشہ ورانہ رجسٹریشن اور FALE تصدیق کے بعد طبی شفٹ کی ادائیگیاں دستیاب ہوں گی۔",
  },
};

// High-visibility candidate dashboard copy. Add translations here as each page is localized.
const dashboardTranslations: Partial<Record<InterfaceLanguage, Record<string, string>>> = {
  hi: {
    "Welcome back": "वापसी पर स्वागत है", "Verified Student": "सत्यापित छात्र", Verified: "सत्यापित",
    "Export Academic Portfolio": "शैक्षणिक पोर्टफोलियो डाउनलोड करें", "Explore Internships": "इंटर्नशिप देखें", "Explore Matches": "मैच देखें",
    "Update needed": "अपडेट आवश्यक", "Under review": "समीक्षाधीन", "Proof required": "प्रमाण आवश्यक", "Documents required": "दस्तावेज़ आवश्यक",
    "Verification in progress": "सत्यापन जारी है", "Action needed to complete verification": "सत्यापन पूरा करने के लिए कार्रवाई करें",
    "Submit proof of study for review": "समीक्षा के लिए पढ़ाई का प्रमाण जमा करें", "Submit your credentials for verification": "सत्यापन के लिए अपने प्रमाण-पत्र जमा करें",
    "Review requested changes": "मांगे गए बदलाव देखें", "Track verification status": "सत्यापन की स्थिति देखें", "Submit proof of study": "पढ़ाई का प्रमाण जमा करें", "Upload required documents": "ज़रूरी दस्तावेज़ अपलोड करें",
    "PROFILE VIEWS": "प्रोफ़ाइल देखे जाने की संख्या", "institutional views": "संस्थानों द्वारा देखे जाने की संख्या", "MATCHED INTERNSHIPS": "मेल खाते इंटर्नशिप", "CURATED ROLES": "आपके लिए चुनी गई नौकरियाँ", "INSTANT SHIFTS": "तुरंत उपलब्ध शिफ़्ट", APPLICATIONS: "आवेदन", "Track Pipeline": "आवेदन की स्थिति देखें",
  },
  ta: {
    "Welcome back": "மீண்டும் வரவேற்கிறோம்", "Verified Student": "சரிபார்க்கப்பட்ட மாணவர்", Verified: "சரிபார்க்கப்பட்டது",
    "Export Academic Portfolio": "கல்வி சுயவிவரத்தைப் பதிவிறக்கவும்", "Explore Internships": "பயிற்சி வாய்ப்புகளைப் பார்க்கவும்", "Explore Matches": "பொருத்தமான வாய்ப்புகளைப் பார்க்கவும்",
    "Update needed": "புதுப்பிப்பு தேவை", "Under review": "மதிப்பாய்வில் உள்ளது", "Proof required": "சான்று தேவை", "Documents required": "ஆவணங்கள் தேவை",
    "Verification in progress": "சரிபார்ப்பு நடைபெறுகிறது", "Action needed to complete verification": "சரிபார்ப்பை முடிக்க நடவடிக்கை தேவை",
    "Submit proof of study for review": "மதிப்பாய்வுக்கு படிப்பு சான்றைச் சமர்ப்பிக்கவும்", "Submit your credentials for verification": "சரிபார்ப்புக்கு உங்கள் சான்றுகளைச் சமர்ப்பிக்கவும்",
    "Review requested changes": "கோரிய மாற்றங்களைப் பார்க்கவும்", "Track verification status": "சரிபார்ப்பு நிலையைப் பார்க்கவும்", "Submit proof of study": "படிப்பு சான்றைச் சமர்ப்பிக்கவும்", "Upload required documents": "தேவையான ஆவணங்களைப் பதிவேற்றவும்",
    "PROFILE VIEWS": "சுயவிவரப் பார்வைகள்", "institutional views": "நிறுவனப் பார்வைகள்", "MATCHED INTERNSHIPS": "பொருந்தும் பயிற்சிகள்", "CURATED ROLES": "பரிந்துரைக்கப்பட்ட பணிகள்", "INSTANT SHIFTS": "உடனடி பணிநேரங்கள்", APPLICATIONS: "விண்ணப்பங்கள்", "Track Pipeline": "விண்ணப்ப நிலையைப் பார்க்கவும்",
  },
  ml: {
    "Welcome back": "വീണ്ടും സ്വാഗതം", "Verified Student": "പരിശോധിച്ച വിദ്യാർത്ഥി", Verified: "പരിശോധിച്ചു",
    "Export Academic Portfolio": "അക്കാദമിക് പ്രൊഫൈൽ ഡൗൺലോഡ് ചെയ്യുക", "Explore Internships": "ഇന്റേൺഷിപ്പുകൾ കാണുക", "Explore Matches": "പൊരുത്തങ്ങൾ കാണുക",
    "Update needed": "അപ്ഡേറ്റ് ആവശ്യമാണ്", "Under review": "പരിശോധനയിലാണ്", "Proof required": "തെളിവ് ആവശ്യമാണ്", "Documents required": "രേഖകൾ ആവശ്യമാണ്",
    "Verification in progress": "സ്ഥിരീകരണം പുരോഗമിക്കുന്നു", "Action needed to complete verification": "സ്ഥിരീകരണം പൂർത്തിയാക്കാൻ നടപടി ആവശ്യമാണ്",
    "Submit proof of study for review": "പരിശോധനയ്ക്കായി പഠന രേഖ സമർപ്പിക്കുക", "Submit your credentials for verification": "സ്ഥിരീകരണത്തിനായി യോഗ്യതാ രേഖകൾ സമർപ്പിക്കുക",
    "Review requested changes": "ആവശ്യപ്പെട്ട മാറ്റങ്ങൾ പരിശോധിക്കുക", "Track verification status": "സ്ഥിരീകരണ നില കാണുക", "Submit proof of study": "പഠന രേഖ സമർപ്പിക്കുക", "Upload required documents": "ആവശ്യമായ രേഖകൾ അപ്‌ലോഡ് ചെയ്യുക",
    "PROFILE VIEWS": "പ്രൊഫൈൽ കാഴ്ചകൾ", "institutional views": "സ്ഥാപനങ്ങളുടെ കാഴ്ചകൾ", "MATCHED INTERNSHIPS": "പൊരുത്തപ്പെടുന്ന ഇന്റേൺഷിപ്പുകൾ", "CURATED ROLES": "തിരഞ്ഞെടുത്ത ജോലികൾ", "INSTANT SHIFTS": "ഉടൻ ലഭ്യമായ ഷിഫ്റ്റുകൾ", APPLICATIONS: "അപേക്ഷകൾ", "Track Pipeline": "അപേക്ഷയുടെ പുരോഗതി കാണുക",
  },
  te: {
    "Welcome back": "తిరిగి స్వాగతం", "Verified Student": "ధృవీకరించిన విద్యార్థి", Verified: "ధృవీకరించబడింది",
    "Export Academic Portfolio": "విద్యా ప్రొఫైల్‌ను డౌన్‌లోడ్ చేయండి", "Explore Internships": "ఇంటర్న్‌షిప్‌లను చూడండి", "Explore Matches": "సరిపోలిన అవకాశాలను చూడండి",
    "Update needed": "నవీకరణ అవసరం", "Under review": "సమీక్షలో ఉంది", "Proof required": "ఆధారం అవసరం", "Documents required": "పత్రాలు అవసరం",
    "Verification in progress": "ధృవీకరణ జరుగుతోంది", "Action needed to complete verification": "ధృవీకరణ పూర్తి చేయడానికి చర్య అవసరం",
    "Submit proof of study for review": "సమీక్ష కోసం చదువు ఆధారాన్ని సమర్పించండి", "Submit your credentials for verification": "ధృవీకరణ కోసం మీ పత్రాలను సమర్పించండి",
    "Review requested changes": "కోరిన మార్పులను చూడండి", "Track verification status": "ధృవీకరణ స్థితిని చూడండి", "Submit proof of study": "చదువు ఆధారాన్ని సమర్పించండి", "Upload required documents": "అవసరమైన పత్రాలను అప్‌లోడ్ చేయండి",
    "PROFILE VIEWS": "ప్రొఫైల్ వీక్షణలు", "institutional views": "సంస్థల వీక్షణలు", "MATCHED INTERNSHIPS": "సరిపోలిన ఇంటర్న్‌షిప్‌లు", "CURATED ROLES": "మీకు సరిపోయే ఉద్యోగాలు", "INSTANT SHIFTS": "తక్షణ షిఫ్ట్‌లు", APPLICATIONS: "దరఖాస్తులు", "Track Pipeline": "దరఖాస్తుల స్థితిని చూడండి",
  },
  kn: {
    "Welcome back": "ಮರಳಿ ಸ್ವಾಗತ", "Verified Student": "ಪರಿಶೀಲಿಸಿದ ವಿದ್ಯಾರ್ಥಿ", Verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "Export Academic Portfolio": "ಶೈಕ್ಷಣಿಕ ಪ್ರೊಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ", "Explore Internships": "ಇಂಟರ್ನ್‌ಶಿಪ್‌ಗಳನ್ನು ನೋಡಿ", "Explore Matches": "ಹೊಂದಾಣಿಕೆಗಳನ್ನು ನೋಡಿ",
    "Update needed": "ನವೀಕರಣ ಅಗತ್ಯವಿದೆ", "Under review": "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ", "Proof required": "ಪುರಾವೆ ಅಗತ್ಯವಿದೆ", "Documents required": "ದಾಖಲೆಗಳು ಅಗತ್ಯವಿದೆ",
    "Verification in progress": "ಪರಿಶೀಲನೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ", "Action needed to complete verification": "ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳಿಸಲು ಕ್ರಮ ಅಗತ್ಯವಿದೆ",
    "Submit proof of study for review": "ಪರಿಶೀಲನೆಗಾಗಿ ಅಧ್ಯಯನದ ಪುರಾವೆ ಸಲ್ಲಿಸಿ", "Submit your credentials for verification": "ಪರಿಶೀಲನೆಗಾಗಿ ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಸಲ್ಲಿಸಿ",
    "Review requested changes": "ಕೋರಿದ ಬದಲಾವಣೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ", "Track verification status": "ಪರಿಶೀಲನೆಯ ಸ್ಥಿತಿ ನೋಡಿ", "Submit proof of study": "ಅಧ್ಯಯನದ ಪುರಾವೆ ಸಲ್ಲಿಸಿ", "Upload required documents": "ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "PROFILE VIEWS": "ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಣೆಗಳು", "institutional views": "ಸಂಸ್ಥೆಗಳ ವೀಕ್ಷಣೆಗಳು", "MATCHED INTERNSHIPS": "ಹೊಂದಾಣಿಕೆಯ ಇಂಟರ್ನ್‌ಶಿಪ್‌ಗಳು", "CURATED ROLES": "ಆಯ್ದ ಉದ್ಯೋಗಗಳು", "INSTANT SHIFTS": "ತಕ್ಷಣದ ಶಿಫ್ಟ್‌ಗಳು", APPLICATIONS: "ಅರ್ಜಿಗಳು", "Track Pipeline": "ಅರ್ಜಿಗಳ ಸ್ಥಿತಿ ನೋಡಿ",
  },
};

interface LanguageContextValue {
  language: InterfaceLanguage;
  locale: string;
  languages: typeof interfaceLanguages;
  setLanguage: (language: InterfaceLanguage) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const supported = new Set<string>(interfaceLanguages.map((language) => language.code));

function resolveLanguage(value: unknown): InterfaceLanguage {
  return typeof value === "string" && supported.has(value) ? value as InterfaceLanguage : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const app = useApp();
  const [language, setLanguageState] = useState<InterfaceLanguage>(() => {
    if (typeof window === "undefined") return "en";
    try { return resolveLanguage(window.localStorage.getItem(LANGUAGE_KEY)); } catch { return "en"; }
  });
  const languageChangeVersion = useRef(0);
  const applyLanguage = useCallback((next: InterfaceLanguage) => {
    setLanguageState(next);
    try { window.localStorage.setItem(LANGUAGE_KEY, next); } catch { /* Local preference is best-effort. */ }
    document.documentElement.lang = interfaceLanguages.find((item) => item.code === next)?.locale || "en-IN";
    document.documentElement.dir = next === "ur" ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    document.documentElement.lang = interfaceLanguages.find((item) => item.code === language)?.locale || "en-IN";
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    if (!app.signedIn || !getAccessToken()) return;
    const versionAtRequest = languageChangeVersion.current;
    getCurrentUser().then((user) => {
      if (versionAtRequest !== languageChangeVersion.current || !user.preferredLanguage) return;
      applyLanguage(resolveLanguage(user.preferredLanguage));
    }).catch(() => { /* Keep the saved local choice when account preferences are unavailable. */ });
  }, [app.signedIn, applyLanguage]);

  const setLanguage = useCallback((nextValue: InterfaceLanguage) => {
    const next = resolveLanguage(nextValue);
    languageChangeVersion.current += 1;
    applyLanguage(next);
    if (app.signedIn && getAccessToken()) {
      void updatePreferredLanguage(next).catch(() => {
        toast.warning("Language changed on this device", { description: "We couldn’t save this preference to your account. It will stay on this device." });
      });
    }
  }, [app.signedIn, applyLanguage]);

  const locale = interfaceLanguages.find((item) => item.code === language)?.locale || "en-IN";
  const t = useCallback((text: string) => translations[language]?.[text] || dashboardTranslations[language]?.[text] || text, [language]);
  const value = useMemo(() => ({ language, locale, languages: interfaceLanguages, setLanguage, t }), [language, locale, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

/** Small language selector for public entry points where users are not signed in yet. */
export function InterfaceLanguagePicker({ className = "" }: { className?: string }) {
  const { language, languages, setLanguage } = useLanguage();
  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="sr-only">Choose interface language</span>
      <select
        aria-label="Choose interface language"
        value={language}
        onChange={(event) => setLanguage(resolveLanguage(event.target.value))}
        className="h-9 max-w-36 cursor-pointer rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        {languages.map((item) => <option key={item.code} value={item.code}>{item.nativeName}</option>)}
      </select>
    </label>
  );
}
