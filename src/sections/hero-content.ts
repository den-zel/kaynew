export type HeroMediaItem = {
  src: string;
  alt: string;
  poster: string;
  caption?: string;
  compact?: boolean;
};

export const heroItems: HeroMediaItem[] = [
  {
    src: "/videos/arc-hero.mp4",
    alt: "An arc of image cards surrounding an image creation landing page",
    poster: "/videos/posters/arc-hero.jpg",
  },
  {
    src: "/videos/balance-slider.mp4",
    alt: "A blue and orange slider balancing focus and break time",
    poster: "/videos/posters/balance-slider.jpg",
    compact: true,
    caption:
      "Finding the balance between focus and rest. A draggable divider shifts the proportions while the percentages roll into place.",
  },
  {
    src: "/videos/workspace.mp4",
    alt: "A workspace switcher with plan badges and changing credit balances",
    poster: "/videos/posters/workspace.jpg",
  },
  {
    src: "/videos/honeycomb.mp4",
    alt: "A honeycomb visualization highlighting property health categories",
    poster: "/videos/posters/honeycomb.jpg",
    compact: true,
    caption:
      "A different view of property health. Hovering over a category lights up its cells, connecting the summary to the details in the honeycomb.",
  },
  {
    src: "/videos/prism.mp4",
    alt: "Translucent geometric planes moving across a pastel gradient",
    poster: "/videos/posters/prism.jpg",
  },
  {
    src: "/videos/preflight.mp4",
    alt: "A release checklist progressing through its validation steps",
    poster: "/videos/posters/preflight.jpg",
    compact: true,
    caption:
      "A moment of reassurance before release. The preflight checklist moves through each check, making progress and readiness easy to follow.",
  },
  {
    src: "/videos/reviews.mp4",
    alt: "A testimonial carousel with portraits, quotes, and video review cards",
    poster: "/videos/posters/reviews.jpg",
  },
  {
    src: "/videos/ticket-button.mp4",
    alt: "A blue Book Areté button with a perforated ticket edge and arrow",
    poster: "/videos/posters/ticket-button.jpg",
    compact: true,
    caption:
      "A small invitation with a tactile feel. A perforated ticket edge and animated arrow give the booking button a character of its own.",
  },
  {
    src: "/videos/dia-features.mp4",
    alt: "A scrolling feature showcase pairing blocks, components, and sites with browser previews",
    poster: "/videos/posters/dia-features.jpg",
  },
  {
    src: "/videos/welcome.mp4",
    alt: "A welcome offer dialog with a blue sky background and an unlock offer button",
    poster: "/videos/posters/welcome.jpg",
    compact: true,
    caption:
      "A welcome offer with room to breathe. Clouds frame the message, while a single action invites visitors to unlock their first upgrade.",
  },
  {
    src: "/videos/password-input.mp4",
    alt: "A password input with a visibility toggle and a checklist that validates requirements as you type",
    poster: "/videos/posters/password-input.jpg",
  },
  {
    src: "/videos/tunnel-404.mp4",
    alt: "A 404 page framed by moving image panels arranged in a perspective tunnel",
    poster: "/videos/posters/tunnel-404.jpg",
    compact: true,
    caption:
      "A detour worth a look. Image panels travel through a perspective tunnel around the 404 message, with a clear route back home.",
  },
  {
    src: "/videos/daily-streak.mp4",
    alt: "A daily streak popover with completed days, a check-in action, and progress toward a weekly reward",
    poster: "/videos/posters/daily-streak.jpg",
  },
];
