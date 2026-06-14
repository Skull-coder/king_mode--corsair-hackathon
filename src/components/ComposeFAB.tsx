"use client";

import { useState } from "react";
import { QuickCreateModal } from "./QuickCreateModal";

export function ComposeFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#5c4dff] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#5c4dff]/20 hover:bg-[#4b3be0] hover:scale-105 transition-all z-50"
        aria-label="Quick create"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <QuickCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}