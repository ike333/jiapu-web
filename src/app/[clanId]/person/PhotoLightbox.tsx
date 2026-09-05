"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  selfPhoto: string | null;
  spousePhoto: string | null;
  personName: string;
  spouseName?: string;
  gender?: "male" | "female";
}

export function PhotoLightbox({ selfPhoto, spousePhoto, personName, spouseName, gender }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <div className="flex gap-3 shrink-0 items-start">
        {selfPhoto && (
          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => setLightbox(selfPhoto)}
          >
            <img
              src={selfPhoto}
              alt={`${personName}本人`}
              className="w-28 h-36 object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary-400 transition-colors"
            />
            <div className="text-xs text-gray-600 mt-0.5">本人</div>
          </div>
        )}
        {spousePhoto && (
          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => setLightbox(spousePhoto)}
          >
            <img
              src={spousePhoto}
              alt={spouseName || (gender === "male" ? "妻" : "夫")}
              className="w-28 h-36 object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary-400 transition-colors"
            />
            <div className="text-xs text-gray-600 mt-0.5">
              {gender === "male" ? "妻" : "夫"}
            </div>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X size={32} />
          </button>
          <img
            src={lightbox}
            alt="照片"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
