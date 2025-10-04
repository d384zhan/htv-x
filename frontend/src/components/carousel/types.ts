/**
 * Type definitions for Carousel components
 * Centralizes all carousel-related types for better maintainability
 */

/**
 * Properties for individual carousel card component
 */
export interface CarouselCardProps {
  /** Text content to display in the card */
  content?: string
  /** Additional CSS classes to apply */
  className?: string
}

/**
 * Properties for the main carousel component
 */
export interface CarouselProps {
  /** Array of card configurations - will be normalized to exactly 5 cards */
  cards?: Omit<CarouselCardProps, 'className'>[]
  /** Additional CSS classes to apply to the carousel container */
  className?: string
}

/**
 * Constants used across carousel components
 */
export const CAROUSEL_CONSTANTS = {
  /** Number of cards to display in the carousel */
  CARD_COUNT: 5,
  /** Minimum width of each card in pixels */
  CARD_MIN_WIDTH: 192,
  /** Height of each card in pixels */
  CARD_HEIGHT: 56,
  /** Gap between cards in pixels */
  CARD_GAP: 16,
} as const
