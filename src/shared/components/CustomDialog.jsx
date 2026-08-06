import React from 'react';

export default function CustomDialog({
    isOpen,
    onClose,
    title,
    children,
    footer,
    width = 'max-w-md'
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`bg-[#1c222c] border border-[#2a3240] rounded-xl shadow-2xl w-full ${width} flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                {/* Header */}
                {title && (
                    <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a3240] bg-[#1a212b]">
                        <h2 className="text-white text-lg font-bold tracking-wide">{title}</h2>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-[#252b36]"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="p-6 text-gray-300">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-[#2a3240] bg-[#1a212b] flex justify-end items-center gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
