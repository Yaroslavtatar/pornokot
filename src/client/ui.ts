import { generateSmartRandomCat, encodeGenomeToBase64, decodeGenomeFromBase64, ExtendedCatGenome } from '../shared/genome';

export interface UICallbacks {
  onProfileSave: (name: string, appearance: any) => void;
}

export function setupUI(callbacks: UICallbacks) {
  // Attach mutation & genome code share event listeners
  const randomCatBtn = document.getElementById('random-cat-btn');
  const mutateCatBtn = document.getElementById('mutate-cat-btn');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const pasteCodeBtn = document.getElementById('paste-code-btn');

  if (randomCatBtn) {
    randomCatBtn.addEventListener('click', () => {
      const newCat = generateSmartRandomCat();
      const codeInput = document.getElementById('genome-code-input') as HTMLInputElement;
      if (codeInput) codeInput.value = encodeGenomeToBase64(newCat);
    });
  }

  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      const codeInput = document.getElementById('genome-code-input') as HTMLInputElement;
      if (codeInput && codeInput.value) {
        navigator.clipboard.writeText(codeInput.value);
        alert('Код образа скопирован в буфер обмена!');
      }
    });
  }
}
