import React from 'react'

export interface CarouselCardProps {
  content?: string
  className?: string
}

/**
 * Individual card component for the carousel
 * Implements a sleek, glossy metallic design with drop shadows
 * Optimized as PureComponent to prevent unnecessary re-renders
 */
export class CarouselCard extends React.PureComponent<CarouselCardProps> {
  render() {
    const { content, className = '' } = this.props

    return (
      <div
        className={`
          bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9]
          rounded-full h-14 min-w-[192px] flex-shrink-0
          flex items-center justify-center
          shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.5)]
          border border-[#ffffff40]
          relative
          overflow-hidden
          will-change-transform
          ${className}
        `}
      >
        {/* Glossy highlight overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 rounded-full pointer-events-none" />
        
        {/* Content */}
        {content && (
          <span className="relative z-10 text-[#2a2727] font-medium text-sm px-6">
            {content}
          </span>
        )}
      </div>
    )
  }
}
