"use client";

import { useState } from "react";

import ModalVideo from "react-modal-video";

export default function Video() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <a onClick={() => setOpen(true)} className="video video-popup mfp-iframe">
        <i className="fa fa-play"></i>
      </a>

      <ModalVideo
        channel="youtube"
        autoplay
        isOpen={isOpen}
        videoId="g-jj4KrmYPI?si=7UN07ey9IAgu2ry5"
        onClose={() => setOpen(false)}
      />
    </>
  );
}
