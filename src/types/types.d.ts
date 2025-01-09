/* This file contains types relevant to FixTweet and the FixTweet API
   For Twitter API types, see twitterTypes.d.ts */

type InputFlags = {
  standard?: boolean;
  direct?: boolean;
  api?: boolean;
  textOnly?: boolean;
  isXDomain?: boolean;
  forceInstantView?: boolean;
  instantViewUnrollThreads?: boolean;
  archive?: boolean;
  gallery?: boolean;
  nativeMultiImage?: boolean;
  name?: string;
};

interface StatusResponse {
  text?: string;
  response?: Response;
  cacheControl?: string | null;
}

interface ResponseInstructions {
  addHeaders: string[];
  authorText?: string;
  siteName?: string;
  engagementText?: string;
  text?: string;
}

interface RenderProperties {
  status: APIStatus;
  thread?: SocialThread;
  siteText?: string;
  authorText?: string;
  engagementText?: string;
  isOverrideMedia?: boolean;
  userAgent?: string;
  text?: string;
  flags?: InputFlags;
  targetLanguage?: string;
}

interface TweetAPIResponse {
  code: number;
  message: string;
  tweet?: APITwitterStatus;
}

interface StatusAPIResponse {
  code: number;
  message: string;
  status?: APITwitterStatus;
}

interface UserAPIResponse {
  code: number;
  message: string;
  user?: APIUser;
}

interface APITranslate {
  text: string;
  source_lang: string;
  source_lang_en: string;
  target_lang: string;
}

interface APIExternalMedia {
  type: 'video';
  url: string;
  thumbnail_url?: string;
  height?: number;
  width?: number;
}

interface APIPollChoice {
  label: string;
  count: number;
  percentage: number;
}

interface APIPoll {
  choices: APIPollChoice[];
  total_votes: number;
  ends_at: string;
  time_left_en: string;
}

interface APIMedia {
  type: string;
  url: string;
  width: number;
  height: number;
}

interface APIPhoto extends APIMedia {
  type: 'photo';
  altText: string;
}

interface APIVideo extends APIMedia {
  type: 'video' | 'gif';
  thumbnail_url: string;
  format: string;
  duration: number;
  variants: TweetMediaFormat[];
}

interface APIMosaicPhoto extends APIMedia {
  type: 'mosaic_photo';
  formats: {
    webp: string;
    jpeg: string;
  };
}

interface APIStatus {
  id: string;
  url: string;
  text: string;
  created_at: string;
  created_timestamp: number;

  likes: number;
  reposts: number;
  replies: number;

  quote?: APIStatus;
  poll?: APIPoll;
  author: APIUser;

  media: {
    external?: APIExternalMedia;
    photos?: APIPhoto[];
    videos?: APIVideo[];
    all?: APIMedia[];
    mosaic?: APIMosaicPhoto;
  };

  lang: string | null;
  possibly_sensitive: boolean;

  replying_to: {
    screen_name: string;
    post: string;
  } | null;

  source: string | null;

  embed_card: 'tweet' | 'summary' | 'summary_large_image' | 'player';
  provider: DataProvider;
}

interface APITwitterCommunityNote {
  text: string;
  entities: BirdwatchEntity[];
}

interface APITwitterStatus extends APIStatus {
  views?: number | null;
  translation?: APITranslate;

  is_note_tweet: boolean;
  community_note: APITwitterCommunityNote | null;
  provider: DataProvider.Twitter;
}

interface APIBlueskyStatus extends APIStatus {
  provider: DataProvider.Bsky;
}

interface APIUser {
  id: string;
  name: string;
  screen_name: string;
  global_screen_name?: string;
  avatar_url: string;
  banner_url: string;
  // verified: 'legacy' | 'blue'| 'business' | 'government';
  // verified_label: string;
  description: string;
  location: string;
  url: string;
  protected: boolean;
  followers: number;
  following: number;
  statuses: number;
  likes: number;
  joined: string;
  website: {
    url: string;
    display_url: string;
  } | null;
  birthday: {
    day?: number;
    month?: number;
    year?: number;
  };
}

interface SocialPost {
  status: APIStatus | APITwitterStatus | null;
  author: APIUser | null;
}

interface SocialThread {
  status: APIStatus | APITwitterStatus | null;
  thread: (APIStatus | APITwitterStatus)[] | null;
  author: APIUser | null;
  code: number;
}

interface FetchResults {
  status: number;
}

interface OEmbed {
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  provider_url?: string;
  title?: string | null;
  type: 'link';
  version: '1.0';
}
