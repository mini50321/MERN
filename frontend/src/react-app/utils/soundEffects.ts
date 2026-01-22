/**
 * Sound Effects Utility
 * Generates simple notification sounds using Web Audio API
 */

// Audio context singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a booking confirmation sound (upward chirp)
 */
export function playBookingConfirmSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Upward sweep from 400Hz to 800Hz
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.type = 'sine';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (error) {
    console.error('Error playing booking confirm sound:', error);
  }
}

/**
 * Play a partner acceptance sound (success chime - 3 notes)
 */
export function playPartnerAcceptSound() {
  try {
    const ctx = getAudioContext();
    
    // Play a pleasant 3-note success chime: C5 - E5 - G5
    const notes = [
      { freq: 523.25, start: 0, duration: 0.15 },      // C5
      { freq: 659.25, start: 0.1, duration: 0.15 },    // E5
      { freq: 783.99, start: 0.2, duration: 0.25 }     // G5
    ];
    
    notes.forEach(note => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sine';
      
      // Envelope
      const startTime = ctx.currentTime + note.start;
      const endTime = startTime + note.duration;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
      
      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  } catch (error) {
    console.error('Error playing partner accept sound:', error);
  }
}

/**
 * Play an order completion sound (completion tone)
 */
export function playOrderCompleteSound() {
  try {
    const ctx = getAudioContext();
    
    // Play a satisfying completion tone: G5 - C6
    const notes = [
      { freq: 783.99, start: 0, duration: 0.2 },     // G5
      { freq: 1046.50, start: 0.15, duration: 0.3 }  // C6
    ];
    
    notes.forEach(note => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sine';
      
      // Envelope
      const startTime = ctx.currentTime + note.start;
      const endTime = startTime + note.duration;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
      
      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  } catch (error) {
    console.error('Error playing order complete sound:', error);
  }
}

/**
 * Play a general notification sound (single gentle ping)
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Single tone at 800Hz
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    // Quick ping envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}
