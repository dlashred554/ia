const ARC = [
  'Opening: establish the setting and introduce the main character',
  'Development: the action moves forward',
  'Complication: a challenge or twist appears',
  'Climax: the most intense moment',
  'Resolution: a satisfying closing moment',
];

function planScenes(prompt, style, totalSeconds, clipSeconds) {
  const n = Math.max(1, Math.ceil(totalSeconds / clipSeconds));
  const styleTxt = style ? `Visual style: ${style}. ` : '';
  if (n === 1) return [{ prompt: `${prompt.trim()}. ${styleTxt}Vertical 9:16.`, seconds: totalSeconds }];
  const beats = prompt.split(/(?<=[.!?])\s+/).filter(Boolean);
  const bible = `Vertical 9:16 video. ${styleTxt}Keep exactly the same characters, outfits, locations, color palette and lighting in every scene. Overall story: ${prompt.trim().slice(0,600)}`;
  return Array.from({length:n},(_,i)=>{
    const beat = beats.length >= n ? beats[Math.floor(i*beats.length/n)] : ARC[Math.floor(i*ARC.length/n)];
    const seconds = i<n-1 ? clipSeconds : totalSeconds-clipSeconds*(n-1);
    return {prompt:`${bible} Scene ${i+1} of ${n} — ${beat}`,seconds};
  });
}

module.exports={planScenes};