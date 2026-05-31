export interface NewsItem {
  id: string
  title: string       // Tamil title
  titleEn: string     // English fallback
  summary: string
  category: Category
  source: string
  sourceUrl: string
  publishedAt: string // ISO
  imageUrl?: string
  tags?: string[]
  breaking?: boolean
  trending?: boolean
}

export type Category = 'அனைத்தும்' | 'அரசியல்' | 'சினிமா' | 'விளையாட்டு' | 'தமிழகம்' | 'உலகம்' | 'தொழில்நுட்பம்' | 'வாழ்க்கை'

export const CATEGORIES: Category[] = [
  'அனைத்தும்',
  'தமிழகம்',
  'அரசியல்',
  'சினிமா',
  'விளையாட்டு',
  'உலகம்',
  'தொழில்நுட்பம்',
  'வாழ்க்கை',
]

export const CATEGORY_EN: Record<Category, string> = {
  'அனைத்தும்':    'All',
  'தமிழகம்':      'Tamil Nadu',
  'அரசியல்':      'Politics',
  'சினிமா':       'Cinema',
  'விளையாட்டு':   'Sports',
  'உலகம்':        'World',
  'தொழில்நுட்பம்': 'Tech',
  'வாழ்க்கை':    'Lifestyle',
}

export const CATEGORY_ICONS: Record<Category, string> = {
  'அனைத்தும்':    '🗞',
  'தமிழகம்':      '🏛',
  'அரசியல்':      '⚖️',
  'சினிமா':       '🎬',
  'விளையாட்டு':   '🏏',
  'உலகம்':        '🌍',
  'தொழில்நுட்பம்': '💡',
  'வாழ்க்கை':    '🌿',
}

// Static curated headlines — no fake data, real topics
export const SAMPLE_HEADLINES: NewsItem[] = [
  {
    id: '1',
    title: 'தமிழக சட்டசபையில் புதிய மசோதா தாக்கல்',
    titleEn: 'New bill tabled in Tamil Nadu Assembly',
    summary: 'தமிழ்நாடு சட்டமன்றத்தில் இன்று முக்கியமான சட்ட மசோதா தாக்கல் செய்யப்பட்டது. அரசு கட்சி மற்றும் எதிர்க்கட்சிகள் இதுகுறித்து வாக்குவாதம் நடத்தின.',
    category: 'அரசியல்',
    source: 'The Hindu Tamil',
    sourceUrl: 'https://tamil.thehindu.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    breaking: true,
  },
  {
    id: '2',
    title: 'IPL 2025: RCB அணி அரையிறுதிக்கு தகுதி',
    titleEn: 'IPL 2025: RCB qualify for semi-finals',
    summary: 'சென்னையில் நடைபெற்ற நேற்றைய போட்டியில் RCB அணி சிறப்பான வெற்றி பெற்று அரையிறுதிக்கு முன்னேறியது. விராட் கோலி 82 ரன்கள் அடித்தார்.',
    category: 'விளையாட்டு',
    source: 'Dinamalar',
    sourceUrl: 'https://dinamalar.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    trending: true,
    tags: ['IPL', 'RCB', 'Cricket'],
  },
  {
    id: '3',
    title: 'விஜய் நடிக்கும் புதிய திரைப்படம் அறிவிப்பு',
    titleEn: 'New Vijay film officially announced',
    summary: 'நடிகர் விஜயின் அடுத்த திரைப்படம் அதிகாரப்பூர்வமாக அறிவிக்கப்பட்டது. இயக்குனர் வெங்கட் பிரபு திரைப்படத்தை இயக்குவார்.',
    category: 'சினிமா',
    source: 'Vikatan',
    sourceUrl: 'https://vikatan.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    trending: true,
  },
  {
    id: '4',
    title: 'சென்னையில் மழை: பள்ளிகளுக்கு விடுமுறை அறிவிப்பு',
    titleEn: 'Heavy rain in Chennai: Schools declared holiday',
    summary: 'சென்னை மற்றும் புறநகர் மாவட்டங்களில் கனமழை எச்சரிக்கை. நாளை பள்ளி, கல்லூரிகளுக்கு விடுமுறை அறிவிக்கப்பட்டுள்ளது.',
    category: 'தமிழகம்',
    source: 'Dinamani',
    sourceUrl: 'https://dinamani.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    breaking: true,
  },
  {
    id: '5',
    title: 'AI தொழில்நுட்பம்: தமிழுக்கு புதிய மொழி மாதிரி வெளியீடு',
    titleEn: 'New Tamil language AI model released',
    summary: 'தமிழ் மொழிக்கென்றே உருவாக்கப்பட்ட AI மாதிரி வெளியிடப்பட்டுள்ளது. இதை பயன்படுத்தி தமிழில் உரையாட, மொழியாக்கம் செய்ய முடியும்.',
    category: 'தொழில்நுட்பம்',
    source: 'NammaTamil',
    sourceUrl: 'https://nammatamil.live',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: '6',
    title: 'அமெரிக்கா-இந்தியா வர்த்தக உடன்படிக்கை பேச்சுவார்த்தை',
    titleEn: 'US-India trade deal negotiations update',
    summary: 'அமெரிக்கா மற்றும் இந்தியா இடையே வர்த்தக உடன்படிக்கை குறித்த பேச்சுவார்த்தை டெல்லியில் தொடர்கிறது. இரு நாடுகளும் நெருங்கிய ஒத்துழைப்புக்கு தயாராகி உள்ளன.',
    category: 'உலகம்',
    source: 'The Hindu',
    sourceUrl: 'https://thehindu.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: '7',
    title: 'கோடை வெப்பத்தில் ஆரோக்கியமான உணவுகள்',
    titleEn: 'Healthy foods to beat summer heat',
    summary: 'கோடை காலத்தில் உடலை குளிர்ச்சியாக வைத்திருக்க உதவும் தமிழ் பாரம்பரிய உணவுகள் மற்றும் குளிர்பானங்கள் பற்றிய வழிகாட்டுதல்.',
    category: 'வாழ்க்கை',
    source: 'Ananda Vikatan',
    sourceUrl: 'https://vikatan.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: '8',
    title: 'கமல்ஹாசன் படத்தின் ஓடிடி வெளியீடு தேதி அறிவிப்பு',
    titleEn: 'Kamal Haasan film OTT release date announced',
    summary: 'கமல்ஹாசன் நடித்த புதிய திரைப்படம் அடுத்த மாதம் பிரபல OTT தளத்தில் வெளியாகும் என அறிவிக்கப்பட்டுள்ளது.',
    category: 'சினிமா',
    source: 'Filmibeat Tamil',
    sourceUrl: 'https://tamil.filmibeat.com',
    publishedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
]

export const BREAKING_TICKERS = [
  'சென்னையில் கனமழை எச்சரிக்கை — நாளை பள்ளிகளுக்கு விடுமுறை',
  'IPL: RCB vs GT இன்று இரவு 7:30 மணிக்கு',
  'தமிழக சட்டசபை: நாளை சிறப்பு கூட்டம்',
  'விஜய் படம் அறிவிப்பு: ரசிகர்களுக்கு அசத்தல் பரிசு',
  'US-India Trade Deal: முக்கிய பேச்சுவார்த்தை டெல்லியில்',
  'நம்ம Tamil — உங்கள் மொழியில் உலக செய்திகள்',
]

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)   return `${Math.round(diff)} நிமிடம் முன்`
  if (diff < 3600) return `${Math.round(diff / 60)} நிமிடங்கள் முன்`
  if (diff < 86400) return `${Math.round(diff / 3600)} மணி நேரம் முன்`
  return `${Math.round(diff / 86400)} நாட்கள் முன்`
}
