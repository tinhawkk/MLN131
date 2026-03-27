import React from "react";

const YouTubeTab: React.FC = () => {
  const youtubeUrl = import.meta.env.VITE_YOUTUBE_URL;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        padding: "20px",
      }}
    >
      <h2>Sản phẩm video nổi bật</h2>
      <p>
        Đây là video giới thiệu sản phẩm của chúng tôi. Hãy cùng khám phá và
        trải nghiệm những tính năng độc đáo mà chúng tôi mang lại!
      </p>
      <iframe
        width="560"
        height="315"
        src={youtubeUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        style={{ borderRadius: "12px", maxWidth: "100%" }}
      ></iframe>
    </div>
  );
};

export default YouTubeTab;
