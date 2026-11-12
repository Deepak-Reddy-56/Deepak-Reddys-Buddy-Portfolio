import { Icon } from '../../components/ui/Icon';
import styles from './Intro.module.css';

type IntroControlsProps = {
  soundEnabled: boolean;
  soundSupported: boolean;
  onSound: (on: boolean) => void;
  onSkip: () => void;
};

/** Sound On/Off and Skip intro — available for the whole sequence. */
export function IntroControls({ soundEnabled, soundSupported, onSound, onSkip }: IntroControlsProps) {
  return (
    <>
      {soundSupported ? (
        <div className={styles.sound} role="group" aria-label="Sound">
          <span className={styles.soundLabel} aria-hidden="true">
            <Icon name={soundEnabled ? 'sound-on' : 'sound-off'} size={15} />
            Sound
          </span>
          <button type="button" className={styles.soundOption} data-enter-runs aria-pressed={soundEnabled} onClick={() => onSound(true)}>
            On
          </button>
          <button type="button" className={styles.soundOption} data-enter-runs aria-pressed={!soundEnabled} onClick={() => onSound(false)}>
            Off
          </button>
        </div>
      ) : null}
      <button type="button" className={styles.skip} onClick={onSkip}>
        Skip intro
      </button>
    </>
  );
}
