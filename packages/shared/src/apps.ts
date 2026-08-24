export const TV_APP_IDS = ["youtube", "prime-video", "hotstar"] as const;

export type TvAppId = (typeof TV_APP_IDS)[number];

export const TV_APP_PACKAGES: Record<TvAppId, string> = {
  youtube: "com.google.android.youtube.tv",
  "prime-video": "com.amazon.amazonvideo.livingroom",
  hotstar: "in.startv.hotstar",
};

const TV_APP_LINKS: Record<TvAppId, string> = {
  youtube: "https://www.youtube.com",
  "prime-video": "https://app.primevideo.com",
  hotstar: "https://www.hotstar.com/in",
};

const TV_APP_ID_SET = new Set<string>(TV_APP_IDS);

export function isTvAppId(value: unknown): value is TvAppId {
  return typeof value === "string" && TV_APP_ID_SET.has(value);
}

export function tvAppLink(app: TvAppId): string {
  return TV_APP_LINKS[app];
}
