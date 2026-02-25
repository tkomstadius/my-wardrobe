import { useState } from 'react';
import type { OutfitSeasonalStat, Season } from '../../utils/statsCalculations';
import { Heading } from '../common/ui/Heading';
import { Text } from '../common/ui/Text';
import styles from './SeasonalOutfitsSection.module.css';

const SEASON_EMOJI: Record<Season, string> = {
  winter: '\u2744\uFE0F',
  spring: '\uD83C\uDF38',
  summer: '\u2600\uFE0F',
  fall: '\uD83C\uDF42',
};

interface SeasonalOutfitsSectionProps {
  outfitSeasons: OutfitSeasonalStat[];
}

export function SeasonalOutfitsSection({ outfitSeasons }: SeasonalOutfitsSectionProps) {
  const [expandedSeason, setExpandedSeason] = useState<Season | null>(null);

  return (
    <section className={styles.section}>
      <Heading size="4" className={styles.sectionTitle}>
        Seasonal Outfits
      </Heading>

      <div className={styles.seasonGrid}>
        {outfitSeasons.map((season) => (
          <button
            key={season.season}
            type="button"
            className={`${styles.seasonCard} ${expandedSeason === season.season ? styles.seasonCardActive : ''}`}
            onClick={() =>
              setExpandedSeason((prev) => (prev === season.season ? null : season.season))
            }
            disabled={season.count === 0}
          >
            <Text size="4">{SEASON_EMOJI[season.season]}</Text>
            <Text size="1" weight="medium">
              {season.label}
            </Text>
            <Text size="3" weight="bold">
              {season.count}
            </Text>
          </button>
        ))}
      </div>

      {expandedSeason !== null &&
        (() => {
          const season = outfitSeasons.find((s) => s.season === expandedSeason);
          if (!season || season.outfits.length === 0) return null;
          return (
            <div className={styles.subsection}>
              <Text size="2" weight="medium" className={styles.subsectionTitle}>
                {SEASON_EMOJI[season.season]} {season.label}
              </Text>
              <div className={styles.outfitStrip}>
                {season.outfits.map((outfit) => (
                  <div key={outfit.id} className={styles.outfitThumb}>
                    {outfit.photo ? (
                      <img src={outfit.photo} alt={`Outfit from ${season.label}`} />
                    ) : (
                      <div className={styles.outfitThumbPlaceholder}>
                        <Text size="3" color="gray">
                          ?
                        </Text>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
    </section>
  );
}
