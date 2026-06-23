import { SourceItem, AnalysisResult, InsightCluster } from './types';

export const mockSourceItems: SourceItem[] = [
  {
    id: 's1',
    sourceType: 'app_store',
    author: 'MusicLover99',
    date: '2023-10-15',
    rawText: 'Discover Weekly used to be amazing, but for the past 6 months it just gives me the exact same 10 artists over and over. I want to find new music, not listen to slightly different songs by bands I already know.',
    normalizedText: 'discover weekly used to be amazing but for the past 6 months it just gives me the exact same 10 artists over and over i want to find new music not listen to slightly different songs by bands i already know',
    productName: 'Spotify iOS',
    language: 'en',
    region: 'US'
  },
  {
    id: 's2',
    sourceType: 'play_store',
    author: 'AndroidAudio',
    date: '2023-10-16',
    rawText: 'Why does Spotify keep putting podcasts in my music feed? And when I ask for a song radio, it just plays my heavy rotation. It feels like I am trapped in a loop.',
    normalizedText: 'why does spotify keep putting podcasts in my music feed and when i ask for a song radio it just plays my heavy rotation it feels like i am trapped in a loop',
    productName: 'Spotify Android',
    language: 'en',
    region: 'UK'
  },
  {
    id: 's3',
    sourceType: 'reddit',
    author: 'u/sound_seeker',
    date: '2023-10-17',
    sourceUrl: 'https://reddit.com/r/spotify/comments/xyz123',
    rawText: 'My Taste Profile is completely ruined because I play white noise for my baby to sleep. Now Release Radar thinks I am a massive fan of "Ocean Sounds" and "Fan Hum 10 Hours". Can we please exclude playlists from recommendations?!',
    normalizedText: 'my taste profile is completely ruined because i play white noise for my baby to sleep now release radar thinks i am a massive fan of ocean sounds and fan hum 10 hours can we please exclude playlists from recommendations',
    productName: 'Spotify Desktop',
    language: 'en',
    region: 'US'
  },
  {
    id: 's4',
    sourceType: 'forum',
    author: 'IndieHead',
    date: '2023-10-18',
    rawText: 'The algorithm pushes the same mainstream artists regardless of what indie band I start a radio station from. It always converges to Drake or Taylor Swift within 5 songs. So frustrating.',
    normalizedText: 'the algorithm pushes the same mainstream artists regardless of what indie band i start a radio station from it always converges to drake or taylor swift within 5 songs so frustrating',
    productName: 'Spotify Web',
    language: 'en',
    region: 'CA'
  },
  {
    id: 's5',
    sourceType: 'social',
    author: '@tweet_music',
    date: '2023-10-19',
    rawText: 'i miss the old days when spotify actually helped me discover underground artists. now the daily mixes are literally just my liked songs reorganized into different buckets.',
    normalizedText: 'i miss the old days when spotify actually helped me discover underground artists now the daily mixes are literally just my liked songs reorganized into different buckets',
    productName: 'Spotify General',
    language: 'en',
    region: 'US'
  },
  {
    id: 's6',
    sourceType: 'app_store',
    author: 'gym_bro',
    date: '2023-10-20',
    rawText: 'Great for making my own gym playlists, but the recommended songs to add at the bottom are always the same 5 tracks. It never actually suggests anything fresh.',
    normalizedText: 'great for making my own gym playlists but the recommended songs to add at the bottom are always the same 5 tracks it never actually suggests anything fresh',
    productName: 'Spotify iOS',
    language: 'en',
    region: 'AU'
  },
  {
    id: 's7',
    sourceType: 'reddit',
    author: 'u/classic_rocker',
    date: '2023-10-21',
    rawText: 'I clicked on a K-Pop song ONCE to see what the hype was about, and now half of my Discover Weekly is K-Pop. How do I reset this? It is so rigid.',
    normalizedText: 'i clicked on a k-pop song once to see what the hype was about and now half of my discover weekly is k-pop how do i reset this it is so rigid',
    productName: 'Spotify Mobile',
    language: 'en',
    region: 'US'
  },
  {
    id: 's8',
    sourceType: 'play_store',
    author: 'commuter22',
    date: '2023-10-22',
    rawText: 'Love the UI, but the recommendations are stale. I end up just listening to my "On Repeat" playlist because the AI DJ just plays the same stuff anyway with annoying commentary.',
    normalizedText: 'love the ui but the recommendations are stale i end up just listening to my on repeat playlist because the ai dj just plays the same stuff anyway with annoying commentary',
    productName: 'Spotify Android',
    language: 'en',
    region: 'UK'
  },
  {
    id: 's9',
    sourceType: 'forum',
    author: 'dj_spin',
    date: '2023-10-23',
    rawText: 'Smart Shuffle is the worst feature they added. It keeps adding the same pop hits to my carefully curated techno playlist. It completely ruins the vibe.',
    normalizedText: 'smart shuffle is the worst feature they added it keeps adding the same pop hits to my carefully curated techno playlist it completely ruins the vibe',
    productName: 'Spotify Desktop',
    language: 'en',
    region: 'DE'
  },
  {
    id: 's10',
    sourceType: 'app_store',
    author: 'new_user_1',
    date: '2023-10-24',
    rawText: 'I’m trying to find new jazz artists, but Spotify keeps playing my existing jazz playlist. It feels impossible to break out of the bubble it put me in.',
    normalizedText: 'i am trying to find new jazz artists but spotify keeps playing my existing jazz playlist it feels impossible to break out of the bubble it put me in',
    productName: 'Spotify iOS',
    language: 'en',
    region: 'US'
  }
];
// mockInsightClusters removed as clustering is now dynamic
