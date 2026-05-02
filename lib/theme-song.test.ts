import { describe, expect, it } from "vitest";

import {
  THEME_SONG_LABEL_NAME,
  parseThemeSongUrl,
} from "./theme-song";

describe("theme-song", () => {
  it("exports the canonical theme-song label name", () => {
    expect(THEME_SONG_LABEL_NAME).toBe("themeSongUrl");
  });

  it("parses Spotify track URLs into embed metadata", () => {
    expect(parseThemeSongUrl("https://open.spotify.com/track/5ChkMS8OtdzJeqyybCc9R5?si=abc")).toEqual({
      provider: "spotify",
      sourceUrl: "https://open.spotify.com/track/5ChkMS8OtdzJeqyybCc9R5",
      embedUrl: "https://open.spotify.com/embed/track/5ChkMS8OtdzJeqyybCc9R5",
      title: "Theme song",
      height: 152,
      externalUrl: "https://open.spotify.com/track/5ChkMS8OtdzJeqyybCc9R5",
    });
  });

  it("normalizes YouTube Music URLs to a privacy-safe embed", () => {
    expect(parseThemeSongUrl("https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=xyz")).toEqual({
      provider: "youtube",
      sourceUrl: "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      title: "Theme song",
      height: 315,
      externalUrl: "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });

  it("builds a SoundCloud player URL from the public track URL", () => {
    expect(parseThemeSongUrl("https://soundcloud.com/forss/flickermood")).toEqual({
      provider: "soundcloud",
      sourceUrl: "https://soundcloud.com/forss/flickermood",
      embedUrl: "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fforss%2Fflickermood",
      title: "Theme song",
      height: 166,
      externalUrl: "https://soundcloud.com/forss/flickermood",
    });
  });

  it("converts Apple Music share URLs to the embed host", () => {
    expect(parseThemeSongUrl("https://music.apple.com/us/album/amazing-song/123456789?i=123456790")).toEqual({
      provider: "appleMusic",
      sourceUrl: "https://music.apple.com/us/album/amazing-song/123456789?i=123456790",
      embedUrl: "https://embed.music.apple.com/us/album/amazing-song/123456789?i=123456790",
      title: "Theme song",
      height: 175,
      externalUrl: "https://music.apple.com/us/album/amazing-song/123456789?i=123456790",
    });
  });

  it("rejects iframe HTML and untrusted providers", () => {
    expect(parseThemeSongUrl('<iframe src="https://open.spotify.com/embed/track/abc"></iframe>')).toBeNull();
    expect(parseThemeSongUrl("https://example.com/some-song")).toBeNull();
    expect(parseThemeSongUrl("javascript:alert(1)")).toBeNull();
  });
});
