import type { TvHomePayload } from "@netphim/tv-contracts";

// Local UI fixture only. Production builds should disable demo data.
export const demoHome: TvHomePayload = {
  generatedAt: "2026-09-08T00:00:00.000Z",
  hero: {
    id: "demo-thanh-pho-sau-mua",
    slug: "thanh-pho-sau-mua",
    title: "Thành Phố Sau Mưa",
    originalTitle: "City After Rain",
    year: 2026,
    quality: "4K",
    durationLabel: "2 giờ 08 phút",
    genres: ["Khoa học viễn tưởng", "Phiêu lưu"],
    description:
      "Một tín hiệu bí ẩn dẫn người thám hiểm cuối cùng trở lại thành phố đã biến mất ngoài khơi.",
    poster: {
      src: "/artwork/netphim-tv-hero.webp",
      alt: "Áp phích phim Thành Phố Sau Mưa",
    },
    backdrop: {
      src: "/artwork/netphim-tv-hero.webp",
      alt: "Thành phố ven biển tương lai sau cơn mưa",
    },
  },
  sections: [
    {
      id: "continue-watching",
      title: "Tiếp tục xem",
      items: [
        {
          id: "demo-hanh-trinh-phuong-bac",
          slug: "hanh-trinh-phuong-bac",
          title: "Hành Trình Phương Bắc",
          progressPercent: 64,
          poster: {
            src: "/artwork/poster-north.jpg",
            alt: "Áp phích phim Hành Trình Phương Bắc",
          },
        },
        {
          id: "demo-mua-tren-song-han",
          slug: "mua-tren-song-han",
          title: "Mưa Trên Sông Hàn",
          progressPercent: 31,
          poster: {
            src: "/artwork/poster-river.jpg",
            alt: "Áp phích phim Mưa Trên Sông Hàn",
          },
        },
        {
          id: "demo-mat-ma-cuu-long",
          slug: "mat-ma-cuu-long",
          title: "Mật Mã Cửu Long",
          progressPercent: 78,
          poster: {
            src: "/artwork/poster-code.jpg",
            alt: "Áp phích phim Mật Mã Cửu Long",
          },
        },
      ],
    },
    {
      id: "recommended",
      title: "Dành cho bạn",
      items: [
        {
          id: "demo-tan-cung-chan-troi",
          slug: "tan-cung-chan-troi",
          title: "Tận Cùng Chân Trời",
          year: 2025,
          quality: "4K",
          poster: {
            src: "/artwork/poster-horizon.jpg",
            alt: "Áp phích phim Tận Cùng Chân Trời",
          },
        },
        {
          id: "demo-vet-sang-cuoi-cung",
          slug: "vet-sang-cuoi-cung",
          title: "Vệt Sáng Cuối Cùng",
          year: 2024,
          quality: "FHD",
          poster: {
            src: "/artwork/poster-light.jpg",
            alt: "Áp phích phim Vệt Sáng Cuối Cùng",
          },
        },
        {
          id: "demo-vung-troi-tham",
          slug: "vung-troi-tham",
          title: "Vùng Trời Thẳm",
          year: 2026,
          quality: "4K",
          poster: {
            src: "/artwork/poster-sky.jpg",
            alt: "Áp phích phim Vùng Trời Thẳm",
          },
        },
        {
          id: "demo-nguoi-giu-den",
          slug: "nguoi-giu-den",
          title: "Người Giữ Đèn",
          year: 2023,
          quality: "FHD",
          poster: {
            src: "/artwork/poster-lighthouse.jpg",
            alt: "Áp phích phim Người Giữ Đèn",
          },
        },
        {
          id: "demo-thanh-am-duoi-bien",
          slug: "thanh-am-duoi-bien",
          title: "Thanh Âm Dưới Biển",
          year: 2025,
          quality: "FHD",
          poster: {
            src: "/artwork/poster-ocean.jpg",
            alt: "Áp phích phim Thanh Âm Dưới Biển",
          },
        },
        {
          id: "demo-dem-khong-ngu",
          slug: "dem-khong-ngu",
          title: "Đêm Không Ngủ",
          year: 2024,
          quality: "4K",
          poster: {
            src: "/artwork/poster-night.jpg",
            alt: "Áp phích phim Đêm Không Ngủ",
          },
        },
      ],
    },
  ],
};
