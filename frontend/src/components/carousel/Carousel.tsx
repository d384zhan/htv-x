import React from 'react'
import { CarouselCard, CarouselCardProps } from './CarouselCard'

export interface CarouselProps {
  cards?: Omit<CarouselCardProps, 'className'>[]
  className?: string
}

/**
 * Carousel component that displays exactly 5 cards in an infinite scrolling loop
 * Optimized with PureComponent to prevent unnecessary re-renders
 * Implements OOP best practices with encapsulation and single responsibility
 */
export class Carousel extends React.PureComponent<CarouselProps> {
  /**
   * Default cards configuration - ensures exactly 5 cards
   */
  private static readonly DEFAULT_CARDS: Omit<CarouselCardProps, 'className'>[] = [
    { content: 'Card 1' },
    { content: 'Card 2' },
    { content: 'Card 3' },
    { content: 'Card 4' },
    { content: 'Card 5' },
  ]

  /**
   * Memoized cards array to prevent recalculation on every render
   */
  private cardsCache: Omit<CarouselCardProps, 'className'>[] | null = null
  private lastPropsCards: Omit<CarouselCardProps, 'className'>[] | undefined = undefined

  /**
   * Gets the cards to display, ensuring exactly 5 cards
   * Cached to prevent unnecessary array operations
   */
  private getCards(): Omit<CarouselCardProps, 'className'>[] {
    const cards = this.props.cards || Carousel.DEFAULT_CARDS
    
    // Return cached result if props haven't changed
    if (this.cardsCache && this.lastPropsCards === this.props.cards) {
      return this.cardsCache
    }
    
    // Ensure exactly 5 cards
    let result: Omit<CarouselCardProps, 'className'>[]
    if (cards.length < 5) {
      // Pad with empty cards if less than 5
      result = [...cards, ...Array(5 - cards.length).fill({ content: '' })]
    } else if (cards.length > 5) {
      // Take only first 5 if more than 5
      result = cards.slice(0, 5)
    } else {
      result = cards
    }
    
    // Cache the result
    this.cardsCache = result
    this.lastPropsCards = this.props.cards
    
    return result
  }

  /**
   * Renders a single set of carousel cards
   * Optimized with stable keys for React reconciliation
   */
  private renderCardSet(cards: Omit<CarouselCardProps, 'className'>[], keyPrefix: string) {
    return cards.map((card, index) => (
      <CarouselCard
        key={`${keyPrefix}-${index}`}
        content={card.content}
      />
    ))
  }

  render() {
    const { className = '' } = this.props
    const cards = this.getCards()

    return (
      <div className={`relative mb-6 h-14 overflow-hidden ${className}`}>
        {/* Fade overlays on edges for smooth appearance */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#181716] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#181716] to-transparent z-10 pointer-events-none" />

        {/* Scrolling carousel - multiple duplicates ensure seamless loop on all screen sizes */}
        <div className="flex gap-4 animate-carousel">
          {/* Render 4 sets of cards to ensure smooth scrolling on ultra-wide screens */}
          {this.renderCardSet(cards, 'set1')}
          {this.renderCardSet(cards, 'set2')}
          {this.renderCardSet(cards, 'set3')}
          {this.renderCardSet(cards, 'set4')}
        </div>
      </div>
    )
  }
}
